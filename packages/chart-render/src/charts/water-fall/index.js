import BaseColumn from '../../base/base-column/base-column';
import ComputeFall from '../../controller/data/instructs/compute-fall';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';

/**
 * @class Waterfall
 */
@DimensionRevise(TwoDimension)
export default class WaterFall extends BaseColumn {
    getDefaultModel() {
        return {
            settings: {
                itemWidthRatio: 0.5,
                itemMaxWidth: 100,
                autoItemMargin: true,
                itemMarginRatio: 0.3,
                itemborderWidth: 0,
                itemborderColor: '#ccccccff',
            },
            label: {
                offset: 0.09,
            },
        };
    }

    beforeInit() {
        super.beforeInit();
        // 注册计算区间值
        this.computeFall = new ComputeFall();
        this.$dataSetController.registerTranform(this.computeFall);
    }

    _initLabel() {
        super._initLabel();
        this.$labelController.changeLabel({
            formatter: (text) => (Array.isArray(text) ? text[1] - text[0] : text),
        });
    }
}
