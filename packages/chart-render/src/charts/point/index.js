import BaseChart from '../../base/base-chart';
import { pickPropsWith } from '../../helpers/index';

/**
 * @class Point
 */
export default class Point extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                startRange: 0,
                endRange: 1,
            },
            settings: {
                pointType: 'circle',
                pointRadius: 6,
                pointOpaticy: 1,
                pointBorderWidth: 0,
                pointBorderColor: '#ccccccff',
                pointFillColor: '#ccccccff',
            },
            label: {
                offset: 0.91,
            },
        };
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        this.geom = this.chart.point();
    }

    /**
     * 初始化图形配置
     * @override
     */
    _initGeomStyle() {
        const { pointRadius, pointType } = this.model.settings;
        // 可能要关闭
        if (!pointRadius || pointRadius <= 0) {
            return this.geom.hide();
        }

        // Todo: label 的布局优化，大量散点图的情况
        // type: 'scatter',

        // size
        this.geom
            .size(pointRadius)
            .style({
                ...pickPropsWith(this.model.settings, {
                    pointBorderColor: 'stroke',
                    pointBorderWidth: 'lineWidth',
                    pointFillColor: 'fill',
                }),
            })
            .shape(pointType)
            .show();
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
