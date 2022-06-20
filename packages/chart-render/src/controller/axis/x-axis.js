import AxisController from './axis';
import { computedLabelWidth } from '../../helpers/axis';

/**
 * Y轴
 */
export default class XAxisController extends AxisController {
    constructor(chart, field, axisConfig = {}) {
        if (!axisConfig.dimType) {
            axisConfig.dimType = 'x';
        }
        super(chart, field, axisConfig);
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
            rotate: rotate + 90,
            textAlign: textAlign,
        });

        const moreOffset = labelTansformWidth + fontSize;
        return offset >= 0 ? offset + moreOffset : offset - moreOffset;
    }
}
