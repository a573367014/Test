// twist bufferGeometry
// yunyang@gaoding.com

import { Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';

export class TWIST {
    runPattern(bufferGeometry, options) {
        let axis, angle;
        if (options.pattern === '0') {
            axis = new Vector3(1, 0, 0);
            angle = Math.PI / 4;
        } else if (options.pattern === '1') {
            axis = new Vector3(0, 1, 0);
            angle = Math.PI / 4;
        } else if (options.pattern === '2') {
            axis = new Vector3(0, 0, 1);
            angle = Math.PI / 4;
        }
        const controlPointMesh = this.RUN(bufferGeometry, axis, angle, options.intensity);
        return controlPointMesh;
    }

    // twist geometry with angle*intensity around axis at center
    RUN(bufferGeometry, axis, angle, intensity) {
        if (intensity === 0) return;
        axis.normalize();

        // calculate boundingbox
        let meshGeometryBoundingBoxMaxx = 0;
        let meshGeometryBoundingBoxMinx = 0;
        let meshGeometryBoundingBoxMaxy = 0;
        let meshGeometryBoundingBoxMiny = 0;
        let meshGeometryBoundingBoxMaxz = 0;
        let meshGeometryBoundingBoxMinz = 0;

        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        for (let i = 0; i < vertexNumb; i++) {
            const vertex = new Vector3();
            vertex.fromArray(positions, i * 3);
            // var vertex = geometry.vertices[i];
            if (vertex.x > meshGeometryBoundingBoxMaxx) {
                meshGeometryBoundingBoxMaxx = vertex.x;
            }
            if (vertex.x < meshGeometryBoundingBoxMinx) {
                meshGeometryBoundingBoxMinx = vertex.x;
            }
            if (vertex.y > meshGeometryBoundingBoxMaxy) {
                meshGeometryBoundingBoxMaxy = vertex.y;
            }
            if (vertex.y < meshGeometryBoundingBoxMiny) {
                meshGeometryBoundingBoxMiny = vertex.y;
            }
            if (vertex.z > meshGeometryBoundingBoxMaxz) {
                meshGeometryBoundingBoxMaxz = vertex.z;
            }
            if (vertex.z < meshGeometryBoundingBoxMinz) {
                meshGeometryBoundingBoxMinz = vertex.z;
            }
        }

        // let XWidth = meshGeometryBoundingBoxMaxx - meshGeometryBoundingBoxMinx;
        // let YWidth = meshGeometryBoundingBoxMaxy - meshGeometryBoundingBoxMiny;
        // let ZWidth = meshGeometryBoundingBoxMaxz - meshGeometryBoundingBoxMinz;

        const center = new Vector3(
            0.5 * (meshGeometryBoundingBoxMinx + meshGeometryBoundingBoxMaxx),
            0.5 * (meshGeometryBoundingBoxMiny + meshGeometryBoundingBoxMaxy),
            0.5 * (meshGeometryBoundingBoxMinz + meshGeometryBoundingBoxMaxz),
        );

        // apply the twist on geometry
        const matrix = new Matrix4();
        for (let i = 0; i < vertexNumb; i++) {
            const vertex = new Vector3();
            vertex.fromArray(positions, i * 3);
            const projectedAxis = vertex.clone().sub(center).dot(axis);
            const newAngle = 0.01 * projectedAxis * angle * intensity;
            matrix.makeRotationAxis(axis, newAngle);
            const finalPos = vertex.clone().sub(center).applyMatrix4(matrix).add(center);
            positions[i * 3 + 0] = finalPos.x;
            positions[i * 3 + 1] = finalPos.y;
            positions[i * 3 + 2] = finalPos.z;
        }
    }
}
