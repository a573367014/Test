import { Beam, ResourceTypes, GLTypes } from '@gaoding/beam';
import { mat4, quat } from 'gl-matrix';
import { Line, Simple } from '../plugins';
import { getColorVec3 } from '../utils';
import { config } from '../data/config';
import { createCylinderModel } from '../data';

const { DataBuffers, IndexBuffer, Uniforms, Textures } = ResourceTypes;

export class BasicRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.beam = new Beam(canvas);
        this.modelMat = mat4.create();
        this.viewMat = mat4.create();
        this.projMat = mat4.create();
        this.mvpMat = mat4.create();
        this.commonTextures = this.beam.resource(Textures, {});
        this.commonUniforms = this.beam.resource(Uniforms, {});
    }

    init(plugin) {
        this.plugin = plugin;
    }

    initCylinder() {
        const { beam } = this;
        const cylinder = createCylinderModel({ radius: 1, div: 10, length: 1 });
        this.cylinderData = beam.resource(DataBuffers, cylinder.data);
        this.cylinderIndex = beam.resource(IndexBuffer, cylinder.index);
        this.simplePlugin = beam.plugin(Simple);
    }

    setModel(model) {
        this.DataBuffers = this.beam.resource(DataBuffers, model.data);
        this.IndexBuffer = this.beam.resource(IndexBuffer, model.index);
    }

    setEnvTextures(textures) {
        this.commonTextures = this.beam.resource(Textures, textures);
    }

    setOrtho(left = -2, right = 2, bottom = -2, top = 2, near = 0.1, far = 100) {
        mat4.ortho(this.projMat, left, right, bottom, top, near, far);
    }

    setPerspective(viewAngle = Math.PI / 6, aspect = 1, zNear = 0.1, zFar = 5000) {
        mat4.perspective(this.projMat, viewAngle, aspect, zNear, zFar);
    }

    updatePointLights(model) {
        const { pointLights, lightsNum } = model;
        const max = lightsNum || config.pointLightsNum;
        for (let i = 0; i < max; i++) {
            if (i < pointLights.length) {
                const { position, color, strength, enable } = pointLights[i];
                this.commonUniforms
                    .set(`u_Lights[${i}].pos`, position)
                    .set(`u_Lights[${i}].color`, getColorVec3(color, strength, enable));
            } else {
                this.commonUniforms.set(`u_Lights[${i}].color`, [0, 0, 0]);
            }
        }
    }

    setModelMat(rotate3d = [0, 0, 0], translateVec = [0, 0, 0], scaleVec = [1, 1, 1]) {
        const q = quat.fromEuler(...rotate3d);
        mat4.fromRotationTranslationScaleOrigin(
            this.modelMat,
            q,
            translateVec,
            scaleVec,
            [0, 0, 0],
        );
        return this.modelMat;
    }

    getMvpMat(modelMat, viewMat, projMat) {
        modelMat = modelMat || this.modelMat;
        viewMat = viewMat || this.viewMat;
        projMat = projMat || this.projMat;
        mat4.multiply(this.tempMat, viewMat, modelMat);
        mat4.multiply(this.mvpMat, projMat, this.tempMat);
        return this.mvpMat;
    }

    getMeshLinesIndex() {
        const lineIndexArray = [];
        for (let i = 0; i < this.IndexBuffer.length; i++) {
            const { array } = this.IndexBuffer[i].state;
            for (let j = 0, l = array.length; j < l; j += 3) {
                const [n1, n2, n3] = [array[j], array[j + 1], array[j + 2]];
                lineIndexArray.push(n1, n2, n2, n3, n3, n1);
            }
        }
        this.lineIndexBuffer = this.beam.resource(IndexBuffer, { array: lineIndexArray });
    }

    getTexPara(image) {
        if (image && this.isStandTex(image)) {
            return {
                minFilter: GLTypes.LinearMipmapLinear,
                wrapT: GLTypes.Repeat,
                wrapS: GLTypes.Repeat,
            };
        } else {
            return {
                minFilter: GLTypes.Linear,
                wrapT: GLTypes.ClampToEdge,
                wrapS: GLTypes.ClampToEdge,
            };
        }
    }

    drawGrid() {
        if (!this.lineIndexBuffer) {
            this.getMeshLinesIndex();
            this.linePlugin = this.beam.plugin(Line);
        }
        const resources = [this.DataBuffers, this.lineIndexBuffer, this.commonUniforms];

        this.beam.draw(this.linePlugin, ...resources);
    }

    render() {
        this.beam.clear();
        const resources = [
            this.DataBuffers,
            this.IndexBuffer,
            this.commonUniforms,
            this.commonTextures,
        ];
        this.beam.draw(this.plugin, ...resources);
    }
}
