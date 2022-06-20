import IntervalGroup from '../interval/index';
import XAxis from '../../controller/axis/x-axis';
import YAxis from '../../controller/axis/y-axis';
import createBarRectShape from '../../render/shape/bar-rect-shape';
import { merge, pick } from '@antv/g2/lib/util';

/**
 * 分组条形图
 * @class Bar
 */
export default class Bar extends IntervalGroup {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                itemWidthRatio: 0.6,
                itemMaxWidth: 80,
                autoItemMargin: false,
            },
            label: {
                offset: -1.56,
                textAlign: 'right',
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

    /**
     * @override
     */
    _initGeomStyle() {
        super._initGeomStyle();
        const { itemborderWidth, itemborderColor, itemTopRadiusRatio, itemBottomRadiusRatio } =
            this.model.settings;

        // 是加上百分比
        const itemTopRadiusRatioPrecent = itemTopRadiusRatio + '%';
        const itemBottomRadiusRatioPrecent = itemBottomRadiusRatio + '%';

        // 声明shape
        this.geom.style({
            lineWidth: itemborderWidth,
            stroke: itemborderColor,
            radius: [
                itemTopRadiusRatioPrecent,
                itemTopRadiusRatioPrecent,
                itemBottomRadiusRatioPrecent,
                itemBottomRadiusRatioPrecent,
            ],
            shape: pick(this.model.settings, [
                'specialShape',
                'autoReverse',
                'shapePath',
                'shapeRenderType',
                'shapeRenderSize',
                'opacity',
            ]),
            // 裁剪配置
            clipShape: pick(this.model.settings, [
                'clipShapeHeight', // 堆叠柱状图专有字段
                'enableClipShape',
                'clipShapePath',
                'clipShapeRenderType',
                'clipShapeRenderSize',

                'autoFillColor',
                'clipShapeColor',
                'clipShapeOpacity',
                'clipShapeBorderColor',
                'clipShapeBorderWidth',
            ]),
        });
    }

    /**
     * 核心绘画图形
     * @override
     */
    _createShape() {
        return createBarRectShape(this);
    }
}
