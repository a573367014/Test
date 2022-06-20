import StackInterval from '../stack-interval/index';
import XAxis from '../../controller/axis/x-axis';
import YAxis from '../../controller/axis/y-axis';
import LabelController from '../../controller/label/index';
import { merge } from '@antv/g2/lib/util';
import createStackBarRectShape from '../../render/shape/stack-bar-shape';

/**
 * 堆叠条形图
 * @class StackBar
 */
export default class StackBar extends StackInterval {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                itemWidthRatio: 0.6,
                itemMaxWidth: 80,
            },
            label: {
                offset: -1.14,
            },
        });
    }

    // 转换坐标轴
    _initCoord() {
        this.chart.coord().transpose();
    }

    // 坐标轴颠倒
    _initAxes() {
        const { xAxis, yAxis } = this.model;
        xAxis.dimType = 'y';
        yAxis.dimType = 'x';
        this.$xAxisController = new XAxis(this.chart, this.metrics.yField, xAxis);
        this.$yAxisController = new YAxis(this.chart, this.metrics.xField, yAxis);
        this._setYAxisLabelFormatter(this.$xAxisController, this.model.settings.isTransformPercent);
    }

    /**
     * init label
     * @override
     */
    _initLabel() {
        const { metrics } = this;
        this.$labelController = new LabelController(this.model.label, metrics.yField, this.geom);
        this._setLabelFormatter(this.model.settings.isTransformPercent);
    }

    /**
     * @override
     */
    _createShape() {
        return createStackBarRectShape(this);
    }
}
