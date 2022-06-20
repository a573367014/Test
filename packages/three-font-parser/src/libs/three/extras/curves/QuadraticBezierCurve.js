import { Curve } from '../core/Curve.js';
import { QuadraticBezier } from '../core/Interpolations.js';
import { Vector2 } from '../../math/Vector2.js';

class QuadraticBezierCurve extends Curve {
    constructor(v0, v1, v2) {
        super();
        this.type = 'QuadraticBezierCurve';

        this.v0 = v0 || new Vector2();
        this.v1 = v1 || new Vector2();
        this.v2 = v2 || new Vector2();
        this.isQuadraticBezierCurve = true;
    }

    getPole(min, max) {
        const { v0, v1, v2 } = this;
        const x1 = 0.5 * (v0.x + v1.x);
        const y1 = 0.5 * (v0.y + v1.y);
        const x2 = 0.5 * (v0.x + v2.x);
        const y2 = 0.5 * (v0.y + v2.y);
        min.x = Math.min(min.x, v0.x, v2.x, x1, x2);
        min.y = Math.min(min.y, v0.y, v2.y, y1, y2);

        max.x = Math.max(max.x, v0.x, v2.x, x1, x2);
        max.y = Math.max(max.y, v0.y, v2.y, y1, y2);
    }

    pointApplyFunc(func) {
        func(this.v0);
        func(this.v1);
        func(this.v2);
    }

    split({ x, y }) {
        const { v0, v1, v2 } = this;
        const splitByX =
            x !== undefined &&
            Math.abs(Math.sign(v0.x - x) + Math.sign(v1.x - x) + Math.sign(v2.x - x)) === 1;
        const splitByY =
            y !== undefined &&
            Math.abs(Math.sign(v0.y - x) + Math.sign(v1.y - x) + Math.sign(v2.y - x)) === 1;

        let a, b, c, d;
        if (splitByX) {
            a = v0.x - 2 * v1.x + v2.x;
            b = 2 * (-v0.x + v1.x);
            c = v0.x - x;
        }

        if (splitByY) {
            a = v0.y - 2 * v1.y + v2.y;
            b = 2 * (-v0.y + v1.y);
            c = v0.y - y;
        }

        if (splitByX || splitByY) {
            d = b * b - 4 * a * c;
            if (d > 0) {
                const e = Math.sqrt(d);
                const t1 = (-b + e) / 2 / a;
                const t2 = (-b - e) / 2 / a;
                const t = [t1, t2].find((x) => x > 0 && x < 1);
                if (t) {
                    const point1 = new Vector2().lerpVectors(v0, v1, t);
                    const point3 = new Vector2().lerpVectors(v1, v2, t);
                    const point2 = new Vector2().lerpVectors(point1, point3, t);
                    const curve1 = new QuadraticBezierCurve(v0, point1, point2);
                    const curve2 = new QuadraticBezierCurve(point2.clone(), point3, v2);
                    return [curve1, curve2];
                }
            }
        }
        return [this];
    }

    getPoint(t) {
        const point = new Vector2();
        const { v0, v1, v2 } = this;
        point.set(QuadraticBezier(t, v0.x, v1.x, v2.x), QuadraticBezier(t, v0.y, v1.y, v2.y));

        return point;
    }

    copy(source) {
        super.copy(source);

        this.v0.copy(source.v0);
        this.v1.copy(source.v1);
        this.v2.copy(source.v2);

        return this;
    }
}

export { QuadraticBezierCurve };
