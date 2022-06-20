import baseChart from '../../base/base-chart';
import XAxis from '../../controller/axis/x-axis';
import YAxis from '../../controller/axis/y-axis';
import LabelController from '../../controller/label/index';
import createBarRectShape from '../../render/shape/bar-rect-shape';
import { isDefaultPostion } from '../../controller/axis/axis';
import { merge, cloneDeep } from '@antv/g2/lib/util';
import { registerRandomShape, unregisterShape } from '../../helpers/g2-helper';
import TwoMirror from './two-mirror';
import { parseColorsToArray } from '../../helpers/colors';

/**
 * 蝴蝶图
 * @class ButterflyBar
 */
export default class ButterflyBar extends baseChart {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                coordMargin: 80,
            },
        });
    }

    beforeInit() {
        this._intervalShapeName = this._registerShape(); // 注册图形
    }

    _initChart(model) {
        const chart = super._initChart(model);
        this._initFacet(chart);
        return chart;
    }

    /**
     * 需要设置每一个列定义
     * sync为true, 会同步到所有子view
     */
    _initScalse() {
        Object.values(this.model.scales).forEach(
            (scale) => (scale.sync = scale.sync === undefined ? true : scale.sync),
        );
        super._initScalse();
    }

    _initFacet(chart) {
        chart = chart || this.chart;
        const { colorDimension } = this.metrics;
        if (this.facets) {
            this.facets.destroy();
        }
        this.facets = new TwoMirror({
            chart: chart,
            fields: [colorDimension],
            autoSetAxis: true,
            showTitle: false,
            transpose: true,

            /**
             *  自定义支持属性
             */
            margin: this.model.settings.coordMargin,
            metrics: this.metrics,
            beforeEachView: () => {
                this.$xAxisControllers = [];
                this.$labelControllers = [];
                this.geoms = [];
            },
            eachView: (view, facet) => {
                const isLeftMain = facet.colIndex === 0;
                // 坐标系
                this.__initViewAxes(view, isLeftMain);
                // 图形
                this.__initViewGeom(view, isLeftMain);
            },
            afterEachView: () => {
                this._initColors();
            },
        });
    }

    __autoSetY2Axis(yAxis, y2Axis = {}) {
        if (yAxis && yAxis.enable && isDefaultPostion(yAxis.position)) {
            const facets = this.facets;
            let coordMargin = this.model.settings.coordMargin;
            if (facets) {
                coordMargin = facets.getMargin(null, yAxis.label);
                facets.facets && facets.changeMargin(coordMargin);
            }
            // yAxis
            yAxis.label.offset = coordMargin / 2 / yAxis.label.fontSize;
            yAxis.label.autoLayout = false;
            yAxis.label.textAlign = 'center';

            // y2Axis
            y2Axis.label.enable = false;
        } else {
            const facets = this.facets;
            facets.facets && facets._changeMargin(this.model.settings.coordMargin);
        }
        return [yAxis, y2Axis];
    }

    __initViewAxes(view, isLeftMain = true) {
        const { xField, yField } = this.metrics;
        let { xAxis, yAxis, y2Axis } = this.model;
        // 坐标系
        xAxis.dimType = 'y';
        yAxis.dimType = 'x';
        this.$xAxisControllers.push(new XAxis(view, yField, xAxis));

        y2Axis = y2Axis || cloneDeep(yAxis) || {};
        const [_yAxis, _y2Axis] = this.__autoSetY2Axis(yAxis, y2Axis);
        if (isLeftMain) {
            this.$yAxisController = new YAxis(view, xField, _yAxis || {});
        } else {
            this.$y2AxisController = new YAxis(view, xField, _y2Axis);
        }
    }

    __initViewGeom(view, isLeftMain) {
        const { metrics, model } = this;
        const { xField, yField, colorDimension } = metrics;
        const { colors, colorType } = model;
        const [leftColor, rightColor] = parseColorsToArray(colors, colorType);
        const color = isLeftMain ? leftColor : rightColor;
        const viewMain = isLeftMain ? 'mainGeom' : 'nextGeom';

        const geom = view
            .interval()
            .position(`${xField}*${yField}`)
            .color(colorDimension, [color])
            .shape(this._intervalShapeName);
        // style
        this.__initGeomStyle(geom);
        // lable
        this.__initGeomLabel(geom);
        // push
        this[viewMain] = geom;
        this.geoms.push(geom);
    }

    __initGeomLabel(geom) {
        const { metrics, model } = this;
        const { yField, labelDimension } = metrics;
        const _labelDimension = labelDimension || yField;
        const $labelController = new LabelController(model.label, _labelDimension, geom);
        this.$labelControllers.push($labelController);
    }

    _initAxes() {}
    _initLabel() {}
    _initGeom() {}
    _initGeomMetrices() {}
    _initColors() {
        const { colors, colorType } = this.model;
        const colorArray = parseColorsToArray(colors, colorType);
        const { colorDimension } = this.metrics;
        this.mainGeom && this.mainGeom.color(colorDimension, colorArray);
        this.nextGeom && this.nextGeom.color(colorDimension, colorArray);
    }

    /**
     * @override
     */
    __initGeomStyle(geom) {
        const geoms = geom ? [geom] : this.geoms;
        const {
            itemborderWidth,
            itemborderColor,
            itemTopRadiusRatio,
            itemBottomRadiusRatio,
            opacity,
        } = this.model.settings;
        const itemTopRadiusRatioPrecent = itemTopRadiusRatio + '%';
        const itemBottomRadiusRatioPrecent = itemBottomRadiusRatio + '%';
        geoms.forEach((geom) => {
            geom.style({
                lineWidth: itemborderWidth,
                stroke: itemborderColor,
                radius: [
                    itemTopRadiusRatioPrecent,
                    itemTopRadiusRatioPrecent,
                    itemBottomRadiusRatioPrecent,
                    itemBottomRadiusRatioPrecent,
                ],
            }).opacity(opacity);
        });
    }

    __initFaceMargin() {
        const coordMargin = this.model.settings.coordMargin;
        this.facets.changeMargin(coordMargin);
    }

    changeLabel(cfg) {
        this.$labelControllers.forEach(($) => {
            $.changeLabel(cfg);
        });
        this._callChartNativeFunc('repaint');
    }

    changexAxis(cfg) {
        if (this.$xAxisControllers) {
            this.$xAxisControllers.forEach((xAxisController) => {
                xAxisController.changeAxis(cfg);
            });
        }
        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    changeyAxis(cfg) {
        const y2Axis = this.model.y2Axis || cloneDeep(cfg);
        // this.model.
        const [_yAxis, _y2Axis] = this.__autoSetY2Axis(cfg, y2Axis);
        this.$yAxisController.changeAxis(_yAxis);
        this.$y2AxisController.changeAxis(_y2Axis);

        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    changey2Axis(cfg) {
        const [_yAxis, _y2Axis] = this.__autoSetY2Axis(this.model.yAxis, cfg);
        this.$yAxisController.changeAxis(_yAxis);
        this.$y2AxisController.changeAxis(_y2Axis);

        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    changeColors(colors) {
        this.model.colors = colors;
        this._initColors();
        this._callChartNativeFunc('repaint');
    }

    changeSettings(cfg) {
        super.changeSettings(cfg);
        this.__initGeomStyle();
        this.__initFaceMargin();
        this._callChartNativeFunc('repaint');
    }

    _registerShape() {
        const factoryName = 'interval';
        if (this._intervalShapeName) {
            unregisterShape(factoryName, this._intervalRadiusShape);
        }
        const shapeConfig = this._createShape();
        if (shapeConfig) {
            return registerRandomShape(factoryName, shapeConfig);
        }
    }

    /**
     * 创建图形对象
     */
    _createShape() {
        return createBarRectShape(this);
    }

    /**
     * 销毁注册
     */
    beforeDestroy() {
        unregisterShape('interval', this._intervalShapeName);
    }
}
