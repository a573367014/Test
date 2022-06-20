import BaseChart from '../../base/base-chart';
import { changeChartScale } from '../../helpers/g2-helper';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';

/**
 * 漏斗图
 * @class Funnel
 */
@DimensionRevise(TwoDimension)
export default class Funnel extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                startRange: 0.15,
                endRange: 0.85,
            },
            yAxis: {
                startRange: 0.1,
                endRange: 0.9,
                min: 0,
            },
            settings: {
                shapeType: 'funnel',
                scaleNum: -1,
            },
            label: {
                offset: 0.91,
            },
        };
    }

    /**
     * 转换坐标轴
     * @override
     */
    _initCoord() {
        const { scaleNum } = this.model.settings;
        this.chart.coord().transpose().scale(1, scaleNum);
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        this.geom = this.chart.intervalSymmetric();
    }

    /**
     * 初始化图形style
     */
    _initGeomStyle() {
        this.initFunnel();
    }

    // 初始化图形方向和图案
    initFunnel() {
        const { shapeType } = this.model.settings;
        this.geom.shape(shapeType);
    }

    /**
     * @override
     * @param {object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initGeomStyle();
        this._initCoord();
        this.chart.repaint();
    }

    _initScalse() {
        super._initScalse();
        // 解决居中问题
        changeChartScale(this.chart, this.metrics.yField, {
            nice: false,
        });
    }
}
