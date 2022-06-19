import BaseModel from '../../base/element-base-model';
import { resetPathsBounding } from '../../utils/resize-element';
import {
    absSvgPath,
    normalizeSvgPath,
    pathsToSvg,
    svgToPaths,
} from '@gaoding/editor-utils/svg-path';

class mosaicPathModel extends BaseModel {
    constructor(data) {
        super(data);

        // 第一次初始化
        this.strokeWidth = data.type !== 'mosaicBrush' ? 0 : this.strokeWidth || 0;

        this.$paths = normalizeSvgPath(absSvgPath(this.$paths));
        if (!this.left && !this.top && (this.transform.position.x || this.transform.position.y)) {
            this.resize = 0b001;
            this.left = this.transform.position.x;
            this.top = this.transform.position.y;

            this.transform.position.x = 0;
            this.transform.position.y = 0;

            const preLeft = this.left;
            const preTop = this.top;
            const rect = resetPathsBounding(this, true);

            this.left = preLeft + rect.left;
            this.top = preTop + rect.top;
        }

        this.$guider = { show: false, marginShow: false, resizeShow: false };
    }

    get $paths() {
        return svgToPaths(this.path);
    }

    set $paths(v) {
        this.path = pathsToSvg(v);
    }
}

export default mosaicPathModel;
