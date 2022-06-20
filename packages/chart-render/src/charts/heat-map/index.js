import BaseChart from '../../base/base-chart';
import { COLOR_TYPE_MAP, SCALE_TYPES } from '../../helpers/constants';
import { changeChartScale } from '../../helpers/g2-helper';

/**
 * @class HeatMap
 */
export default class HeatMap extends BaseChart {
    getDefaultModel() {
        return {
            colorType: COLOR_TYPE_MAP.GRADIEND,
            xAxis: {
                startRange: null,
                endRange: null,
            },
            YAxis: {
                startRange: null,
                endRange: null,
            },
            settings: {
                stroke: '#fff',
                lineWidth: 1,
            },
        };
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        const { chart } = this;
        const geom = chart.polygon();
        this.geom = geom;
        this.geoms = [geom];
    }

    initMetrice() {
        super.initMetrice();
        const colorDimension = this.metrics.colorDimension;
        const colorDimensionScale = this.model.scales[colorDimension] || {};
        this.model.scales[colorDimension] = {
            nice: true,
            type: SCALE_TYPES.LINEAR,
            ...colorDimensionScale,
        };
    }

    _initGeomMetrices() {
        const colorType = this.model.colorType;
        if (colorType !== COLOR_TYPE_MAP.GRADIEND) {
            changeChartScale(this.chart, this.metrics.colorDimension, {
                type: SCALE_TYPES.CAT,
            });
        }
        super._initGeomMetrices();
    }

    // 初始化样式
    _initGeomStyle() {
        // 初始化setting描边
        const { lineWidth, stroke } = this.model.settings;
        this.geom.style({
            lineWidth: lineWidth,
            stroke: stroke,
        });
    }

    /**
     * @override
     * @param {object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initGeomStyle();
        this.chart.repaint();
    }
}
