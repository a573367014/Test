import BaseChart from '../../base/base-chart';
import { merge } from '@antv/g2/lib/util';
import ComputeWaffle from '../../controller/data/instructs/compute-waffle';

/**
 * 华夫图
 * @class Waffle
 */
export default class Waffle extends BaseChart {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            xAxis: {
                enable: false,
                startRange: null,
                endRange: null,
            },
            YAxis: {
                enable: false,
                startRange: null,
                endRange: null,
            },
        });
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        const { chart } = this;
        const geom = chart.point();
        this.geom = geom;
        this.geoms = [geom];
        chart.legend('_hStep', false);
        chart.legend('_wStep', false);
    }

    // 初始化样式
    _initGeomStyle() {
        const { metrics, chart, model } = this;
        const { gapRatioSize } = model.settings;
        const { yField, colorDimension } = metrics;
        chart.scale({
            [yField]: { nice: false },
            [colorDimension]: { nice: false },
        });
        this.geoms.forEach((geom) => {
            if (!geom || geom.destroyed) return;
            geom.shape('square').size(gapRatioSize);
        });
    }

    beforeInit() {
        const { metrics, model } = this;
        const { maxCount, rows } = model.settings;
        this._computeWaffle = new ComputeWaffle({
            yField: metrics.yField,
            colorDimension: metrics.colorDimension,
            xField: metrics.xField,
            maxCount: maxCount,
            rows: rows,
        });
        this.$dataSetController.registerTranform(this._computeWaffle);
        super.beforeInit();
    }

    initMetrice() {
        super.initMetrice();
        const { xField, colorDimension } = this.metrics;
        if (xField === colorDimension) {
            this.metrics.xField = 'xField';
        }
    }

    /**
     * @override
     * @param {object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        if (
            this._computeWaffle.maxCount !== settings.maxCount ||
            this._computeWaffle.rows !== settings.rows
        ) {
            this._computeWaffle.maxCount = settings.maxCount;
            this._computeWaffle.rows = settings.rows;
            this._initData(); // 触发数据重新设置
        }

        this._initGeomStyle();
        this.chart.repaint();
    }
}
