/* eslint-disable no-unused-vars */
import { Beam, GLTypes as GL } from '@gaoding/beam';
import { ThreeText } from '../plugins';
import { BasicRenderer } from './basic-renderer';
import {
    loadImage,
    rotateCamera,
    getTexMat,
    getTexture,
    createSolidCanvas,
    loadCubeMaps,
    getMapUrls,
    isPowerOf2,
    getColorVec3,
} from '../utils';
import { mat4 } from 'gl-matrix';
import { config } from '../data/config';
import tinycolor from 'tinycolor2';

export class PbrRenderer extends BasicRenderer {
    constructor(canvas) {
        super(canvas);
        this.beam = new Beam(canvas, config.beamConfig);
        if (this.beam.gl.extensions.EXT_shader_texture_lod) {
            ThreeText.defines.USE_TEX_LOD = 1; // COMPAT Android fallback
        }
        this.plugin = this.beam.plugin(ThreeText);

        this.rotateMat = mat4.create();
        this.translateMat = mat4.create();
        this.scaleMat = mat4.create();
    }

    async init() {
        await loadImage(config.brdfUrl).then((data) => {
            this.commonTextures.set('u_brdfLUT', {
                image: data,
                minFilter: GL.NearestMipmapLinear,
                wrapT: GL.ClampToEdge,
                wrapS: GL.ClampToEdge,
            });
        });

        const whiteColor = createSolidCanvas(config.whiteColor);
        const blackColor = createSolidCanvas('#000');
        const images = [];
        for (let i = 0; i < 6; i++) {
            images.push(blackColor);
        }
        const texCube = { images, level: 0, minFilter: GL.Linear };
        this.commonTextures.set('u_DiffuseEnvSampler', texCube);
        this.commonTextures.set('u_SpecularEnvSampler', texCube);
        this.commonTextures.set('u_EmissiveSampler', { image: whiteColor });
        this.commonTextures.set('u_OcclusionSampler', { image: whiteColor });
        this.commonUniforms.set('u_ModelMatrix', mat4.create());
    }

    updateCanvasSize(model, zoom = 1) {
        const { canvasBaseSize, canvas } = this;
        let canvasSize = canvasBaseSize * zoom;
        canvas.scaleRatio = 1;
        if (canvasSize > config.maxWebglCanvasSize) {
            const scaleRatio = config.maxWebglCanvasSize / canvasSize;
            zoom *= scaleRatio;
            canvas.scaleRatio = scaleRatio;
            canvasSize = config.maxWebglCanvasSize;
        }
        canvas.width = canvas.height = canvasSize;
        canvas.zoom = zoom;
    }

    updateTextures(images) {
        this.commonTextures
            .set('u_BaseColorSampler', { image: images[0], ...this.getTexPara(images[0]) })
            .set('u_NormalSampler', { image: images[1], ...this.getTexPara(images[1]) })
            .set('u_MetallicRoughnessSampler', { image: images[2], ...this.getTexPara(images[2]) });
    }

    isStandTex(image) {
        return isPowerOf2(image.width) && isPowerOf2(image.height);
    }

    updateMaterials(materials) {
        this.updateTextures(this.textures);
        this.commonUniforms
            .set('u_Type', materials.albedo.type)
            .set('u_MetallicRoughnessValues', [
                materials.metalStrength,
                materials.roughnessStrength,
            ])
            .set('u_NormalStrength', materials.normalDisable ? 0 : materials.normalStrength)
            .set('u_NormalScale', materials.scale)
            .set('u_BaseColorScale', materials.scale);

        const type = materials.albedo.type;

        if (type === 0) {
            const color = tinycolor(materials.albedo.color).toRgb();
            const faceColor = [color.r / 255, color.g / 255, color.b / 255];
            this.commonUniforms.set('u_FaceColor', faceColor);
            const k = materials.albedoStrength;
            const baseColorFactor = [k, k, k, k];
            this.commonUniforms.set('u_BaseColorFactor', baseColorFactor);
        } else if (type === 1) {
            const scaleRatio = 1 / materials.scale;
            const angle = (materials.albedo.texRotateAngle * Math.PI) / 180 || 0;
            const texMat = getTexMat(materials.albedo.texTranslate, angle, [
                scaleRatio,
                scaleRatio,
            ]);
            this.commonUniforms.set('u_TexMat', texMat);
        } else if (type === 2) {
            this.updateGradient(materials.albedo.gradient);
        }
    }

