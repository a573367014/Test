// bend bufferGeometry
// yunyang@gaoding.com

import { Vector3 } from '../math/Vector3.js';

export class Bend {
    runPattern(bufferGeometry, options) {
        let direction;
        let axis;
        let angle;
        const { bendType = 0 } = options;
        switch (bendType) {
            case '0':
                direction = new Vector3(-1, 0, 0).multiplyScalar(Math.sign(options.bend_intersity));
                axis = new Vector3(0, 0, 1);
                angle = Math.PI * Math.abs(options.bend_intersity);
                break;
            case '1':
                direction = new Vector3(0, 1, 0).multiplyScalar(Math.sign(options.bend_intersity));
                axis = new Vector3(0, 0, 1);
                angle = Math.PI * Math.abs(options.bend_intersity);
                break;
            case '2':
                direction = new Vector3(0, 0, 1).multiplyScalar(Math.sign(options.bend_intersity));
                axis = new Vector3(0, 1, 0);
                angle = Math.PI * Math.abs(options.bend_intersity);
                break;
            case '3':
                direction = new Vector3(0, 0, 1).multiplyScalar(Math.sign(options.bend_intersity));
                axis = new Vector3(1, 0, 0);
                angle = Math.PI * Math.abs(options.bend_intersity);
        }
        this.RUN(bufferGeometry, direction, axis, angle);
    }

    RUN(bufferGeometry, direction, axis, angle) {
        if (angle === 0) return; // angle in radius
        const thirdAxis = new Vector3();
        thirdAxis.crossVectors(direction, axis);

        // let InverseP =  new Matrix4().getInverse( P );
        const newVertices = [];

        // calculate boundingbox
        const meshGeometryBoundingBoxMaxx = 0;
        let meshGeometryBoundingBoxMinx = 0;
        let meshGeometryBoundingBoxMaxy = 0;
        let meshGeometryBoundingBoxMiny = 0;
        let meshGeometryBoundingBoxMaxz = 0;
        let meshGeometryBoundingBoxMinz = 0;

        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        for (let i = 0; i < vertexNumb; i++) {
            const tempPosition = new Vector3();
            tempPosition.fromArray(positions, i * 3);
            tempPosition.x = Math.meshGeometryBoundingBoxMaxx = Math.max(
                meshGeometryBoundingBoxMaxx,
                tempPosition.x,
            );
            meshGeometryBoundingBoxMinx = Math.min(meshGeometryBoundingBoxMinx, tempPosition.x);
            meshGeometryBoundingBoxMaxy = Math.max(meshGeometryBoundingBoxMaxy, tempPosition.y);
            meshGeometryBoundingBoxMiny = Math.min(meshGeometryBoundingBoxMiny, tempPosition.y);
            meshGeometryBoundingBoxMaxz = Math.max(meshGeometryBoundingBoxMaxz, tempPosition.z);
            meshGeometryBoundingBoxMinz = Math.min(meshGeometryBoundingBoxMinz, tempPosition.z);
        }

        const meshWidthX = meshGeometryBoundingBoxMaxx - meshGeometryBoundingBoxMinx;

        const center = new Vector3(
            0.5 * (meshGeometryBoundingBoxMaxx + meshGeometryBoundingBoxMinx),
            0.5 * (meshGeometryBoundingBoxMaxy + meshGeometryBoundingBoxMiny),
            0.5 * (meshGeometryBoundingBoxMaxz + meshGeometryBoundingBoxMinz),
        );

        const radius = meshWidthX / angle;

        for (let i = 0; i < vertexNumb; i++) {
            newVertices[i] = new Vector3();
            // local coordinate //not sure
            const tempPosition = new Vector3();
            tempPosition.fromArray(positions, i * 3);
            newVertices[i].copy(tempPosition).sub(center); // .applyMatrix4( InverseP );
            const x = newVertices[i].dot(thirdAxis);
            const y = newVertices[i].dot(direction);
            const z = newVertices[i].dot(axis);
            newVertices[i] = new Vector3(x, y, z);
        }

        const circleCenterInLocalCoord = new Vector3(0, radius, 0);

        for (let i = 0; i < vertexNumb; i++) {
            const s = newVertices[i].x;
            const h = newVertices[i].y;
            const alpha = (s * angle) / meshWidthX;
            const s0 = (radius - h) * Math.sin(alpha);
            const h0 = -(radius - h) * Math.cos(alpha);
            const offsetFromCircleCenter = new Vector3(s0, h0, newVertices[i].z);
            newVertices[i] = new Vector3();
            newVertices[i].add(circleCenterInLocalCoord).add(offsetFromCircleCenter);

            // transform to world space
            const finalVertices = new Vector3();
            finalVertices.add(thirdAxis.clone().multiplyScalar(newVertices[i].x));
            finalVertices.add(direction.clone().multiplyScalar(newVertices[i].y));
            finalVertices.add(axis.clone().multiplyScalar(newVertices[i].z));
            finalVertices.add(center);
            positions[i * 3 + 0] = finalVertices.x;
            positions[i * 3 + 1] = finalVertices.y;
            positions[i * 3 + 2] = finalVertices.z;
        }

        // bufferGeometry.computeFaceNormals();
        // bufferGeometry.verticesNeedUpdate = true;
        // bufferGeometry.normalsNeedUpdate = true;
    }
}
