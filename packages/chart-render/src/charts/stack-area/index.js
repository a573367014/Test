import BaseChart from '../../base/base-chart';
import { pickPropsWith } from '../../helpers/index';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * 堆叠面积图
 * @class StackArea
 */

/**
 * 百分比功能
 * 装饰器
 */
@PrecentDecorator(false)
export default class StackArea extends BaseChart {
    getDefaultModel() {
        return {
            xAxis: {
                startRange: 0,
                endRange: 1,
            },
            settings: {
                isTransformPercent: false,
                areaOpacity: 0.7,
                shapeType: 'smooth',
                enableLine: true,
                lineWidth: 3,
                lineOpacity: 0.8,
                enablePoint: false,
                pointShapeType: 'circle',
                pointRadius: 10,
                pointOpaticy: 1,
                pointBorderWidth: 0,
                pointBorderColor: '#ccccccff',
                pointFillColor: '#ccccccff',
            },
            label: {
                offset: -0.91,
            },
        };
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        const { chart } = this;

        // 1. 初始化三个类型
        this.areaGeom = chart.area().adjust({
            type: 'stack', // 调整分组
            reverseOrder: false, // 颠倒数据
        }); // 面
        this.lineGeom = chart.line().adjust({
            type: 'stack', // 调整分组
            reverseOrder: false, // 颠倒数据
        }); // 线
        this.pointGeom = chart.point().adjust({
            type: 'stack', // 调整分组
            reverseOrder: false, // 颠倒数据
        }); // 点

        // 2. 三个类型
        this.geoms = [this.areaGeom, this.lineGeom, this.pointGeom];
        this.geom = this.areaGeom;
    }

    /**
     * 初始化图形style
     */
    _initGeomStyle() {
        this.initArea();
        this.initLine();
        this.initPoint();
    }

    // 初始化line
    initLine() {
        const { lineWidth, shapeType, enableLine, lineOpacity, lineDash } = this.model.settings;
        if (!lineWidth || lineWidth <= 0 || enableLine === false) {
            this.lineGeom.hide();
            return;
        }
        // set lineWidth and shapeType
        this.lineGeom
            .size(lineWidth)
            .shape(shapeType)
            .opacity(lineOpacity)
            .style({
                lineDash,
            })
            .show();
    }

    // 初始化面积
    initArea() {
        const { shapeType, areaOpacity } = this.model.settings;
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
        this.chart.repaint();
    }
}
