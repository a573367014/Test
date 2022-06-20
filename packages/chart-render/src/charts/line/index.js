import BaseChart from '../../base/base-chart';
import { pickPropsWith } from '../../helpers/index';
import { registerRandomShape, unregisterShape } from '../../helpers/g2-helper';
import ComputeAverage from '../../controller/data/instructs/compute-average';

/**
 * @class Line
 */
export default class Line extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                startRange: 0,
                endRange: 1,
            },
            settings: {
                lineType: 'line',
                lineWidth: 3,
                lineDash: [0, 0],
                enablePoint: true,
                pointType: 'full',
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
     * 初始化前
     * 增加平均值计算
     */
    beforeInit() {
        this._averageInstruct = new ComputeAverage();
        this.$dataSetController.registerTranform(this._averageInstruct);
        // 注册点
        this._registerPointShape(this._averageInstruct);
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        const { chart } = this;
        // 柱状
        this.geom = chart.line();
        // 点
        this.pointGeom = chart.point();
        this.pointGeom.shape(this._pointShapeName);

        this.geoms = [this.geom, this.pointGeom];
    }

    _initGeomStyle() {
        this.initLine(); // 线
        this.initPoinst(); // 点
    }

    // 初始化line
    initLine() {
        const { lineWidth, lineType, lineDash } = this.model.settings;
        // 可能要关闭
        if (!lineWidth || lineWidth <= 0) {
            return this.geom.hide();
        }
        this.geom
            .size(lineWidth)
            .shape(lineType)
            .style({
                lineDash: lineDash,
            })
            .show();
    }

    // 初始化points
    initPoinst() {
        const { enablePoint, pointOpaticy, pointRadius, pointShapeType } = this.model.settings;
        if (enablePoint === false) {
            this.pointGeom.hide();
            return;
        }

        this.pointGeom
            .opacity(pointOpaticy)
            .style({
                ...pickPropsWith(this.model.settings, {
                    pointBorderColor: 'stroke',
                    pointBorderWidth: 'lineWidth',
                    pointFillColor: 'fill',
                }),
            })
            .size(pointRadius)
            .shape(pointShapeType)
            .show();
    }

    // 注册点图形
    _registerPointShape() {
        const shapeType = 'point';
        if (this._pointShapeName) {
            unregisterShape(shapeType, this._pointShapeName);
        }
        const _self = this;
        // 注册图形
        this._pointShapeName = registerRandomShape(shapeType, {
            draw(cfg, container) {
                const point = this.parsePoint(cfg.points[0]);
                const { __isMax, __isMin } = cfg.origin._origin;
                const { pointType } = _self.model.settings;
                function addShape() {
                    container.addShape('circle', {
                        attrs: {
                            x: point.x,
                            y: point.y,
                            r: cfg.size,
                            ...cfg.style,
                            fill: cfg.color,
                            fillOpacity: cfg.opacity,
                        },
                    });
                }
                // 只显示最大最小
                if (pointType === 'minMax' && (__isMin || __isMax)) {
                    addShape();
                } else if (pointType === 'full') {
                    addShape();
                }
            },
        });
    }

    // 销毁注册图形
    beforeDestroy() {
        unregisterShape('point', this._pointShapeName);
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