    updateGradient(gradient) {
        const { stops } = gradient;
        this.commonUniforms.set('u_GradientVec', gradient.direction);
        for (let i = 0; i < stops.length; i++) {
            const color = tinycolor(stops[i].color).toRgb();
            const colorVec = [color.r / 255, color.g / 255, color.b / 255];
            this.commonUniforms
                .set(`u_GradientColor[${i}].color`, colorVec)
                .set(`u_GradientColor[${i}].offset`, stops[i].offset);
        }
    }

    async updateEnvironment(model) {
        const { strength, enable, maps } = model.environment;
        const envColor = tinycolor(maps[0]);
        if (envColor.isValid()) {
            this.commonUniforms.set('u_EnvColor', getColorVec3(maps[0], strength, enable));
        } else {
            const loadCubeMapsWithCache = loadCubeMaps(maps[0]);
            await loadCubeMapsWithCache.then((cubeMaps) => {
                cubeMaps[0].minFilter = GL.Linear;
                cubeMaps[1].minFilter = GL.LinearMipmapLinear;
                cubeMaps[0].space = GL.SRGB;
                cubeMaps[1].space = GL.SRGB;
                this.commonTextures.set('u_DiffuseEnvSampler', cubeMaps[0]);
                this.commonTextures.set('u_SpecularEnvSampler', cubeMaps[1]);
                this.commonUniforms.set('u_EnvColor', [0, 0, 0]);
            });
        }

        const k = enable ? strength : 0;
        this.commonUniforms.set('u_ScaleIBLAmbient', k);
    }

    async loadMaterials(model) {
        const mapUrls = getMapUrls(model.materials);
        this.textures = await Promise.all(
            mapUrls.map((value) => {
                return getTexture(value);
            }),
        );
    }

    updateEyeDistance(model) {
        const { safeRatio = 1 } = config;
        this.viewAngle = (model.viewAngle * Math.PI) / 180;
        this.radius = (this.modelSize / 2) * safeRatio;
        this.eyeDistance = this.radius / Math.sin(this.viewAngle / 2);
        this.zNear = this.eyeDistance - this.radius;
        this.zFar = this.eyeDistance + this.radius;
    }

    updateCamera(model) {
        const eye = rotateCamera(model.rotate3d, this.eyeDistance);
        this.commonUniforms.set('u_Camera', eye);
        const { radius = 100, zNear = 0.1, zFar = 1000 } = this;
        if (model.isOrtho) {
            this.projMat = mat4.ortho([], -radius, radius, -radius, radius, zNear, zFar);
        } else {
            const aspect = this.canvas.width / this.canvas.height;
            this.projMat = mat4.perspective([], this.viewAngle, aspect, zNear, zFar);
        }
        mat4.lookAt(this.viewMat, eye, [0, 0, 0], [0, 1, 0]);
        this.setMvpMat();
        this.commonUniforms.set('u_MVPMatrix', this.mvpMat);
    }

    updateHemiLights(model) {
        const {
            dir = [0, 0, 1],
            color = '#ffffff',
            strength = 1,
            enable = false,
        } = model.hemiLight;
        this.commonUniforms.set('u_HemiLight.dir', dir);
        this.commonUniforms.set('u_HemiLight.color', getColorVec3(color, strength, enable));
    }

    updateFloodLights(model) {
        if (model.isFloodLightOff) {
            for (let i = 0; i < config.pointLightsNum; i++) {
                this.commonUniforms.set(`u_Lights[${i}].color`, [0, 0, 0]);
            }
            this.commonUniforms.set('u_HemiLight.color', [0, 0, 0]);
        } else {
            this.updatePointLights(model);
            this.updateHemiLights(model);
        }
    }

    setMvpMat() {
        mat4.multiply(this.mvpMat, this.projMat, this.viewMat);
        return this.mvpMat;
    }
}
