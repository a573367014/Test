import XAxis from '../../controller/axis/x-axis';
import YAxis from '../../controller/axis/y-axis';
import createBarRectShape from '../../render/shape/bar-rect-shape';
import { merge } from '@antv/g2/lib/util';
import BaseColumn from '../../base/base-column/base-column';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * 基础条形图
 * @class ColumnBar
 */
@DimensionRevise(TwoDimension)
@PrecentDecorator(false)
export default class DynamicBar extends BaseColumn {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                itemWidthRatio: 0.6,
                itemMaxWidth: 80,
            },
            label: {
                offset: -1.36,
            },
        });
    }

    /**
     * 转换坐标轴
     * 条形图是在默认直角坐标系下转换坐标轴生成
     * @override
     */
    _initCoord() {
        this.chart.coord().transpose();
    }

    /**
     * @override
     * 坐标轴也要作出相应的颠倒
     */
    _initAxes() {
        const { xAxis, yAxis } = this.model;
        xAxis.dimType = 'y';
        yAxis.dimType = 'x';
        this.$xAxisController = new XAxis(this.chart, this.metrics.yField, xAxis);
        this.$yAxisController = new YAxis(this.chart, this.metrics.xField, yAxis);
        this._setYAxisLabelFormatter(this.$xAxisController, this.model.settings.isTransformPercent);
    }

    // 绘制半径
    _createShape() {
        return createBarRectShape(this);
    }
}
