/* eslint-env browser */
import { BasicRenderer } from './basic-renderer';
import { LightBall } from '../plugins/index';
import { createSphereModel } from '../data/geometry';
import { mat4 } from 'gl-matrix';

export class LightBallRenderer extends BasicRenderer {
    constructor(canvas, uniformsData = {}) {
        super(canvas, uniformsData);
        this.plugin = this.beam.plugin(LightBall);
    }

    init(r = 1, powerNum = 2) {
        const projMat = mat4.ortho(mat4.create(), -r, r, -r, r, 0.1, 4 * r);
        const model = createSphereModel(40, r);
        this.setModel(model);
        const eye = [0, 0, 3 * r];
        const viewMat = mat4.lookAt([], eye, [0, 0, 0], [0, 1, 0]);
        const mvpMat = mat4.multiply(mat4.create(), projMat, viewMat);
        this.commonUniforms.set('mvpMat', mvpMat).set('powerNum', powerNum);
    }
}
