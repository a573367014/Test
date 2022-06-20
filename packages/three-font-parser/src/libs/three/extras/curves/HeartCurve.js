import { Curve } from '../core/Curve.js';
import { Vector2 } from '../../math/Vector2.js';
import { LineCurve } from './LineCurve';
import { CircleCurve } from './CircleCurve';

export class HeartCurve extends Curve {
    constructor(center, size, startNum = 0, endNum = 1) {
        super();
        this.type = 'RectangularCurve';

        this.center = center.clone();
        this.size = size;
        this.startNum = startNum;
        this.endNum = endNum;
        this.init();
    }

    init() {
        this.curves = [];
        const { x, y } = this.center;

        const circleCenter1 = new Vector2(x + 0.5 * this.size, y - 0.5 * this.size);
        const circleCenter2 = new Vector2(x - 0.5 * this.size, y - 0.5 * this.size);
        const circleCenter3 = new Vector2(x, y + 0.5 * this.size);
        const circleCurve1 = new CircleCurve(
            circleCenter1,
            Math.SQRT1_2 * this.size,
            -0.25 * Math.PI,
            0.75 * Math.PI,
        );
        const circleCurve2 = new CircleCurve(
            circleCenter2,
            Math.SQRT1_2 * this.size,
            -0.75 * Math.PI,
            0.25 * Math.PI,
        );
        const circleCurve3 = new CircleCurve(
            circleCenter3,
            0.5 * Math.SQRT1_2 * this.size,
            0.75 * Math.PI,
            1.25 * Math.PI,
        );
        const lowPoint = new Vector2(x, y + this.size);
        const point1 = new Vector2(x + this.size, y);
        const point2 = point1.clone().lerp(lowPoint, 0.75);
        const point4 = new Vector2(x - this.size, y);
        const point3 = point4.clone().lerp(lowPoint, 0.75);
        const lineCurve1 = new LineCurve(point1, point2);
        const lineCurve2 = new LineCurve(point3, point4);
        this.curves.push(circleCurve1, lineCurve1, circleCurve3, lineCurve2, circleCurve2);
    }

    getPoint(t) {
        this.getCurrentLine(t);
        const point = this.currentCurve.getPoint(this.pointK);
        return point;
    }

    getPointAt(t) {
        return this.getPoint(t);
    }

    getCurrentLine(t) {
        let posNum = (t * (this.endNum - this.startNum) + this.startNum) % 1;
        if (posNum < 0) {
            posNum += 1;
        }

        posNum *= (9 * Math.PI) / 8 + 1.5;
        let lineNum;
        const halfPI = 0.5 * Math.PI;
        if (posNum < halfPI) {
            lineNum = 0;
            this.pointK = posNum / halfPI;
        } else if (posNum < halfPI + 0.75) {
            lineNum = 1;
            this.pointK = (posNum - halfPI) / 0.75;
        } else if (posNum < (5 * Math.PI) / 8 + 0.75) {
            lineNum = 2;
            this.pointK = (posNum - halfPI - 0.75) / (Math.PI / 8);
        } else if (posNum < (5 * Math.PI) / 8 + 1.5) {
            lineNum = 3;
            this.pointK = (posNum - (5 * Math.PI) / 8 - 0.75) / 0.75;
        } else {
            lineNum = 4;
            this.pointK = (posNum - (5 * Math.PI) / 8 - 1.5) / halfPI;
        }

        this.currentCurve = this.curves[lineNum];
        return this.currentCurve;
    }

    getTangent(t) {
        this.getCurrentLine(t);
        const tangent = this.currentCurve.getTangent(this.pointK);

        return tangent.normalize();
    }

    getNormal(t) {
        this.getCurrentLine(t);
        const tangent = this.currentCurve.getNormal(this.pointK);

        return tangent.normalize();
    }
}
