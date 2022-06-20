import BaseColumn from '../../base/base-column/base-column';
import PrecentDecorator, { PRECENT } from '../../helpers/decorator/precent-decorator';
import { changeChartScale } from '../../helpers/g2-helper';
import createLiquidFillQauge from '../../render/shape/liquid-fill-gauge';
import { pick } from '@antv/g2/lib/util';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';

/**
 * 水波图
 * @class LiquidGauge
 */
@DimensionRevise(TwoDimension)
@PrecentDecorator(false)
export default class LiquidGauge extends BaseColumn {
    getDefaultModel() {
        // 默认值
        return {
            // 默认隐藏坐标轴
            xAxis: {
                enable: false,
            },
            yAxis: {
                enable: false,
                max: 100,
                endRange: 1,
            },
            settings: {
                isTransformPercent: true,
                autoItemMargin: true,
                itemMaxWidth: 500,
                itemWidthRatio: 0.6,
                itemMarginRatio: 0.2,
                itemborderWidth: 3,
            },
            label: {
                offset: 0,
            },
        };
    }

    /**
     * 水波图形
     * @override
     */
    _createShape() {
        return createLiquidFillQauge(this);
    }

    _initGeomStyle() {
        super._initGeomStyle();

        if (!this.geom) return;
        const { itemborderColor } = this.model.settings;

        // 声明shape
        this.geom.style({
            stroke: itemborderColor,
            warpRing: pick(this.model.settings, [
                'enableWarpRing',
                'warpRingRadius',
                'itemborderWidth',
            ]),
        });
    }

    /**
     * @override
     */
    _initScalse() {
        // 最大为百分百
        changeChartScale(this.chart, PRECENT, {
            max: 100,
        });
        super._initScalse();
    }
}
