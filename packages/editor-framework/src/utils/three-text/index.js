import loader from '@gaoding/editor-utils/loader';

import { createPromiseQueue } from '../promise-queue';
import { getThreeTextKey } from './utils/get-key';
import { cloneDeep, isEqual } from 'lodash';
import { LRUMap } from 'lru_map';
import { ThreeTextRenderer, getModelSize } from '@gaoding/beam-renderers';

const timeOut = 20000;
const promiseQueue = createPromiseQueue({
    timeout: timeOut,
});

export default class ThreeTextEngine {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.renderer = new ThreeTextRenderer(this.canvas);
        this.controlData = {
            hasEyeDistanceChanged: true,
            hasFontChanged: true,
            hasModelChanged: true,
            hasLightChanged: true,
            hasCameraChanged: true,
            hasMaterialsChanged: true,
            hasEnvChanged: true,
            hasCanvasResize: true,
            hasShadowChanged: true,
            hasCoordChanged: true,
        };
        this.materialsSignals = [true, true, true, true, true, true];
        this.canvasMap = new LRUMap(10);
        this.init();
    }

    async init() {
        if (!this.initialized) {
            await this.renderer.init();
            this.initialized = true;
        }
    }

    async prepareFont(model) {
        loader.loadFont(
            {
                ...model.$fontData,
                useLocal: this.options?.mode === 'mirror',
            },
            timeOut,
        );
        await this.renderer.prepareFont(model);
    }

    async renderAll(outControlData, model, outCanvas) {
        // console.time('renderAll');
        if (!model.$fontData) {
            this.renderer.meshError = true;
            // console.timeEnd('renderAll');
            return;
        }
        // console.time('预处理');

        if (
            outControlData.mode !== 'preview' &&
            outControlData.compositeZoom !== this.canvas.compositeZoom
        ) {
            outControlData.hasCanvasResize = true;
        }

        if (!this.initialized) {
            await this.init();
        }

        const { controlData, renderer, canvas } = this;
        Object.assign(controlData, outControlData);
        this.initControlData(outControlData, false);
        // console.time('compareModel');
        this.compareModel(controlData, this.model, model);
        // console.timeEnd('compareModel');

        const key = getThreeTextKey(model, outControlData.compositeZoom);
        const stashCanvas = this.canvasMap.get(key);

        let resultCanvas;
        // console.timeEnd('预处理');

        if (stashCanvas) {
            resultCanvas = stashCanvas;
        } else {
            this.model = cloneDeep(model);
            if (!controlData.hasModelChanged && controlData.hasEyeDistanceChanged) {
                // console.time('updateBBox');
                renderer.updateBBox(model);
                renderer.updateEyeDistance(model);
                // console.timeEnd('updateBBox');
            }
            // 加载字体，高耗操作
            if (controlData.hasFontChanged) {
                // console.time('preFont');
                await this.prepareFont(model);
                // console.timeEnd('preFont');
            }
            // 加载材质，高耗操作
            if (controlData.hasMaterialsChanged) {
                // console.time('updateMaterials');
                // console.info(this.materialsSignals);
                await renderer.loadMaterials(model, this.materialsSignals);
                const layer = model.layers[0];
                const sideMaterials = layer.sideMaterials.enable
                    ? layer.sideMaterials
                    : layer.frontMaterials;
                const bevelMaterials = layer.bevelMaterials.enable
                    ? layer.bevelMaterials
                    : sideMaterials;
                const materials = [layer.frontMaterials, bevelMaterials, sideMaterials];
                renderer.updateMaterials(materials, this.materialsSignals);
                // console.timeEnd('updateMaterials');
            }
            // 加载材质，高耗操作
            if (controlData.hasEnvChanged) {
                // console.time('updateEnvironment');
                await renderer.updateEnvironment(model);
                // console.timeEnd('updateEnvironment');
            }
            // 更新渲染器的 canvas 大小, 涉及到大量的内存改动（非人为操作） 高耗操作
            if (
                !controlData.hasModelChanged &&
                (controlData.hasCanvasResize || controlData.hasEyeDistanceChanged)
            ) {
                // console.time('updateCanvasSize');
                renderer.updateCanvasSize(model, outControlData.compositeZoom);
                // console.timeEnd('updateCanvasSize');
            }
            // 更新光照，低耗操作
            if (controlData.hasLightChanged) {
                // console.time('updateLight');
                renderer.updateFloodLights(model);
                // console.timeEnd('updateLight');
            }
            // 更新模型数据 高耗操作
            if (controlData.hasModelChanged || controlData.hasFontChanged) {
                // console.time('updateTextModel');
                try {
                    await renderer.updateTextModel(model);
                    renderer.updateCanvasSize(model, controlData.compositeZoom);
                    renderer.updateCamera(model);
                    renderer.meshError = false;
                } catch (error) {
                    renderer.meshError = true;
                    throw error;
                }
                // console.timeEnd('updateTextModel');
            }
            // 更新 mvp 矩阵 低耗操作
            if (
                !controlData.hasModelChanged &&
                (controlData.hasCameraChanged || controlData.hasEyeDistanceChanged)
            ) {
                // console.time('updateCamera');
                renderer.updateCamera(model);
                // console.timeEnd('updateCamera');
            }
            if (controlData.hasShadowChanged) {
                // console.time('updateShadow');
                renderer.updateShadow(model);
                // console.timeEnd('updateShadow');
            }

            if (
                Object.keys(controlData).some((key) => {
                    const istrue = controlData[key] === true;
                    // if(istrue) console.info(key);
                    return istrue;
                })
            ) {
                // console.time('画图');
                // console.info(outControlData.mode);
                renderer.render(model);
                if (!renderer.meshError) {
                    const mvpMatrix = renderer.commonUniforms.state.u_MVPMatrix;
                    const shadowMatrix = renderer.shadowUniforms.state.u_ShadowMatrix;
                    if (!renderer.boundingBox) {
                        renderer.boundingBox = renderer.updateBBox(model);
                    }
                    canvas.modelCube = getModelSize(
                        renderer.boundingBox,
                        mvpMatrix,
                        shadowMatrix,
                        model.shadow,
                    );
                }
                // console.timeEnd('画图');
            }
            // console.time('缓存');
            // 如果mesh改变则缓存canvas
            if (controlData.hasModelChanged) {
                const cacheCanvas = document.createElement('canvas');
                cacheCanvas.width = this.canvas.width;
                cacheCanvas.height = this.canvas.height;
                const ctx = cacheCanvas.getContext('2d');
                if (!renderer.meshError) {
                    ctx.drawImage(this.canvas, 0, 0);
                    cacheCanvas.modelCube = cloneDeep(canvas.modelCube);
                    cacheCanvas.compositeZoom = canvas.compositeZoom;
                    cacheCanvas.scaleRatio = canvas.scaleRatio;
                    this.canvasMap.set(key, cacheCanvas);
                }
                resultCanvas = cacheCanvas;
            } else {
                resultCanvas = canvas;
            }
            // console.timeEnd('缓存');
        }
        if (!(resultCanvas && resultCanvas.width)) {
            // console.timeEnd('renderAll');
            return;
        }
        // console.time('转绘');
        const outCtx = outCanvas.getContext('2d');
        outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);
        if (!renderer.meshError) {
            outCanvas.width = resultCanvas.width;
            outCanvas.height = resultCanvas.height;
            outCanvas.modelCube = cloneDeep(resultCanvas.modelCube);
            outCanvas.compositeZoom = resultCanvas.compositeZoom;
            outCanvas.scaleRatio = resultCanvas.scaleRatio;
            outCtx.drawImage(resultCanvas, 0, 0);
        }
        // console.timeEnd('转绘');
        // console.timeEnd('renderAll');
    }

    async requestRenderAll(controlData, model, canvas) {
        // 安全检查
        if (!controlData || !model || !canvas) {
            throw new Error('requestRenderAll 获取数据异常');
        }
        const promise = await promiseQueue.run(
            canvas, // 使用canvas做 key
            this.renderAll.bind(this, controlData, model, canvas),
        );

        return promise;
        // await this.renderAll(controlData, model, canvas);
    }

    initControlData(controlData, state = false) {
        for (const data in controlData) {
            if (/^has/.test(data)) {
                controlData[data] = state;
            }
        }
    }

    // model2 is new
    compareModel(controlData, model1, model2) {
        if (!model1 || !model2) {
            this.initControlData(controlData, true);
            return;
        }

        controlData.hasEyeDistanceChanged =
            model1.viewAngle !== model2.viewAngle || model1.isOrtho !== model2.isOrtho;
        controlData.hasFontChanged =
            controlData.hasFontChanged || model1.fontFamily !== model2.fontFamily;
        controlData.hasModelChanged = this.getWetherModelChanged(model1, model2);
        controlData.hasLightChanged =
            controlData.hasLightChanged ||
            !isEqual(model1.pointLights, model2.pointLights) ||
            !isEqual(model1.hemiLight, model2.hemiLight) ||
            model1.isFloodLightOff !== model2.isFloodLightOff;
        controlData.hasCameraChanged =
            !isEqual(model1.rotate3d, model2.rotate3d) || model1.isOrtho !== model2.isOrtho;
        controlData.hasMaterialsChanged = this.getWetherMaterialChanged(model1, model2);

        controlData.hasEnvChanged =
            controlData.hasEnvChanged || !isEqual(model1.environment, model2.environment);
        controlData.hasCanvasResize =
            controlData.hasCanvasResize || model1.fontSize !== model2.fontSize;
        controlData.hasShadowChanged = !isEqual(model1.shadow, model2.shadow);
        controlData.hasCoordChanged = model1.$showCoordinate !== model2.$showCoordinate;
    }

    getWetherModelChanged(model1, model2) {
        const layer1 = model1.layers[0];
        const layer2 = model2.layers[0];
        const isChanged =
            this.hasContentsChanged(model1.contents, model2.contents) || //    文字内容
            model1.fontFamily !== model2.fontFamily || //    字体
            !isEqual(model1.deformation, model2.deformation) || //  变形
            !isEqual(model1.warpByWord, model2.warpByWord) || //  逐字偏移
            model1.textAlign !== model2.textAlign || //    文字对其方式
            model1.letterSpacing !== model2.letterSpacing || // 24    字间距
            model1.lineHeight !== model2.lineHeight || //   行间距
            model1.shadow.enable !== model2.shadow.enable || // shadow.enable 会影响画布大小，视距等参数
            layer1.bevelSize !== layer2.bevelSize || //     3D 模型控制参数
            layer1.bevelThickness !== layer2.bevelThickness || // 3D 模型控制参数
            layer1.bevelSegments !== layer2.bevelSegments || // 3D 模型控制参数
            layer1.curveSegments !== layer2.curveSegments || // 3D 模型控制参数
            layer1.extrudeDepth !== layer2.extrudeDepth || // 3D 模型控制参数
            layer1.extrudeOffsetX !== layer2.extrudeOffsetX || // 3D 模型控制参数
            layer1.extrudeOffsetY !== layer2.extrudeOffsetY || // 3D 模型控制参数
            layer1.expand !== layer2.expand; // 3D 模型控制参数

        return isChanged;
    }

    // model2 is new
    getWetherMaterialChanged(model1, model2) {
        const layer1 = model1.layers[0];
        const layer2 = model2.layers[0];

        const getMaterialTexChange = (material1, material2) => {
            return (
                material1.enable !== material2.enable ||
                material1.metalRoughness !== material2.metalRoughness ||
                material1.normal !== material2.normal ||
                material1.albedo.image !== material2.albedo.image
            );
        };

        this.materialsSignals[0] = getMaterialTexChange(
            layer1.frontMaterials,
            layer2.frontMaterials,
        );
        this.materialsSignals[1] =
            this.materialsSignals[0] || !isEqual(layer1.frontMaterials, layer2.frontMaterials);

        this.materialsSignals[4] = layer2.sideMaterials.enable
            ? getMaterialTexChange(layer1.sideMaterials, layer2.sideMaterials)
            : this.materialsSignals[0];
        this.materialsSignals[5] =
            layer1.sideMaterials.enable || layer2.sideMaterials.enable
                ? this.materialsSignals[4] || !isEqual(layer1.sideMaterials, layer2.sideMaterials)
                : this.materialsSignals[1];

        this.materialsSignals[2] = layer2.bevelMaterials.enable
            ? getMaterialTexChange(layer1.bevelMaterials, layer2.bevelMaterials)
            : this.materialsSignals[4];
        this.materialsSignals[3] =
            layer1.bevelMaterials.enable || layer2.bevelMaterials.enable
                ? this.materialsSignals[2] || !isEqual(layer1.bevelMaterials, layer2.bevelMaterials)
                : this.materialsSignals[5];
        return this.materialsSignals.some((signal) => signal);
    }

    hasContentsChanged(oldContents, newContents) {
        const i = oldContents.length;
        const j = newContents.length;
        if (i !== j) {
            return true;
        }
        for (let k = 0; k < i; k++) {
            const isChanged = oldContents[k].content !== newContents[k].content;
            if (isChanged) {
                return true;
            }
        }
        return false;
    }
}
