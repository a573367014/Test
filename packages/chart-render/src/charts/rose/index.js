import BaseChart from '../../base/base-chart';
import { registerRandomShape, unregisterShape } from '../../helpers/g2-helper';
import { formatPolarParams } from '../../helpers/index';
import { pick } from '@antv/g2/lib/util';

/**
 * @class Rose
 */
export default class Rose extends BaseChart {
    getDefaultModel() {
        return {
            settings: {
                startAngle: 202,
                allAngle: 360,
                coordInnerRadius: 0.2,
                distance: 0,
                coordRadius: 1,
            },
            label: {
                offset: 0.73,
            },
            yAxis: {
                endRange: 1,
            },
        };
    }

    /**
     * @override
     */
    _initCoord() {
        const polarParams = pick(this.model.settings, [
            'coordInnerRadius',
            'coordRadius',
            'startAngle',
            'allAngle',
        ]);

        // 初始化配置
        this.chart.coord('polar', formatPolarParams(polarParams));
    }

    /**
     * @override
     */
    _initScalse() {
        super._initScalse();
        /**
         * @hack [注意留意bug修复情况]
         * 在G2中，极坐标系下整圆的range计算有问题
         * bug修复后可以删除
         */
        const _adjustScalse = () => {
            const XScale = this.getScalesByField(this.metrics.xField);
            const count = XScale.values.length;

            // 两边留下分类空间的一半
            const offset = ((1 / count) * 1) / 2;
            // 坐标轴最前面和最后面留下空白防止绘制柱状图时
            const range = [offset, 1 - offset];

            // 更改range
            XScale.change({
                range: range,
            });
        };
        // this.chart.on('beforepaint', _adjustScalse);
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        this.geom = this.chart.interval();
        this._initShape();
    }

    _initGeomStyle() {
        const { borderColor, borderWidth } = this.model.settings;
        this.geom.style({
            lineWidth: borderWidth,
            stroke: borderColor,
        });
    }

    /**
     * SliceShapeName
     * 注册图形
     */
    registerSliceShape(sliceShapeName) {
        // 先注销
        if (sliceShapeName) {
            unregisterShape('interval', sliceShapeName);
        }
        const _self = this;
        // 注册图形
        return registerRandomShape('interval', {
            draw(cfg, container) {
                const points = cfg.points;
                const path = [];
                const { distance } = _self.model.settings;
                const sliceNumber = distance / 1000 / 2;

                // 矩形
                path.push(['M', points[0].x, points[0].y]);
                path.push(['L', points[1].x + sliceNumber, points[1].y]);
                path.push(['L', points[2].x - sliceNumber, points[2].y]);
                path.push(['L', points[3].x, points[3].y]);
                path.push(['L', points[0].x, points[0].y]);
                path.push('Z');
                //
                return container.addShape('path', {
                    attrs: {
                        fill: cfg.color,
                        fillOpacity: cfg.opacity,
                        path: this.parsePath(path),
                    },
                });
            },
        });
    }

    /**
     * @override
     * @param {Object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initCoord();
        this._initGeomStyle();
        this.chart.repaint();
    }

    /**
     * 初始化样式
     */
    _initShape() {
        this._sliceShapeName = this.registerSliceShape(this._sliceShapeName);
    }

    beforeDestroy() {
        unregisterShape('interval', this._sliceShapeName);
    }
}
