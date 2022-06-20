import { _Math } from '../../math/Math.js';
import { Vector3 } from '../../math/Vector3.js';
import { Vector2 } from '../../math/Vector2.js';
import { Matrix4 } from '../../math/Matrix4.js';

export class Curve {
    constructor() {
        this.type = 'Curve';
        this.arcLengthDivisions = 200;
        this.recurDepth = 0;
    }

    // Get point at relative position in curve according to arc length
    // - u [0 .. 1]

    getPointAt(u) {
        const t = this.getUtoTmapping(u);
        return this.getPoint(t);
    }

    // Get sequence of points using getPoint( t )

    getPoints(divisions) {
        if (divisions === undefined) divisions = 5;

        const points = [];

        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPoint(d / divisions));
        }

        return points;
    }

    // yunyang
    getPointsByStepsize(stepSize) {
        if (stepSize === undefined) stepSize = 5;

        const length = this.getLength();
        let divisions;
        if (stepSize > length) {
            divisions = 1;
        } else {
            divisions = Math.round(length / stepSize);
        }

        return this.getPoints(divisions);
    }

    // signed area of a triangle
    triangleArea(p, q, r) {
        return Math.abs((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    }

    // R is point between P and Q
    checkFlat(pointP, pointQ, pointR, tolerance) {
        return this.triangleArea(pointP, pointQ, pointR) < tolerance;
    }

    sample(tP, tQ, tolerance, samplePoints) {
        if (this.recurDepth > 100) {
            // debug.log("recurDepth > 100");
            return;
        }
        this.recurDepth++;
        const pointP = this.getPointAt(tP);
        const pointQ = this.getPointAt(tQ);
        const t = 0.45; // + 0.1 * (Math.random()*2-1); //Math.random()-->(0,1)
        const tR = tP + (tQ - tP) * t;
        const pointR = this.getPointAt(tR);
        if (this.checkFlat(pointP, pointQ, pointR, tolerance)) {
            // samplePoints.add(pointP);
            samplePoints.add(pointQ);
        } else {
            this.sample(tP, tR, tolerance, samplePoints);
            this.sample(tR, tQ, tolerance, samplePoints);
        }
    }

    getPointsAdaptively4Curve(tolerance = 0.01) {
        this.recurDepth = 0;
        const samplePoints = new Set();
        const tP = 0;
        const tQ = 1;
        samplePoints.add(this.getPointAt(0));
        this.sample(tP, tQ, tolerance, samplePoints);
        return Array.from(samplePoints);
    }

    // Get sequence of points using getPointAt( u )

    getSpacedPoints(divisions) {
        if (divisions === undefined) divisions = 5;

        const points = [];

        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPointAt(d / divisions));
        }

        return points;
    }

    // Get total curve arc length

    getLength() {
        const lengths = this.getLengths();
        return lengths[lengths.length - 1];
    }

    // Get list of cumulative segment lengths

    getLengths(divisions) {
        if (divisions === undefined) divisions = this.arcLengthDivisions;

        if (
            this.cacheArcLengths &&
            this.cacheArcLengths.length === divisions + 1 &&
            !this.needsUpdate
        ) {
            return this.cacheArcLengths;
        }

        this.needsUpdate = false;

        const cache = [];
        let current;
        let last = this.getPoint(0);
        let p;
        let sum = 0;

        cache.push(0);

        for (p = 1; p <= divisions; p++) {
            current = this.getPoint(p / divisions);
            sum += current.distanceTo(last);
            cache.push(sum);
            last = current;
        }

        this.cacheArcLengths = cache;

        return cache; // { sums: cache, sum: sum }; Sum is in the last element.
    }

    updateArcLengths() {
        this.needsUpdate = true;
        this.getLengths();
    }

    // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

    getUtoTmapping(u, distance) {
        const arcLengths = this.getLengths();

        let i = 0;
        const il = arcLengths.length;

        let targetArcLength; // The targeted u distance value to get

        if (distance) {
            targetArcLength = distance;
        } else {
            targetArcLength = u * arcLengths[il - 1];
        }

        // binary search for the index with largest value smaller than target u distance

        let low = 0;
        let high = il - 1;
        let comparison;

        while (low <= high) {
            i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

            comparison = arcLengths[i] - targetArcLength;

            if (comparison < 0) {
                low = i + 1;
            } else if (comparison > 0) {
                high = i - 1;
            } else {
                high = i;
                break;

                // DONE
            }
        }

        i = high;

        if (arcLengths[i] === targetArcLength) {
            return i / (il - 1);
        }

        // we could get finer grain at lengths, or use simple interpolation between two points

        const lengthBefore = arcLengths[i];
        const lengthAfter = arcLengths[i + 1];

        const segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points

        const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

        // add that fractional amount to t

        const t = (i + segmentFraction) / (il - 1);

        return t;
    }

    getNormal(t) {
        const { x, y } = this.getTangent(t);
        // 直线逆时针旋转 90 度
        const normal = new Vector2(y, -x);
        return normal.normalize();
    }

    // Returns a unit vector tangent at t
    // In case any sub curve does not implement its tangent derivation,
    // 2 points a small delta apart will be used to find its gradient
    // which seems to give a reasonable approximation

    getTangent(t) {
        const delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        // Capping in case of danger

        if (t1 < 0) t1 = 0;
        if (t2 > 1) t2 = 1;

        const pt1 = this.getPoint(t1);
        const pt2 = this.getPoint(t2);

        const vec = pt2.clone().sub(pt1);
        return vec.normalize();
    }

    getTangentAt(u) {
        const t = this.getUtoTmapping(u);
        return this.getTangent(t);
    }

    computeFrenetFrames(segments, closed) {
        // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

        const normal = new Vector3();

        const tangents = [];
        const normals = [];
        const binormals = [];

        const vec = new Vector3();
        const mat = new Matrix4();

        let i, u, theta;

        // compute the tangent vectors for each segment on the curve

        for (i = 0; i <= segments; i++) {
            u = i / segments;

            tangents[i] = this.getTangentAt(u);
            tangents[i].normalize();
        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component

        normals[0] = new Vector3();
        binormals[0] = new Vector3();
        let min = Number.MAX_VALUE;
        const tx = Math.abs(tangents[0].x);
        const ty = Math.abs(tangents[0].y);
        const tz = Math.abs(tangents[0].z);

        if (tx <= min) {
            min = tx;
            normal.set(1, 0, 0);
        }

        if (ty <= min) {
            min = ty;
            normal.set(0, 1, 0);
        }

        if (tz <= min) {
            normal.set(0, 0, 1);
        }

        vec.crossVectors(tangents[0], normal).normalize();

        normals[0].crossVectors(tangents[0], vec);
        binormals[0].crossVectors(tangents[0], normals[0]);

        // compute the slowly-varying normal and binormal vectors for each segment on the curve

        for (i = 1; i <= segments; i++) {
            normals[i] = normals[i - 1].clone();

            binormals[i] = binormals[i - 1].clone();

            vec.crossVectors(tangents[i - 1], tangents[i]);

            if (vec.length() > Number.EPSILON) {
                vec.normalize();

                theta = Math.acos(_Math.clamp(tangents[i - 1].dot(tangents[i]), -1, 1)); // clamp for floating pt errors

                normals[i].applyMatrix4(mat.makeRotationAxis(vec, theta));
            }

            binormals[i].crossVectors(tangents[i], normals[i]);
        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

        if (closed === true) {
            theta = Math.acos(_Math.clamp(normals[0].dot(normals[segments]), -1, 1));
            theta /= segments;

            if (tangents[0].dot(vec.crossVectors(normals[0], normals[segments])) > 0) {
                theta = -theta;
            }

            for (i = 1; i <= segments; i++) {
                // twist a little...
                normals[i].applyMatrix4(mat.makeRotationAxis(tangents[i], theta * i));
                binormals[i].crossVectors(tangents[i], normals[i]);
            }
        }

        return {
            tangents: tangents,
            normals: normals,
            binormals: binormals,
        };
    }

    clone() {
        return Object.assign({}, this);
    }

    copy(source) {
        this.arcLengthDivisions = source.arcLengthDivisions;

        return this;
    }
}
