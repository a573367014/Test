import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';

class ninePatchModel extends BaseModel {
    constructor(data) {
        super(data);

        if (data.stretchPoint) {
            const { stretchPoint, originWidth, originHeight } = data;
            this.imageSlice = {
                left: stretchPoint.x,
                top: stretchPoint.y,
                right: originWidth - stretchPoint.x - 1,
                bottom: originHeight - stretchPoint.y - 1,
            };
            delete this.stretchPoint;
        }
    }
}

export default ninePatchModel;
