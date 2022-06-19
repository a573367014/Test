import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba } from '@gaoding/editor-framework/src/utils/model-adaptation';
import { pathsToSvg, svgToPaths } from '@gaoding/editor-utils/svg-path';

class brushModel extends BaseModel {
    constructor(data) {
        super(data);
        this.color = hexaToRgba(this.color);
    }

    get $paths() {
        return svgToPaths(this.path);
    }

    set $paths(v) {
        this.path = pathsToSvg(v);
    }
}

export default brushModel;
