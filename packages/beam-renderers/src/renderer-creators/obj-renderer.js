import { PbrRenderer } from './pbr-renderer';
import { createSphereModel, createCubeModel, createPlaneModel } from '../data/geometry';

export class ObjRenderer extends PbrRenderer {
    async updateShapeModel(model) {
        const { geometry } = model;
        let geoModel, boundingBox, sideLength;
        const type = geometry.type;

        if (type === 'sphere') {
            const { radius } = geometry;
            geoModel = createSphereModel(50, radius);
            boundingBox = {
                min: [-radius, -radius, -radius],
                max: [radius, radius, radius],
            };
        } else if (type === 'cuboid') {
            sideLength = geometry.sideLength;
            geoModel = createCubeModel(sideLength);
            boundingBox = {
                min: sideLength.map((x) => -x),
                max: sideLength,
            };
        } else if (type === 'plane') {
            sideLength = geometry.sideLength;
            geoModel = createPlaneModel([sideLength, sideLength], { division: 100 });
            const sideData = sideLength.concat([0]);
            boundingBox = {
                min: sideData.map((x) => -x),
                max: sideData,
            };
        }

        this.commonUniforms.set('u_BoundingBox', boundingBox.max);

        this.boundingBox = boundingBox;
        this.modelSize = 2 * Math.hypot(...boundingBox.max);
        this.updateEyeDistance(model);
        if (this.modelSize <= 1) {
            this.meshError = true;
            return;
        }
        const angle = (model.viewAngle * Math.PI) / 180;
        this.canvasBaseSize = this.modelSize / Math.cos(angle / 2);

        this.setModel(geoModel);
    }
}
