import { Path } from './Path.js';
import { _Math } from '../../math/Math.js';

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * Defines a 2d shape plane using paths.
 **/

// STEP 1 Create a path.
// STEP 2 Turn path into shape.
// STEP 3 ExtrudeGeometry takes in Shape/Shapes
// STEP 3a - Extract points from each shape, turn to vertices
// STEP 3b - Triangulate each shape, add faces.

export class Shape extends Path {
    constructor(points) {
        super(points);
        this.uuid = _Math.generateUUID();

        this.type = 'Shape';

        this.holes = [];
    }

    getPointsHoles(divisions) {
        const holesPts = [];

        for (let i = 0, l = this.holes.length; i < l; i++) {
            holesPts[i] = this.holes[i].getPoints(divisions);
        }

        return holesPts;
    }

    getPointsHolesByStepSize(stepSize) {
        const holesPts = [];

        for (let i = 0, l = this.holes.length; i < l; i++) {
            holesPts[i] = this.holes[i].getPointsByStepSize(stepSize);
        }

        return holesPts;
    }

    getPointsHolesAdaptively(tolerance) {
        const holesPts = [];

        for (let i = 0, l = this.holes.length; i < l; i++) {
            holesPts[i] = this.holes[i].getPointsAdaptively(tolerance);
        }

        return holesPts;
    }

    // get points of shape and holes (keypoints based on segments parameter)

    extractPoints(divisions) {
        return {
            shape: this.getPoints(divisions),
            holes: this.getPointsHoles(divisions),
        };
    }

    extractPointsByStepSize(stepSize) {
        return {
            shape: this.getPointsByStepSize(stepSize),
            holes: this.getPointsHolesByStepSize(stepSize),
        };
    }

    extractPointsAdaptively(tolerance) {
        return {
            shape: this.getPointsAdaptively(tolerance),
            holes: this.getPointsHolesAdaptively(tolerance),
        };
    }

    copy(source) {
        super.copy(source);

        this.holes = [];

        for (let i = 0, l = source.holes.length; i < l; i++) {
            const hole = source.holes[i];

            this.holes.push(hole.clone());
        }

        return this;
    }
}
