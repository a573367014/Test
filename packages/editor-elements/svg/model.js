import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba } from '@gaoding/editor-framework/src/utils/model-adaptation';

import { forEach } from 'lodash';

class SvgModel extends BaseModel {
    constructor(data) {
        if (data.iconType) {
            data.iconType = data.iconType.toLocaleLowerCase();
        }

        super(data);

        const { colors } = this;
        forEach(colors || [], (value, key) => {
            colors[key] = hexaToRgba(value);
        });
    }

    get $renderProps() {
        return [this.width, this.height, this.opacity, this.maskInfo.enable];
    }
}

export default SvgModel;
