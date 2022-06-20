import { ResourceTypes, Offscreen2DCommand } from '@gaoding/beam';
import { PbrRenderer } from './pbr-renderer';
import { VoidFill, Blur } from '../plugins/shadow-plugins';
import { Mesh } from '../plugins';
import {
    rotateCamera,
    getTexMat,
    getTexture,
    getMapUrls,
    getColorVec,
    getFontParserParameter,
    getColorVec3,
} from '../utils';
import { vec3, mat4, glMatrix } from 'gl-matrix';
import { config } from '../data/config';
import { LRUMap } from 'lru_map';
// import { loadFont, createTextModel } from '../../../three-font-parser/src/index'; // FIXME
import tinycolor from 'tinycolor2';
import { createPlaneModel } from '../data/geometry';

const { DataBuffers, IndexBuffer, Uniforms, Textures, OffscreenTarget } = ResourceTypes;

export class ThreeTextRenderer extends PbrRenderer {
    constructor(canvas, uniformsData = {}) {
        super(canvas, uniformsData);

        // this.loadFont = loadFont;
        // this.createTextModel = createTextModel;

        this.uniforms = [];
        this.materialTextures = [];
        for (let i = 0; i < config.structuresNum; i++) {
            this.uniforms[i] = this.beam.resource(Uniforms);
            this.materialTextures[i] = this.beam.resource(Textures);
        }
        this.commonUniforms = this.beam.resource(Uniforms, {});
        this.IndexBuffer = [];
        this.textures = [];
        this.meshMap = new LRUMap(5);
        this.fontMap = new LRUMap(5);

        this.initShadow();
    }

    async init() {
        super.init();
        if (!this.loadFont || !this.createTextModel) {
            const { loadFont, createTextModel } = await import(
                /* webpackChunkName: "three-font-parser" */ '@gaoding/three-font-parser'
            );
            this.loadFont = loadFont;
            this.createTextModel = createTextModel;
        }
    }

