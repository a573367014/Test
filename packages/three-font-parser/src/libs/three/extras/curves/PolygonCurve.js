import { Vector2 } from '../../math/Vector2.js';
import { Curve } from '../core/Curve.js';
import { LineCurve } from './LineCurve';

export class PolygonCurve extends Curve {
    constructor(center, radius, num, startNum = 0, endNum = 1) {
        super();
        this.type = 'PloygonCurve';

        this.center = center.clone();
        this.radius = radius;
        this.num = Math.round(num);
        this.startNum = startNum;
        this.endNum = endNum;
        this.init();
    }

    init() {
        this.lineCurves = [];
        this.points = [];
        for (let i = 0; i < this.num; i++) {
            let angle = (i * 2 * Math.PI) / this.num;
            angle -= 0.5 * Math.PI;
            const point = new Vector2(this.radius * Math.cos(angle), this.radius * Math.sin(angle));
            point.add(this.center);
            this.points.push(point);
        }
        for (let i = 0; i < this.num; i++) {
            const line = new LineCurve(this.points[i], this.points[(i + 1) % this.num]);
            this.lineCurves.push(line);
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
        const k = posNum * this.num;
        const lineNum = Math.floor(k);
        this.pointK = k - lineNum;

        this.currentLine = this.lineCurves[lineNum];
        return this.currentLine;
    }

    getTangent(t) {
        this.getCurrentLine(t);
        const tangent = this.currentLine.getTangent();

        return tangent.normalize();
    }

    getNormal(t) {
        this.getCurrentLine(t);
        const normal = this.currentLine.getNormal();

        return normal.normalize();
    }
}
