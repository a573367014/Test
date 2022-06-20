import BaseChart from '../../base/base-chart';
import { pickPropsWith, formatPolarParams } from '../../helpers/index';
import { pick } from '@antv/g2/lib/util';

/**
 * 雷达图
 * @class Radar
 */
export default class Radar extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                title: {
                    enable: false,
                },
                label: {
                    enable: true,
                    offset: 0.55,
                    autoLayout: true,
                },
                grid: {
                    enable: true,
                    type: 'line',
                    hideFirstLine: false,
                    hideLastLine: true,
                    lineDash: [0, 0],
                },
                line: {
                    enable: false,
                },
                tickLine: {
                    enable: false,
                },
                subTickLine: {
                    enable: false,
                },
            },
            yAxis: {
                min: 0,
                title: {
                    enable: false,
                },
                label: {
                    enable: false,
                },
                line: {
                    enable: false,
                },
                tickLine: {
                    enable: false,
                },
                subTickLine: {
                    enable: false,
                },
                grid: {
                    enable: true,
                    type: 'polygon',
                    hideFirstLine: false,
                    hideLastLine: false,
                    lineDash: [0, 0],
                    alternateColor: ['#efeeee1c', '#dddddd82'],
                },
                startRange: 0, // 从哪里开始
                endRange: 1, // 从哪里结束
            },
            settings: {
                startAngle: 270,
                shapeType: 'area',
                lineWidth: 3,
                enableArea: false,
                areaOpacity: 0.7,
                enablePoint: true,
                pointShapeType: 'circle',
                pointRadius: 6,
                pointOpaticy: 1,
                pointBorderWidth: 0,
                pointBorderColor: '#ccccccff',
                pointFillColor: '#ccccccff',
            },
            label: {
                offset: -0.92,
            },
        };
    }

    /**
     * 初始化坐标系
     * 雷达图属于极坐标系
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
        chart.coord('polar', {
            transposed: true,
            ...formatPolarParams(polarParams),
        });
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        const { chart } = this;

        // 1. 初始化三个类型
        this.lineGeom = chart.line(); // 线
        this.pointGeom = chart.point(); // 点
        this.areaGeom = chart.area(); // 面

        // 2. 三个类型
        this.geoms = [this.lineGeom, this.pointGeom, this.areaGeom];
        this.geom = this.lineGeom;
    }

    /**
     * 初始化图形style
     */
    _initGeomStyle() {
        this.initLine();
        this.initArea();
        this.initPoint();
    }

    // 初始化line
    initLine() {
        let { lineWidth, shapeType, lineDash } = this.model.settings;
        if (!lineWidth || lineWidth <= 0) {
            lineWidth = 0;
        }
        // set lineWidth and shapeType
        this.lineGeom
            .size(lineWidth)
            .shape(shapeType)
            .style({
                lineDash,
            })
            .show();
    }

    // 初始化面积
    initArea() {
        const { shapeType, enableArea, areaOpacity } = this.model.settings;
        // hide
        if (enableArea === false) {
            this.areaGeom.hide();
            return;
        }
        // set shape and opacity
        this.areaGeom.shape(shapeType).opacity(areaOpacity).show();
    }

    // 初始化辅助点
    initPoint() {
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
}
