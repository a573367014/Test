import { Vector3 } from '../../math/Vector3.js';
import { Curve } from '../core/Curve.js';

export class LineCurve3 extends Curve {
    constructor(v1, v2) {
        super();
        this.type = 'LineCurve3';

        this.v1 = v1 || new Vector3();
        this.v2 = v2 || new Vector3();
        this.isLineCurve3 = true;
    }

    getPoint(t) {
        return new Vector3().lerpVectors(this.v1, this.v2, t);
    }

    getPointAt(u) {
        return this.getPoint(u);
    }
}
