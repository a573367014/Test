import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba } from '@gaoding/editor-framework/src/utils/model-adaptation';

class ellipseModel extends BaseModel {
    constructor(data) {
        super(data);
        this.stroke = hexaToRgba(this.stroke);
        this.fill = hexaToRgba(this.fill);
    }
}

export default ellipseModel;