    async updateTextModel(model) {
        const layer = model.layers[0];
        if (!model.$fontData) {
            model.$fontData = {};
        }

        let text = model.contents.reduce((rec, b) => rec + b.content, '');
        // eslint-disable-next-line no-useless-escape
        // const RE_ZERO_WIDTH_SPACE = /[\u200B|\u00A0|\u0160]/g;
        const RE_NBSP_WITH_SPACE =
            /&nbsp;|[\f\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g;
        const UNIFORM_LINE_BREAK = /\r|<br\/?>/g;
        // text = text.replace(RE_ZERO_WIDTH_SPACE, '');
        text = text.replace(RE_NBSP_WITH_SPACE, ' ');
        text = text.replace(UNIFORM_LINE_BREAK, '\n');
        for (let i = 0, j = 0; i < text.length; i++) {
            if (text[i] !== '\n' && text[i] !== ' ') {
                j++;
            }
            if (j >= 20) {
                text = text.slice(0, ++i);
                break;
            }
        }
        if (!text.length) {
            this.meshError = true;
            return;
        } else {
            this.meshError = false;
        }
        const key =
            text +
            model.$fontData.id +
            layer.extrudeDepth +
            layer.curveSegments +
            layer.bevelThickness +
            layer.bevelSize +
            layer.bevelSegments +
            layer.expand +
            layer.extrudeOffsetX +
            layer.extrudeOffsetY +
            model.lineHeight +
            model.letterSpacing +
            model.textAlign +
            model.writingMode +
            JSON.stringify(model.deformation) +
            JSON.stringify(model.warpByWord);
        this.shapeModel = this.meshMap.get(key);

        if (!this.shapeModel) {
            try {
                this.shapeModel = await this.createTextModel(
                    text,
                    getFontParserParameter(this.font, model),
                );
                this.meshMap.set(key, this.shapeModel);
            } catch (error) {
                throw error;
            }
        }

        const { data, indexArray } = this.shapeModel;
        this.DataBuffers = this.beam.resource(DataBuffers, data);

        // 3个IndexBuffer 分别表示 正面、导角、侧面
        for (let i = 0; i < indexArray.length; i++) {
            this.IndexBuffer[i] = this.beam.resource(IndexBuffer, { array: indexArray[i] });
        }
        const { boundingBox } = this.shapeModel;
        this.commonUniforms.set('u_BoundingBox', boundingBox.max);
        this.commonUniforms.set('u_ScaleMat', mat4.fromScaling([], [boundingBox.max[0], 1, 1]));
        this.boundingBox = boundingBox;
        this.updateBBox(model);
        this.updateEyeDistance(model);
    }

    updateBBox(model) {
        const { shadow } = model;
        const shadowExpand = shadow.enable ? config.initFontSize : 0;
        this.modelSize = 2 * (Math.hypot(...this.boundingBox.max) + shadowExpand);
        this.shadowExpandRatio = (2 * config.initFontSize) / this.modelSize;
        if (this.modelSize <= 1) {
            this.meshError = true;
            return;
        }
        const angle = (model.viewAngle * Math.PI) / 180;
        this.canvasBaseSize = this.modelSize / (model.isOrtho ? 1 : Math.cos(angle / 2));
    }

    updateCanvasSize(model = { fontSize: 100 }, compositeZoom = 1) {
        const { canvasBaseSize, canvas } = this;
        let canvasSize = Math.floor(
            ((canvasBaseSize * model.fontSize) / config.initFontSize) * compositeZoom,
        );
        canvas.scaleRatio = 1;
        // webgl 有最大画布限制 4096
        if (canvasSize > config.maxWebglCanvasSize) {
            const scaleRatio = config.maxWebglCanvasSize / canvasSize;
            compositeZoom *= scaleRatio;
            canvas.scaleRatio = scaleRatio;
            canvasSize = config.maxWebglCanvasSize;
        }
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        canvas.compositeZoom = compositeZoom;
    }

    updateTextures(images, i) {
        this.materialTextures[i]
            .set('u_BaseColorSampler', { image: images[0], ...this.getTexPara(images[0]) })
            .set('u_NormalSampler', { image: images[1], ...this.getTexPara(images[1]) })
            .set('u_MetallicRoughnessSampler', { image: images[2], ...this.getTexPara(images[2]) });
    }

    updateMaterials(materials = [], signals) {
        for (let i = 0; i < materials.length; i++) {
            if (!signals || signals[2 * i + 1]) {
                const material = materials[i];
                if (!signals || signals[2 * i]) {
                    this.updateTextures(this.textures[i], i);
                }

                this.uniforms[i]
                    .set('u_Type', material.albedo.type)
                    .set('u_MetallicRoughnessValues', [
                        material.metalStrength,
                        material.roughnessStrength,
                    ])
                    .set('u_NormalStrength', material.normalDisable ? 0 : material.normalStrength)
                    .set('u_NormalScale', material.scale)
                    .set('u_BaseColorScale', material.scale);

                const type = material.albedo.type;

                if (type === 0) {
                    const color = tinycolor(material.albedo.color).toRgb();
                    const faceColor = [color.r / 255, color.g / 255, color.b / 255];
                    this.uniforms[i].set('u_FaceColor', faceColor);
                    const k = material.albedoStrength;
                    const baseColorFactor = [k, k, k, k];
                    this.uniforms[i].set('u_BaseColorFactor', baseColorFactor);
                } else if (type === 1) {
                    const scaleRatio = 1 / material.scale;
                    const angle = (material.albedo.texRotateAngle * Math.PI) / 180 || 0;
                    const texMat = getTexMat(material.albedo.texTranslate, angle, [
                        scaleRatio,
                        scaleRatio,
                    ]);
                    this.uniforms[i].set('u_TexMat', texMat);
                } else if (type === 2) {
                    this.updateGradient(material.albedo.gradient, i);
                }
            }
        }
    }

    async loadMaterials(model, signals) {
        const { frontMaterials, sideMaterials, bevelMaterials } = model.layers[0];

        const frontMapUrls = getMapUrls(frontMaterials);
        const sideMapUrls = sideMaterials.enable ? getMapUrls(sideMaterials) : [];
        const bevelMapUrls = bevelMaterials.enable ? getMapUrls(bevelMaterials) : [];

        const mapUrls = [frontMapUrls, bevelMapUrls, sideMapUrls];
        for (let i = 0; i < config.structuresNum; i++) {
            if (!signals || signals[2 * i + 1]) {
                this.textures[i] = await Promise.all(
                    mapUrls[i].map((value) => {
                        return getTexture(value);
                    }),
                );
            }
        }
        // 如果不启用侧面材质，侧面使用正面材质
        if (!this.textures[2].length) {
            this.textures[2] = this.textures[0];
        }
        // 如果不启用导角材质，导角使用侧面材质
        if (!this.textures[1].length) {
            this.textures[1] = this.textures[2];
        }
    }

    async prepareFont(model) {
        let fontUrl = '';
        if (model.$fontData) {
            fontUrl = model.$fontData.woff;
        } else {
            fontUrl = config.defaultFont;
        }
        let font = this.fontMap.get(fontUrl);
        if (!font) {
            font = await this.loadFont(fontUrl);
            this.fontMap.set(fontUrl, font);
            font.url = fontUrl;
        }
        this.font = font;
    }

    updateCamera(model) {
        const eye = rotateCamera(model.rotate3d, this.eyeDistance);
        this.commonUniforms.set('u_Camera', eye);
        const { radius, zNear = 0.01, zFar = 10000 } = this;
        if (model.isOrtho) {
            this.projMat = mat4.ortho([], -radius, radius, -radius, radius, zNear, zFar);
        } else {
            const aspect = this.canvas.width / this.canvas.height;
            this.projMat = mat4.perspective([], this.viewAngle, aspect, zNear, zFar);
        }
        mat4.lookAt(this.viewMat, eye, [0, 0, 0], eye.up || [0, 1, 0]);
        this.setMvpMat();
        this.commonUniforms.set('u_MVPMatrix', this.mvpMat);
        const { shadow = { enable: false } } = model;
        if (shadow.enable) {
            this.bindShadowAngle(shadow);
        }
    }

    updateGradient(gradient, j) {
        const { stops } = gradient;
        this.uniforms[j].set('u_GradientVec', gradient.direction);
        for (let i = 0; i < config.gradientMaxNum; i++) {
            if (i < stops.length) {
                this.uniforms[j]
                    .set(`u_GradientColor[${i}].color`, getColorVec3(stops[i].color))
                    .set(`u_GradientColor[${i}].offset`, stops[i].offset);
            } else {
                this.uniforms[j].set(`u_GradientColor[${i}].offset`, 2);
                this.uniforms[j].set(
                    `u_GradientColor[${i}].color`,
                    getColorVec3(stops[stops.length - 1].color),
                );
            }
        }
    }

    setMvpMat() {
        mat4.multiply(this.mvpMat, this.projMat, this.viewMat);
        return this.mvpMat;
    }

    initShadow() {
        // Begin shadow setup
        const { beam } = this;
        beam.define(Offscreen2DCommand);
        this.fillPlugin = beam.plugin(VoidFill);
        this.blurPlugin = beam.plugin(Blur);
        const { offscreenSize } = config;
        this.offscreenTargets = [
            beam.resource(OffscreenTarget, { size: offscreenSize }),
            beam.resource(OffscreenTarget, { size: offscreenSize }),
        ];
        this.offscreenTextures = [beam.resource(Textures), beam.resource(Textures)];

        const { gl } = beam;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.offscreenTargets[0].colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, this.offscreenTargets[1].colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        this.offscreenTextures[0].set('blurImg', this.offscreenTargets[0]);
        this.offscreenTextures[1].set('blurImg', this.offscreenTargets[1]);
        this.shadowUniforms = beam.resource(Uniforms, {
            sigma: 10,
            imgWidth: offscreenSize,
            imgHeight: offscreenSize,
            direction: 0,
        });
        const quad = createPlaneModel([1, 1], {});
        this.quadData = beam.resource(DataBuffers, quad.data);
        this.quadIndex = beam.resource(IndexBuffer, quad.index);
        // End shadow setup
    }

    updateShadow(model) {
        const { shadow } = model;
        this.bindShadowAngle(shadow);
        const { blur, color, offset, angle } = shadow;
        const scale = Math.exp(-0.05 * offset);
        const radianAngle = glMatrix.toRadian(angle);
        const radius = offset * this.shadowExpandRatio;
        const translateVec = [radius * Math.cos(radianAngle), radius * Math.sin(radianAngle), 0];
        const scaleVec = [scale, scale, 0];
        const scaleMat = mat4.fromScaling(mat4.create(), scaleVec);
        const translateMat = mat4.fromTranslation(mat4.create(), translateVec);
        const shadowMatrix = mat4.multiply(mat4.create(), translateMat, scaleMat);
        this.shadowUniforms.set('u_ShadowMatrix', shadowMatrix);
        this.shadowUniforms.set('shadowColor', getColorVec(color));
        this.shadowUniforms.set('sigma', blur);
    }

    bindShadowAngle(shadow) {
        if (shadow.enable && shadow.isBindRotate) {
            const { offsetRatio = 1 } = shadow;
            const basicZ = vec3.fromValues(0, 0, -1);
            const zVecAfterMvp = vec3.transformMat4([], basicZ, this.mvpMat);
            const angle = (Math.atan2(zVecAfterMvp[1], zVecAfterMvp[0]) * 180) / Math.PI;
            const offset = this.radius * Math.hypot(zVecAfterMvp[1], zVecAfterMvp[0]);
            shadow.angle = angle;
            shadow.offset = offset * offsetRatio;
        }
    }

    drawShadow() {
        const { beam } = this;
        const { gl } = this.beam;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // Fill geometry to blurImg
        beam.offscreen2D(this.offscreenTargets[0], () => {
            for (let i = 0; i < this.IndexBuffer.length; i++) {
                const resources = [
                    this.DataBuffers,
                    this.IndexBuffer[i],
                    this.uniforms[i],
                    this.commonUniforms,
                    this.shadowUniforms,
                ];
                beam.draw(this.fillPlugin, ...resources);
            }
        });

        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // First blur pass
        this.shadowUniforms.set('direction', 0);
        beam.offscreen2D(this.offscreenTargets[1], () => {
            beam.draw(
                this.blurPlugin,
                this.quadData,
                this.quadIndex,
                this.offscreenTextures[0],
                this.shadowUniforms,
            );
        });
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Second blur pass
        beam.gl.disable(beam.gl.DEPTH_TEST);
        this.shadowUniforms.set('direction', 1);
        beam.draw(
            this.blurPlugin,
            this.quadData,
            this.quadIndex,
            this.offscreenTextures[1],
            this.shadowUniforms,
        );
        beam.gl.enable(beam.gl.DEPTH_TEST);
    }

    initCoordinate() {
        const { beam } = this;
        this.meshPlugin = beam.plugin(Mesh);
        const planeSize = config.initFontSize;
        if (!this.cylinderData) {
            this.initCylinder();
        }
        const plane = createPlaneModel([planeSize, planeSize], { isSimple: true, direc: 'y' });
        this.planeData = beam.resource(DataBuffers, plane.data);

        this.planeIndex = beam.resource(IndexBuffer, plane.index);
        this.planeBorderIndex = beam.resource(IndexBuffer, { array: [0, 1, 1, 3, 3, 2, 2, 0] });

        this.planeUniforms = beam.resource(Uniforms, {
            u_Color: getColorVec('#F5980046'),
            u_ScaleMat: mat4.create(), // 重置缩放矩阵
        });
        this.planeBorderUniforms = beam.resource(Uniforms, {
            u_Color: getColorVec('#F59800cb'),
        });
        this.axisXUniforms = beam.resource(Uniforms, {
            u_Color: getColorVec('#E54937ff'),
            u_RotateMat: mat4.fromScaling([], [1, 1.2, 1.2]),
        });
        this.axisYUniforms = beam.resource(Uniforms, {
            u_Color: getColorVec('#2254F4ff'),
            u_RotateMat: mat4.multiply(
                [],
                mat4.fromYRotation([], Math.PI / 2),
                mat4.fromScaling([], [0.5, 1.2, 1.2]),
            ),
        });
        // 参考平面参数
        this.planeResouuces = [
            this.planeData,
            this.planeIndex,
            this.commonUniforms,
            this.planeUniforms,
        ];
        // 参考平面描边参数
        this.planeBorderResources = [
            this.planeData,
            this.planeBorderIndex,
            this.commonUniforms,
            this.planeBorderUniforms,
        ];
        // x 轴参数
        this.axisXResources = [
            this.cylinderData,
            this.cylinderIndex,
            this.commonUniforms,
            this.axisXUniforms,
        ];
        // y 轴参数
        this.axisYResources = [
            this.cylinderData,
            this.cylinderIndex,
            this.commonUniforms,
            this.axisYUniforms,
        ];
    }

    drawCoordinate(model) {
        if (!this.axisXResources) {
            this.initCoordinate(model);
        }
        const { gl } = this.beam;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.beam.draw(this.simplePlugin, ...this.axisXResources);
        this.beam.draw(this.simplePlugin, ...this.axisYResources);
        this.beam.draw(this.simplePlugin, ...this.planeResouuces);
        this.beam.draw(this.meshPlugin, ...this.planeBorderResources);
        gl.disable(gl.BLEND);
    }

    render(model) {
        this.beam.clear();
        // 网格图
        if (model.isMesh) {
            this.drawGrid();
        } else {
            if (model && model.shadow.enable) {
                this.drawShadow();
            }
            for (let i = 0; i < this.IndexBuffer.length; i++) {
                const resources = [
                    this.DataBuffers,
                    this.IndexBuffer[i],
                    this.uniforms[i],
                    this.commonUniforms,
                    this.materialTextures[i],
                    this.commonTextures,
                ];
                this.beam.draw(this.plugin, ...resources);
            }
            if (model.$showCoordinate) {
                this.drawCoordinate(model);
            }
        }
    }
}
