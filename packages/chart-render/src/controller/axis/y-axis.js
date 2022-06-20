import AxisController from './axis';
import { computedLabelWidth } from '../../helpers/axis';

import { merge } from '@antv/g2/lib/util';
/**
 * Y轴
 */
export default class YAxisController extends AxisController {
    constructor(chart, field, axisConfig = {}) {
        if (!axisConfig.dimType) {
            axisConfig.dimType = 'y';
        }
        super(chart, field, axisConfig);
    }

    /**
     * title不一致
     */
    getDefaultCfg() {
        const defaultCfg = super.getDefaultCfg();
        return merge(defaultCfg, {
            title: {
                textAlign: 'left', // 文本的对齐
                textBaseline: 'middle', // 文本垂直方向的基线
                position: 'end',
                autoRotate: false,
                relative: 'line',
                offset: 0,
            },
            position: 'left',
            startRange: 0, // 从哪里开始
            endRange: 0.95, // 从哪里结束
        });
    }

    /**
     * 自动计算label距离
     * @param {*} labelCfg
     */
    _autoComputedTitleOffsetByLabel(labelCfg) {
        const { enable, fontSize, rotate, textAlign, offset } = labelCfg;
        if (!enable) return 0;

        const maxLabelWidth = this.measureMaxLabel();
        const maxLabelHeight = fontSize;

        // 根据居中情况获取
        const labelTansformWidth = computedLabelWidth({
            width: maxLabelWidth,
            height: maxLabelHeight,
            rotate: rotate,
            textAlign: textAlign,
        });
        const moreOffset = labelTansformWidth + fontSize;
        return offset >= 0 ? offset + moreOffset : offset - moreOffset;
    }
}
