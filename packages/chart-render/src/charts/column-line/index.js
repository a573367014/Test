import BaseColumn from '../../base/base-column/base-column';
import LegendController from '../../controller/legend/legend';
import YAxisController from '../../controller/axis/y-axis';
import { parseColorsToArray } from '../../helpers/colors';
import { merge, pick } from '@antv/g2/lib/util';
import { addLineGeomAttr, addPointGeomAttr } from '../../helpers/geom';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * 柱状图 + 折线图
 * @class Column
 */
@PrecentDecorator(false)
export default class ColumnLine extends BaseColumn {
    /**
     * 获取默认值
     */
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            y2Axis: {
                // 第二个y轴是默认在右边
                position: 'right',
                label: {
                    autoLayout: true,
                },
            },
        });
    }

    /**
     * 新增初始化一个折线
     * @override
     */
    _initGeom() {
        super._initGeom();
        // 新增
        this.lineGeom = this.chart.line();
        this.pointGeom = this.chart.point();
        this.geoms = [this.geom, this.lineGeom, this.pointGeom];
    }

    /**
     * 折线需要初始化样式
     * @override
     */
    _initGeomStyle() {
        super._initGeomStyle();

        // line样式
        addLineGeomAttr(
            this.lineGeom,
            pick(this.model.settings, ['lineWidth', 'lineShapeType', 'lineDash', 'lineOpacity']),
        );

        // ponit样式
        addPointGeomAttr(
            this.pointGeom,
            pick(this.model.settings, [
                'enablePoint',
                'pointOpaticy',
                'pointRadius',
                'pointShapeType',
                'pointBorderColor',
                'pointBorderWidth',
                'pointFillColor',
            ]),
        );
    }

    /**
     * 折线需要配置纬度信息
     * @override
     */
    _initGeomMetrices() {
        const { yField, xField, y2Field } = this.metrics;
        this.geom.position(`${xField}*${yField}`);
        this.lineGeom.position(`${xField}*${y2Field}`);
        this.pointGeom.position(`${xField}*${y2Field}`);
        // 初始化颜色
        this.initColors();
    }

    /**
     * 解析颜色配置
     */
    initColors() {
        const { colors, colorType } = this.model;
        const [columnColor, lineColor] = parseColorsToArray(colors, colorType);
        this.geom.color(columnColor);
        this.lineGeom.color(lineColor);
        this.pointGeom.color(lineColor);
    }

    /**
     * 混合图表的图例属于混合图例，需要全局配置，没有field字段
     * @override
     */
    _initLegends() {
        this.$legendController = new LegendController(this.chart, this.model.legend, null);
        this.model.legend = this.$legendController.config;
    }

    /**
     * 需要初始化右侧坐标轴
     * @override
     */
    _initAxes() {
        super._initAxes();
        // 多轴
        const { y2Axis } = this.model;
        if (y2Axis) {
            this.$y2AxisController = new YAxisController(this.chart, this.metrics.y2Field, y2Axis);
        }
    }

    /**
     * 改变颜色方法变化
     * @override
     * @param {Array} colors
     */
    changeColors(colors) {
        this.model.colors = colors;
        this.initColors();
        this._callChartNativeFunc('repaint');
    }

    getColorScalesLenght() {
        return 2;
    }
}
