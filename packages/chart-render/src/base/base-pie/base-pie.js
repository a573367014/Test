import BaseChart from '../base-chart';
import XAxisController from '../../controller/axis/x-axis';
import YAxisController from '../../controller/axis/y-axis';
import pieSchema from './base-schema';
import { merge, pick } from '@antv/g2/lib/util';
import { getDefaultBySchema } from '../../helpers/schema';
import { formatPolarParams } from '../../helpers/index';
import { parseColorToString, parseColorsWithType } from '../../helpers/colors';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * @class BasePie
 */

@PrecentDecorator(false)
export default class BasePie extends BaseChart {
    getDefaultModel() {
        return {
            yAxis: {
                startRange: 0, // 从哪里开始
                endRange: 1, // 从哪里结束
                borderWidth: 0,
                borderColor: '#fff',
            },
        };
    }

    /**
     * 合并默认的settings
     */
    constructor(container, model) {
        model.xAxis = null;
        model.yAxis = null;
        super(container, model);
    }

    beforeInit() {
        this.model.settings = merge(getDefaultBySchema(pieSchema), this.model.settings);
    }

    /**
     * 坐标系
     * @override
     */
    _initCoord() {
        // 初始化配置
        this.chart.coord('theta', {
            transposed: true,
            ...formatPolarParams(
                pick(this.model.settings, [
                    'coordInnerRadius',
                    'coordRadius',
                    'startAngle',
                    'allAngle',
                ]),
            ),
        });
    }

    // 初始化图形
    _initGeom() {
        this.geom = this.chart.intervalStack();
    }

    // 初始化坐标轴
    _initAxes() {
        this.$xAxisController = new XAxisController(this.chart, this.metrics.xField, {
            enable: false,
            endRange: 1,
        });
        this.$yAxisController = new YAxisController(this.chart, this.metrics.yField, {
            enable: false,
            endRange: 1,
        });
    }

    _initGeomMetrices() {
        const { metrics, model, geom } = this;
        const colors = parseColorsWithType(model.colors, model.colorType);
        geom.position(metrics.yField).color(metrics.colorDimension, colors);
    }

    _initGeomStyle() {
        const { borderColor, borderWidth } = this.model.settings;
        this.geom.style({
            lineWidth: borderWidth,
            stroke: parseColorToString(borderColor),
            lineCap: 'round',
            lineJoin: 'round',
        });
    }

    // settings变化
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initCoord();
        this._initGeomStyle();

        this.chart.repaint();
    }

    // label变化
    changeLabel(cfg) {
        this._initCoord();
        super.changeLabel(cfg);
    }
}
