import BaseChart from '../../base/base-chart';
import { formatPolarParams } from '../../helpers/index';
import IntervalSize from './interval-size';
import Util, { pick, each } from '@antv/g2/lib/util';
import { Axis } from '@antv/component/lib';

import { addPointGeomAttr } from '../../helpers/geom';

/**
 * 玉环图
 * @class RadialBar
 */
export default class RadialBar extends BaseChart {
    getDefaultModel() {
        return {
            // 默认隐藏坐标轴
            xAxis: {
                enable: false,
                title: {
                    enable: false,
                },
                grid: {
                    enable: false,
                },
                tickLine: {
                    enable: false,
                },
                subTickLine: {
                    enable: false,
                },
                label: {
                    textAlign: 'center',
                },
            },
            yAxis: {
                title: {
                    enable: false,
                },
                line: {
                    enable: false,
                },
                grid: {
                    enable: false,
                },
                endRange: 1,
            },
            settings: {
                startAngle: 270,
                itemWidthRatio: 0.14,
                itemMaxWidth: 9,
                allAngle: 280,
                coordRadius: 1,
                coordInnerRadius: 0.23,
                enablePoint: true,
                pointShapeType: 'circle',
                pointRadiusRatio: 1.5,
                pointOpaticy: 1,
                pointBorderWidth: 0,
                pointBorderColor: '#ccccccff',
                pointFillColor: '#ccccccff',
            },
            label: {
                offset: 0.64,
            },
        };
    }

    /**
     * 坐标系
     * @override
     */
    _initCoord() {
        const chart = this.chart;
        const polarParams = pick(this.model.settings, [
            'coordInnerRadius',
            'coordRadius',
            'startAngle',
            'allAngle',
        ]);

        // 初始化配置
        chart.coord('polar', formatPolarParams(polarParams)).transpose();
    }

    /**
     * @override
     */
    _initGeom() {
        const chart = this.chart;

        // init
        this.geom = new IntervalSize();
        chart.addGeom(this.geom);

        // point
        this.pointGeom = chart.point();
        this.geoms = [this.geom, this.pointGeom];

        this._rewriteAxisController();
    }

    /**
     * @override
     */
    _initGeomStyle() {
        this._initBarStyle();
        this._initPointStyle();
    }

    // 初始化线
    _initBarStyle() {
        const { model, geom } = this;

        geom.style({
            itemWidthRatio: model.settings.itemWidthRatio,
            itemMaxWidth: model.settings.itemMaxWidth,
        });
    }

    // 初始化圆点
    _initPointStyle() {
        const { pointRadiusRatio } = this.model.settings;
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
        this.pointGeom.size(this.metrics.yField, () => {
            const intervalSize = this.geom.getNormalWidthSize();
            return intervalSize * pointRadiusRatio;
        });
    }

    /**
     * @hack
     * 重写方法， 由于g2在极坐标系下屏蔽了坐标轴的渲染。
     * 所以重写方法，渲染坐标轴坐标轴，解决在极坐标系下不显示坐标轴的问题
     */
    _rewriteAxisController() {
        const axisController = this.chart.get('axisController');
        axisController.createAxis = function createAxis(xScale, yScales, viewId) {
            const self = this;
            const coord = this.coord;
            let xAxis;

            // x 坐标轴
            if (xScale && !self._isHide(xScale.field)) {
                xAxis = self._drawAxis(coord, xScale, yScales[0], 'x', viewId);
            }

            // y 坐标轴
            each(yScales, (yScale, index) => {
                if (!self._isHide(yScale.field)) {
                    self._drawAxis(coord, yScale, xScale, 'y', viewId, xAxis, index);
                }
            });
        };

        // 绘制坐标轴
        axisController._drawAxis = function _drawAxis(
            coord,
            scale,
            verticalScale,
            dimType,
            viewId,
            xAxis,
            index,
        ) {
            const container = this.container;
            const canvas = this.canvas;
            let C; // 坐标轴类
            let appendCfg; // 每个坐标轴 start end 等绘制边界的信息

            if (
                coord.type === 'cartesian' ||
                (coord.type === 'polar' && dimType === 'x' && coord.isTransposed)
            ) {
                C = Axis.Line;
                appendCfg = this._getLineCfg(coord, scale, dimType, index);
            } else if (coord.type === 'helix' && dimType === 'x') {
                C = Axis.Helix;
                appendCfg = this._getHelixCfg(coord);
            } else if (
                (coord.type === 'polar' && dimType === 'y' && coord.isTransposed) ||
                dimType === 'x'
            ) {
                C = Axis.Circle;
                appendCfg = this._getCircleCfg(coord);
            } else {
                C = Axis.Line;
                appendCfg = this._getRadiusCfg(coord);
            }
            let cfg = this._getAxisCfg(coord, scale, verticalScale, dimType, index, viewId);
            cfg = Util.mix({}, cfg, appendCfg);

            if (dimType === 'y' && xAxis && xAxis.get('type') === 'circle') {
                cfg.circle = xAxis;
            }
            cfg._id = viewId + '-' + dimType;
            if (!Util.isNil(index)) {
                cfg._id = viewId + '-' + dimType + index;
            }

            Util.mix(cfg, {
                canvas,
                // 每个 axis 需要单独的 group，
                // 否则所有的 aixs 的文本都混在一起了
                // 同时无法知道是哪个坐标轴的事件
                group: container.addGroup({
                    viewId,
                }),
            });

            const axis = new C(cfg);
            axis.render();
            this.axes.push(axis);
            return axis;
        };
    }

    /**
     * @override
     * @param {Obejct} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initCoord();
        this._initGeomStyle();
        this.chart.repaint();
    }
}
