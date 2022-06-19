import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';

import CellModel from '../cell/model';

export default class CollageModel extends BaseModel {
    constructor(data) {
        super(data);
        // 初始化拼图元素, 并实例子元素
        this.$cellIndex = -1;

        this.outerGap = data.outerGap || 0;
        this.gap = data.gap || 0;
        this.itemRoundness = data.itemRoundness || 0;
        if (this.elements.length) {
            this.elements = this.elements.map((data) => {
                const element = new CellModel(data);
                element.disableEditable();
                return element;
            });
        }
    }
}
