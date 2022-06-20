import BaseChart from '../../base/base-chart';
import { addLineGeomAttr, addPointGeomAttr } from '../../helpers/geom';
import { pick } from '@antv/g2/lib/util';

/**
 * @class path
 */
export default class path extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                startRange: 0,
                endRange: 1,
            },
            settings: {
                lineShapeType: 'smooth',
                lineWidth: 3,
                lineDash: [0, 0],
                lineOpacity: 1,

                enablePoint: true,
                pointShapeType: 'circle',
                pointRadius: 10,
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
        const { chart } = this;
        this.geom = chart.path();
        this.pointGeom = chart.point();
        this.geoms = [this.geom, this.pointGeom];
    }

    _initGeomStyle() {
        // 线条
        addLineGeomAttr(
            this.geom,
            pick(this.model.settings, ['lineWidth', 'lineShapeType', 'lineDash', 'lineOpacity']),
        );
        // 点
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
     * @override
     * @param {object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initGeomStyle();
        this.chart.repaint();
    }
}
