import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba } from '@gaoding/editor-framework/src/utils/model-adaptation';

class lineModel extends BaseModel {
    constructor(data) {
        super(data);
        this.stroke = hexaToRgba(this.stroke);
        this.fill = hexaToRgba(this.fill);
        this.height = this.strokeWidth;
    }
}

export default lineModel;
