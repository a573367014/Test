import { Vector2 } from '../../math/Vector2.js';
import { Curve } from '../core/Curve.js';

class LineCurve extends Curve {
    constructor(v1, v2) {
        super();
        this.type = 'LineCurve';

        this.v1 = v1 || new Vector2();
        this.v2 = v2 || new Vector2();
        this.isLineCurve = true;
    }

    getPole(min, max) {
        const { v1, v2 } = this;
        min.x = Math.min(min.x, v1.x, v2.x);
        min.y = Math.min(min.y, v1.y, v2.y);
        max.x = Math.max(max.x, v1.x, v2.x);
        max.y = Math.max(max.y, v1.y, v2.y);
    }

    pointApplyFunc(func) {
        func(this.v1);
        func(this.v2);
    }

    split({ x, y }) {
        const { v1, v2 } = this;
        const splitByX = x !== undefined && (v1.x - x) * (v2.x - x) < 0;
        const splitByY = y !== undefined && (v1.y - y) * (v2.y - y) < 0;

        if (splitByX) {
            y = v1.y + ((v2.y - v1.y) / (v2.x - v1.x)) * (x - v1.x);
        }
        if (splitByY) {
            x = v1.x + ((v2.x - v1.x) / (v2.y - v1.y)) * (y - v1.y);
        }
        if (splitByX || splitByY) {
            const lineCurve1 = new LineCurve(v1, new Vector2(x, y));
            const lineCurve2 = new LineCurve(new Vector2(x, y), v2);
            return [lineCurve1, lineCurve2];
        } else {
            return [this];
        }
    }

    getLength() {
        const { v1, v2 } = this;
        return Math.hypot(v1.x - v2.x, v1.y - v2.y);
    }

    getPoint(t) {
        const point = new Vector2();

        if (t === 1) {
            point.copy(this.v2);
        } else {
            point.copy(this.v2).sub(this.v1);
            point.multiplyScalar(t).add(this.v1);
        }

        return point;
    }

    getNormal() {
        const x = this.v2.x - this.v1.x;
        const y = this.v2.y - this.v1.y;
        // 直线逆时针旋转 90 度
        const normal = new Vector2(y, -x);
        return normal.normalize();
    }

    getTangent() {
        const tangent = this.v2.clone().sub(this.v1);

        return tangent.normalize();
    }

    copy(source) {
        super.copy(source);

        this.v1.copy(source.v1);
        this.v2.copy(source.v2);

        return this;
    }
}

export { LineCurve };
