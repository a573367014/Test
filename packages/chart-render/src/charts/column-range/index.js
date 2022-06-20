import BaseColumn from '../../base/base-column/base-column';
import ComputeRange from '../../controller/data/instructs/compute-range';
import LabelController from '../../controller/label/index';
import { merge } from '@antv/g2/lib/util';

/**
 * 基础区间柱状图
 * @class ColumnRange
 */
export default class ColumnRange extends BaseColumn {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                autoItemMargin: true,
            },
            label: {
                offset: 0.3,
            },
        });
    }

    beforeInit() {
        this._computeRange = new ComputeRange({
            startRangeKey: this._startRangeKey,
            endRangKey: this._endRangKey,
            rangeKey: this.metrics.yField,
        });
        this.$dataSetController.registerTranform(this._computeRange);
        super.beforeInit();
    }

    initMetrice() {
        super.initMetrice();
        const { yField } = this.metrics;
        if (Array.isArray(yField)) {
            const [startRangeKey, endRangKey] = yField;
            this._startRangeKey = startRangeKey;
            this._endRangKey = endRangKey;
            this.metrics.yField = `${startRangeKey}-${endRangKey}`;
        }
    }

    /**
     * @override
     */
    _initLabel() {
        this.$labelController = new LabelController(
            this.model.label,
            this.metrics.yField,
            this.geom,
        );
    }
}
