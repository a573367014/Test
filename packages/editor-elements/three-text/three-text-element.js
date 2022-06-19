import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import { throttle, cloneDeep } from 'lodash';
import template from './three-text-element.html';
import utils from '@gaoding/editor-framework/src/utils/utils';

export default inherit(BaseElement, {
    name: 'threeText-element',
    template,
    props: ['editor', 'global', 'model', 'options'],
    data() {
        return {
            layerPickerSignal: false,
            renderInit: false,
            renderInitOver: false,
            scaleRatio: 1,
            compositeScaleRatio: 1,
            need2DText: false,
            isRendering: true,
            isNeedTime: false,
            controlData: {
                hasEyeDistanceChanged: true,
                hasFontChanged: true,
                hasModelChanged: true,
                hasLightChanged: true,
                hasCameraChanged: true,
                hasMaterialsChanged: true,
                hasEnvChanged: true,
                hasCanvasResize: true,
                hasShadowChanged: true,
                compositeZoom: this.global.zoom * window.devicePixelRatio,
            },
            devicePixelRatio: (window && window.devicePixelRatio) || 1,
        };
    },
    computed: {
        supportTransform() {
            return !!this.model.containerTransform;
        },
        canvasStyle() {
            return {
                overflow: this.model.$showCoordinate ? 'visible' : 'hidden',
            };
        },
        diviateX() {
            const offsetX = 2 * (-(this.model.centerRatioX || -0.5) - 0.5) * this.model.width;
            return offsetX * this.global.zoom;
        },
        diviateY() {
            const offsetY = 2 * (-(this.model.centerRatioY || -0.5) - 0.5) * this.model.height;
            return offsetY * this.global.zoom;
        },
        opacity() {
            return this.model.opacity;
        },
        originalContent() {
            let content = '';
            const { contents } = this.model;
            contents.forEach((data) => {
                content += data.content;
            });
            return content;
        },

        isPreviewMode() {
            return this.options.mode === 'preview';
        },
        isMirrorMode() {
            // 有 imageUrl 才算有效的 mirror 模式，不然依然走3D渲染
            return this.options.mode === 'mirror' && this.model.imageUrl;
        },
        showPlainText() {
            return !this.model.imageUrl && this.isRendering;
        },
        textStyle() {
            return {
                fontFamily: this.model.fontFamily,
                fontSize: this.model.fontSize + 'px',
                verticalAlign: this.model.verticalAlign,
                color: this.model.layers[0].frontMaterials.albedo.color,
                transform: this.model.transform,
                transformOrigin: '0 0',
                width: this.model.width,
                height: this.model.height,
                opacity: this.showPlainText ? 1 : 0,
                lineHeight: this.model.height + 'px',
            };
        },
        linkSelected() {
            const element = this.editor.currentSubElement || this.editor.currentElement || {};
            return this.isLinkWith(element);
        },
        showWithImg() {
            return !this.renderInit;
        },
    },
    methods: {
        async load() {
            this.initControlData();
            this.initModelWatcher();
            this.initLayerWatcher();
            this.syncColorToContents();

            if (this.model.imageUrl) {
                await utils.loadImage(this.model.imageUrl, this.options.fitCrossOrigin);
            } else {
                await this.multipleRender(false);
            }
        },
        async initPreviewCanvas() {
            this.renderInit = true;
            await this.$nextTick();
            this.canvas = this.$refs.glCanvas;
            this.ctx = this.canvas.getContext('2d');
            this.renderInitOver = true;
        },
        initControlData() {
            const { controlData } = this;
            controlData.hasEyeDistanceChanged = false;
            controlData.hasFontChanged = false;
            controlData.hasModelChanged = false;
            controlData.hasLightChanged = false;
            controlData.hasCameraChanged = false;
            controlData.hasMaterialsChanged = false;
            controlData.hasEnvChanged = false;
            controlData.hasCanvasResize = false;
            controlData.hasShadowChanged = false;
            controlData.compositeZoom = this.global.zoom * window.devicePixelRatio;
            controlData.mode = this.options.mode;
        },
        initModelWatcher() {
            [
                'model.shadow',
                'model.deformation',
                'model.warpByWord',
                'model.environment',
                'model.pointLights',
                'model.hemiLight',
            ].forEach((prop) => {
                this.$watch(prop, {
                    deep: true,
                    handler() {
                        this.multipleRender();
                    },
                });
            });
            [
                'model.isOrtho',
                'model.viewAngle',
                'model.isFloodLightOff',
                'model.$showCoordinate',
            ].forEach((prop) => {
                this.$watch(prop, () => {
                    this.multipleRender();
                });
            });

            [
                'model.content',
                'model.lineHeight',
                'model.letterSpacing',
                'model.textAlign',
                'model.writingMode',
                'originalContent',
            ].forEach((prop) => {
                this.$watch(prop, () => {
                    this.controlData.hasModelChanged = true;
                });
            });
        },
        initLayerWatcher() {
            const { model } = this;
            const reMaterials = /Materials/;

            const keys = Object.keys(model.layers[0]);
            const materialTypes = keys.filter((key) => reMaterials.test(key));
            const modelProps = keys.filter((key) => !reMaterials.test(key));

            const handleByUpdateMaterials = (target) =>
                this.$watch(target, () => {
                    this.controlData.hasMaterialsChanged = true;
                });
            const handleByUpdateModel = (target) =>
                this.$watch(target, () => {
                    this.controlData.hasModelChanged = true;
                });

            this.model.layers.forEach((layer, i) => {
                materialTypes.forEach((materialType) => {
                    const getMaterialsProp = (prop) => this.model.layers[i][materialType][prop];
                    handleByUpdateMaterials(() => getMaterialsProp('metalRoughness'));
                    handleByUpdateMaterials(() => getMaterialsProp('normal'));
                    handleByUpdateMaterials(() => getMaterialsProp('scale'));
                    handleByUpdateMaterials(() =>
                        Object.assign({}, cloneDeep(getMaterialsProp('albedo'))),
                    );
                    if (getMaterialsProp('enable') !== undefined) {
                        handleByUpdateMaterials(() => getMaterialsProp('enable'));
                    }
                    handleByUpdateMaterials(() => getMaterialsProp('metalStrength'));
                    handleByUpdateMaterials(() => getMaterialsProp('roughnessStrength'));
                    handleByUpdateMaterials(() => getMaterialsProp('albedoStrength'));
                    handleByUpdateMaterials(() => getMaterialsProp('normalStrength'));
                    handleByUpdateMaterials(() => getMaterialsProp('normalDisable'));
                });
                modelProps.forEach((prop) => {
                    handleByUpdateModel(() => this.model.layers[i][prop]);
                });
            });
        },
        async initRenderer() {
            this.model.resize = 1; // 用来调节编辑窗口拖拽控制点数量
            this.model.$fontData = this.getFontData();
            await this.initPreviewCanvas();
        },

        async multipleRender(needUpdateImageUrl = true) {
            if (this.editor.global.$draging) return;
            this.isRendering = true;
            if (needUpdateImageUrl) {
                this.model.imageUrl = null;
            }
            if (!this.renderInitOver) {
                await this.initRenderer();
            }
            try {
                setTimeout(() => {
                    this.isNeedTime = true;
                }, 400);
                this.controlData.compositeZoom = this.global.zoom * window.devicePixelRatio;
                await this.editor.safeThreeTextRender(this.controlData, this.model, this.canvas);
                this.setBBox();
                this.initControlData();

                if (!this.layerPickerSignal && this.isDesignMode) {
                    this.layerPickerSignal = true;
                    this.editor.lazyUpdatePicker();
                }
                this.need2DText = false;
            } catch (error) {
                this.need2DText = true;
                console.error(error);
                this.$events.$emit('element.loadError', error, this.model);
            }
            this.isNeedTime = false;
            this.isRendering = false;
            // this.$events.$emit('element.loaded', this.model);
            this.scaleRatio = 1;
            this.compositeScaleRatio =
                (this.scaleRatio * this.global.zoom) / this.canvas.compositeZoom;
        },
        setBBox() {
            const { model, canvas } = this;
            const { modelCube, compositeZoom } = canvas;
            if (modelCube) {
                model.modelCube.forEach((val, i) => {
                    model.modelCube[i] = modelCube[i];
                });

                let { top, left, width, height, rotation } = model;
                let x = (-0.5 - model.centerRatioX) * width;
                let y = (-0.5 - model.centerRatioY) * height;
                let diviateX = x * Math.cos(rotation) - y * Math.sin(rotation);
                let diviateY = x * Math.sin(rotation) + y * Math.cos(rotation);
                const [centerX, centerY] = [
                    left + 0.5 * width + diviateX,
                    top + 0.5 * height + diviateY,
                ];

                width = ((modelCube[1] - modelCube[0]) * 0.5 * canvas.width) / compositeZoom;
                height = ((modelCube[3] - modelCube[2]) * 0.5 * canvas.height) / compositeZoom;

                model.centerRatioX = modelCube[0] / (modelCube[1] - modelCube[0]);
                model.centerRatioY = -modelCube[3] / (modelCube[3] - modelCube[2]);

                x = (0.5 + model.centerRatioX) * width;
                y = (0.5 + model.centerRatioY) * height;

                diviateX = x * Math.cos(rotation) - y * Math.sin(rotation);
                diviateY = x * Math.sin(rotation) + y * Math.cos(rotation);

                const newLeft = centerX + diviateX - 0.5 * width;
                const newTop = centerY + diviateY - 0.5 * height;

                const dw = width - model.width;
                const dh = height - model.height;

                if (!isNaN(newLeft * newTop) && Math.hypot(dw, dh) > 0.1) {
                    model.left = newLeft;
                    model.top = newTop;
                    model.width = width;
                    model.height = height;

                    const groups = this.editor.getParentGroups(this.model);
                    // groups 🈶️浅入深，应反向更新
                    for (let i = groups.length - 1; i >= 0; i--) {
                        this.$events.$emit('group.boundingReset', groups[i]);
                    }
                }
            }
        },

        getFontData() {
            return this.options.fontsMap[this.model.fontFamily || this.options.defaultFont];
        },
        // 欧妮说编辑态颜色应该和3D文字颜色同步
        syncColorToContents() {
            this.$watch(
                () => {
                    const { frontMaterials } = this.model.layers[0];
                    return frontMaterials.albedo.color;
                },
                (color) => {
                    this.model.contents.forEach((content) => {
                        content.color = color;
                    });
                },
            );
        },
    },
    events: {
        'element.transformStart'(model) {
            if (model !== this.model) return;
            this.oldWith = this.model.width;
            this.oldFontSize = this.model.fontSize;
            this.oldLetterSpacing = this.model.letterSpacing;
        },

        'element.transformResize'(drag, model) {
            if (model !== this.model) return;
            this.scaleRatio = this.model.width / this.oldWith;
            const canvasScaleRaito =
                this.global.zoom / ((this.canvas && this.canvas.compositeZoom) || 1);
            this.compositeScaleRatio = this.scaleRatio * canvasScaleRaito;
            this.model.fontSize = this.oldFontSize * this.scaleRatio;
            // 编辑态拖拽显示框修改文字大小
            this.model.contents.forEach((text) => {
                this.$set(text, 'fontSize', this.model.fontSize);
            });
            this.model.letterSpacing = this.oldLetterSpacing * this.scaleRatio;
        },

        'element.transformEnd'(model, drag, { action }) {
            if (this.isModelRelative(model) && action === 'resize') {
                this.controlData.hasCanvasResize = true;
                this.multipleRender();
            }
        },
        'element.change'(model, propName) {
            if (propName === 'contents' && this.isLinkWith(model)) {
                const content = model.contents
                    .reduce((list, content) => {
                        list.push(content.content);
                        return list;
                    }, [])
                    .join('');

                this.editor.changeElement(
                    {
                        contents: [{ content: content }],
                        content,
                    },
                    this.model,
                    false,
                );
                this.syncRect();
            }
        },
    },
    watch: {
        // 非常高耗的操作，节流
        'controlData.hasModelChanged'(val) {
            if (val) {
                if (!this._lazyModelRender) {
                    this._lazyModelRender = throttle(async () => {
                        this.scaleRatio = 1;
                        await this.multipleRender();
                    }, 2000);
                }
                this._lazyModelRender();
            }
        },
        // 高频操作
        'model.fontSize'() {
            this.hasCanvasResize = true;
            this.multipleRender();
        },
        'controlData.hasMaterialsChanged'(val) {
            if (val) {
                this.multipleRender();
            }
        },
        'model.fontFamily'() {
            this.controlData.hasFontChanged = true;
            this.controlData.hasModelChanged = true;
            this.model.$fontData = this.getFontData();
        },
        'model.rotate3d'() {
            // 高频调用
            this.controlData.hasCameraChanged = true;
            this.multipleRender();
        },
        'global.zoom'(val) {
            // ppt 模式下 this.global.$loaded 一直为 false， 需要获取当前 layout 的状态
            if (this.global.$loaded || this.editor.currentLayout.$loaded) {
                this.controlData.compositeZoom = val;
                this.multipleRender(false);
            }
        },
    },
});
