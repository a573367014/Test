import { Curve } from '../core/Curve.js';
import { Vector2 } from '../../math/Vector2.js';

export class CircleCurve extends Curve {
    constructor(center, radius, startNum, endNum) {
        super();
        this.type = 'circleCurve';

        this.center = center.clone();
        this.radius = radius;
        this.startNum = startNum;
        this.endNum = endNum;
        this.isCircleCurve = true;
    }

    getPole(min, max) {
        min.x = Math.min(min.x, this.center.x - this.radius);
        min.y = Math.min(min.y, this.center.y - this.radius);
        max.x = Math.max(max.x, this.center.x + this.radius);
        max.y = Math.max(max.y, this.center.y + this.radius);
    }

    getPoint(t) {
        const normal = this.getNormal(t);
        const { radius, center } = this;
        const point = center.clone().addScaledVector(normal, radius);
        return point;
    }

    getNormal(t) {
        const { startNum, endNum } = this;
        const angle = t * (endNum - startNum) + startNum - 0.5 * Math.PI;
        const normal = new Vector2(Math.cos(angle), Math.sin(angle));
        return normal;
    }

    getTangent(t) {
        const { x, y } = this.getNormal(t);
        return new Vector2(-y, x);
    }
}
