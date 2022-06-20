import { Curve } from './Curve.js';
import { debug } from '../../../../utils';
import { LineCurve } from '../curves/LineCurve';

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 **/

/**************************************************************
 *    Curved Path - a curve path is simply a array of connected
 *  curves, but retains the api of a curve
 **************************************************************/
class CurvePath extends Curve {
    constructor() {
        super();
        this.type = 'CurvePath';

        this.curves = [];
        this.autoClose = false; // Automatically closes the path
        this.isDeformationON = false;
    }

    add(curve) {
        this.curves.push(curve);
    }

    closePath() {
        // Add a line curve if start and end of lines are not connected
        const startPoint = this.curves[0].getPoint(0);
        const endPoint = this.curves[this.curves.length - 1].getPoint(1);

        if (!startPoint.equals(endPoint)) {
            this.curves.push(new LineCurve(endPoint, startPoint));
        }
    }

    // To get accurate point with reference to
    // entire path distance at time t,
    // following has to be done:

    // 1. Length of each sub path have to be known
    // 2. Locate and identify type of curve
    // 3. Get t for the curve
    // 4. Return curve.getPointAt(t')

    getPoint(t) {
        const d = t * this.getLength();
        const curveLengths = this.getCurveLengths();
        let i = 0;

        // To think about boundaries points.

        while (i < curveLengths.length) {
            if (curveLengths[i] >= d) {
                const diff = curveLengths[i] - d;
                const curve = this.curves[i];

                const segmentLength = curve.getLength();
                const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

                return curve.getPointAt(u);
            }

            i++;
        }

        return null;

        // loop where sum != 0, sum > d , sum+1 <d
    }

    // We cannot use the default THREE.Curve getPoint() with getLength() because in
    // THREE.Curve, getLength() depends on getPoint() but in THREE.CurvePath
    // getPoint() depends on getLength

    getLength() {
        const lens = this.getCurveLengths();
        return lens[lens.length - 1];
    }

    // cacheLengths must be recalculated.
    updateArcLengths() {
        this.needsUpdate = true;
        this.cacheLengths = null;
        this.getCurveLengths();
    }

    // Compute lengths and cache them
    // We cannot overwrite getLengths() because UtoT mapping uses it.

    getCurveLengths() {
        // We use cache values if curves and cache array are same length

        if (this.cacheLengths && this.cacheLengths.length === this.curves.length) {
            return this.cacheLengths;
        }

        // Get length of sub-curve
        // Push sums into cached array

        const lengths = [];
        let sums = 0;

        for (let i = 0, l = this.curves.length; i < l; i++) {
            sums += this.curves[i].getLength();
            lengths.push(sums);
        }

        this.cacheLengths = lengths;

        return lengths;
    }

    getSpacedPoints(divisions) {
        if (divisions === undefined) divisions = 40;

        const points = [];

        for (let i = 0; i <= divisions; i++) {
            points.push(this.getPoint(i / divisions));
        }

        if (this.autoClose) {
            points.push(points[0]);
        }

        return points;
    }

    getPoints(divisions) {
        divisions = divisions || 12;

        const points = [];
        let last;

        for (let i = 0; i < this.curves.length; i++) {
            const curve = this.curves[i];
            let resolution =
                curve && curve.isEllipseCurve
                    ? divisions * 2
                    : curve && (curve.isLineCurve || curve.isLineCurve3)
                    ? 1
                    : curve && curve.isSplineCurve
                    ? divisions * curve.points.length
                    : divisions;

            // yunyang //待解决，直线多个采样点，会导致膨胀倒角的getvector()计算在某些地方出现bug
            if (curve && curve.isLineCurve) {
                resolution = divisions;
            }

            const pts = curve.getPoints(resolution);
            // let pts = curve.getPointsByStepsize( resolution );

            for (let j = 0; j < pts.length; j++) {
                const point = pts[j];

                if (last && last.equals(point)) continue; // ensures no consecutive points are duplicates

                points.push(point);
                last = point;
            }
        }

        if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
            points.push(points[0]);
        }

        return points;
    }

    // yunyang
    getPointsByStepSize(stepSize) {
        stepSize = stepSize || 1;

        const points = [];
        let last;

        for (let i = 0, curves = this.curves; i < curves.length; i++) {
            const curve = curves[i];
            const curveLength = curve.getLength(20);
            const resolution = parseInt(Math.max(1, curveLength / stepSize)); // 最少两个采样点
            debug.log('resolution', resolution);
            const pts = curve.getPoints(resolution);

            for (let j = 0; j < pts.length; j++) {
                const point = pts[j];

                if (last && last.equals(point)) continue; // ensures no consecutive points are duplicates

                points.push(point);
                last = point;
            }
        }

        if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
            points.push(points[0]);
        }

        return points;
    }

    // yunyang
    getPointsAdaptively(tolerance) {
        tolerance = tolerance || 0.01;
        const points = [];
        let last;

        for (let i = 0, curves = this.curves; i < curves.length; i++) {
            const curve = curves[i];
            let pts;

            if (curve.isLineCurve && this.isDeformationON) {
                // 变形时再考虑
                const curveLength = curve.getLength(20);
                const stepSize = Math.max(1, tolerance * 1.5);
                // let stepSize = 10;//Math.max(1, tolerance*100);
                let resolution = parseInt(Math.max(1, curveLength / stepSize)); // 最少两个采样点
                // debug.log("resolution", resolution);
                resolution = Math.min(20, resolution); // 最多20个采样点
                pts = curve.getPoints(resolution);
            } else {
                pts = curve.getPointsAdaptively4Curve(tolerance);
            }

            for (let j = 0; j < pts.length; j++) {
                const point = pts[j];

                if (last && last.equals(point)) continue; // ensures no consecutive points are duplicates

                points.push(point);
                last = point;
            }
        }

        if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
            points.push(points[0]);
        }

        return points;
    }

    copy(source) {
        Object.assign(this, source);
        this.curves = [];

        for (let i = 0, l = source.curves.length; i < l; i++) {
            const curve = source.curves[i];
            this.curves.push(curve.clone());
        }

        return this;
    }
}

export { CurvePath };
