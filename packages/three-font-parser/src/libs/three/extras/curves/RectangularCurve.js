import { Curve } from '../core/Curve.js';
import { Vector2 } from '../../math/Vector2.js';
import { LineCurve } from './LineCurve';

export class RectangularCurve extends Curve {
    constructor(center, size, ratio = 1, startNum = 0, endNum = 1) {
        super();
        this.type = 'RectangularCurve';

        this.center = center.clone();
        this.size = size;
        this.ratio = ratio;
        this.startNum = startNum;
        this.endNum = endNum;
        this.init();
    }

    init() {
        this.curves = [];
        const { x, y } = this.center;
        const points = [];
        const halfWidth = this.size;
        const halfHeight = this.size / this.ratio;
        points[0] = new Vector2(x - halfWidth, y - halfHeight);
        points[1] = new Vector2(x + halfWidth, y - halfHeight);
        points[2] = new Vector2(x + halfWidth, y + halfHeight);
        points[3] = new Vector2(x - halfWidth, y + halfHeight);

        for (let i = 0; i < 4; i++) {
            this.curves.push(new LineCurve(points[i], points[(i + 1) % 4]));
        }
    }

    getPoint(t) {
        this.getCurrentLine(t);
        const point = this.currentLine.getPoint(this.pointK);
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

        posNum *= (1 + this.ratio) * 2;
        let lineNum;
        if (posNum < this.ratio) {
            lineNum = 0;
            this.pointK = posNum / this.ratio;
        } else if (posNum < this.ratio + 1) {
            lineNum = 1;
            this.pointK = (posNum - this.ratio) / 1;
        } else if (posNum < 2 * this.ratio + 1) {
            lineNum = 2;
            this.pointK = (posNum - this.ratio - 1) / this.ratio;
        } else {
            lineNum = 3;
            this.pointK = (posNum - 2 * this.ratio - 1) / 1;
        }

        this.currentLine = this.curves[lineNum];
        return this.currentLine;
    }

    getTangent(t) {
        this.getCurrentLine(t);
        const tangent = this.currentLine.getTangent();

        return tangent.normalize();
    }

    getNormal(t) {
        this.getCurrentLine(t);
        const tangent = this.currentLine.getNormal();

        return tangent.normalize();
    }
}
