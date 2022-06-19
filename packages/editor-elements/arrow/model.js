import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba } from '@gaoding/editor-framework/src/utils/model-adaptation';
import { fitArrowTrunk } from '@gaoding/editor-framework/src/utils/fit-elements';

class arrowModel extends BaseModel {
    constructor(data) {
        super(data);
        this.color = hexaToRgba(this.color);

        if (this.$originalScale === null) {
            const minScale = Math.min(1, this.width / this.minWidth);
            const scale =
                this.height /
                minScale /
                Math.max(
                    this.head.height + this.head.top,
                    this.tail.height + this.tail.top,
                    this.trunk.height + this.trunk.top,
                );
            this.$originalScale = scale.toFixed(2) - 0;
        }

        fitArrowTrunk(this);
        delete this.originalScale;
    }

    get $headLeft() {
        const { tail, head } = this;
        const $originalScale = this.$originalScale || 1;

        const minWidth = this.minWidth;
        const modelWidth = this.width / $originalScale;

        const trunkWidth = Math.max(minWidth, modelWidth) - (tail.left + tail.width + head.width);

        return this.trunk.left + trunkWidth;
    }

    get $trunkWidth() {
        const { tail, head, trunk } = this;
        const $originalScale = this.$originalScale || 1;

        const minWidth = this.minWidth;
        const modelWidth = this.width / $originalScale;

        const trunkWidth = Math.max(minWidth, modelWidth) - (tail.left + tail.width + head.width);
        const trunkInHeadWidth = trunk.left + trunk.width - head.left;

        return Math.max(0, trunkWidth + trunkInHeadWidth);
    }
}

export default arrowModel;
