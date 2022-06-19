/**
 * CellModel
 */

import BaseElementModel from '@gaoding/editor-framework/src/base/element-base-model';

export default class CellModel extends BaseElementModel {
    constructor(data) {
        super(data);
        // 初始化拼图cell元素
        this.$active = false;
        this.$loaded = false;
        this.$activeSide = '';
        this.offset = data.offset || {
            x: 0,
            y: 0,
        };
        this.zoom = data.zoom || 1;
        this.rotate = Math.round(this.rotate, 10); // 避免transform计算带来的小数误差，如-270可能会变成90.0000...1
    }
}
