import { Curve } from '../core/Curve.js';
import { CubicBezier } from '../core/Interpolations.js';
import { Vector2 } from '../../math/Vector2.js';

export class CubicBezierCurve extends Curve {
    constructor(v0, v1, v2, v3) {
        super();
        this.type = 'CubicBezierCurve';

        this.v0 = v0 || new Vector2();
        this.v1 = v1 || new Vector2();
        this.v2 = v2 || new Vector2();
        this.v3 = v3 || new Vector2();

        this.isCubicBezierCurve = true;
    }

    getPole(min, max) {
        const { v0, v1, v2, v3 } = this;
        min.x = Math.min(min.x, v0.x, v1.x, v2.x, v3.x);
        min.y = Math.min(min.y, v0.y, v1.y, v2.y, v3.y);
        max.x = Math.max(max.x, v0.x, v1.x, v2.x, v3.x);
        max.y = Math.max(max.y, v0.y, v1.y, v2.y, v3.y);
    }

    getPoint(t, optionalTarget) {
        const point = optionalTarget || new Vector2();
        const { v0, v1, v2, v3 } = this;

        point.set(CubicBezier(t, v0.x, v1.x, v2.x, v3.x), CubicBezier(t, v0.y, v1.y, v2.y, v3.y));

        return point;
    }

    pointApplyFunc(func) {
        func(this.v0);
        func(this.v1);
        func(this.v2);
        func(this.v3);
    }

    copy(source) {
        super.copy(source);
        this.v0.copy(source.v0);
        this.v1.copy(source.v1);
        this.v2.copy(source.v2);
        this.v3.copy(source.v3);

        return this;
    }

    // 3阶贝塞尔分割运算比较大，暂时只支持均分
    split({ x, y }) {
        const { v0, v1, v2, v3 } = this;
        const min = new Vector2(Infinity, Infinity);
        const max = new Vector2(-Infinity, -Infinity);
        this.getPole(min, max);

        const splitByX = x !== undefined && (min.x - x) * (max.x - x) < 0;
        const splitByY = y !== undefined && (min.y - y) * (max.y - y) < 0;
        if (splitByX || splitByY) {
            x = 0.5 * v0.x + 0.5 * v1.x;
            y = 0.5 * v0.y + 0.5 * v1.y;
            const point1 = new Vector2(x, y);

            x = 0.25 * v0.x + 0.5 * v1.x + 0.25 * v2.x;
            y = 0.25 * v0.y + 0.5 * v1.y + 0.25 * v2.y;
            const point2 = new Vector2(x, y);

            x = 0.125 * v0.x + 0.375 * v1.x + 0.375 * v2.x + 0.125 * v3.x;
            y = 0.125 * v0.y + 0.375 * v1.y + 0.375 * v2.y + 0.125 * v3.y;
            const point3 = new Vector2(x, y);

            x = 0.25 * v1.x + 0.5 * v2.x + 0.25 * v3.x;
            y = 0.25 * v1.y + 0.5 * v2.y + 0.25 * v3.y;
            const point4 = new Vector2(x, y);

            x = 0.5 * v2.x + 0.5 * v3.x;
            y = 0.5 * v2.y + 0.5 * v3.y;
            const point5 = new Vector2(x, y);

            const curve1 = new CubicBezierCurve(v0, point1, point2, point3);
            const curve2 = new CubicBezierCurve(point3.clone(), point4, point5, v3);
            return [curve1, curve2];
        }

        return [this];
    }
}
