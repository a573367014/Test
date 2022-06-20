import { merge, cloneDeep } from '@antv/g2/lib/util';
import createChart from '../render/create-chart';
import BaseChartActions from './base-actions';
import ResolveData from '../controller/data/resolve-data';
import LegendController from '../controller/legend/legend';
import XAxisController from '../controller/axis/x-axis';
import YAxisController from '../controller/axis/y-axis';
import TileController from '../controller/title/title';
import LabelController from '../controller/label/index';
import { getDefaultBySchema } from '../helpers/schema';
import { getScalesByField } from '../helpers/g2-helper';
import { parseColorsWithType } from '../helpers/colors';

// id
let ID_INDEX = 0;
/**
 * 图表基础类
 * @class BaseChart
 */
export default class BaseChart extends BaseChartActions {
    // 全局默认值
    getDefaultModel() {
        return {
            renderer: 'canvas',
            padding: [10, 10, 10, 10],
        };
    }

    /**
     * @param {Element} container 容器
     * @param {ChartModel} model 数据配置
     */
    constructor(container, model) {
        super();

        // props
        this.container = container; // 容器
        this.model = this.initModel(model); // 配置model
        this.chart = null; // g2 Chart 实例
        this.geom = null; // geom实例
        this._id = 'chart_' + ID_INDEX++; // id
        this.metrics = null;

        // 控制器
        this.$dataSetController = null;
        this.$legendController = null;
        this.$xAxisController = null;
        this.$yAxisController = null;

        // 开始渲染
        this.start();
    }

    start() {
        // 优先处理数据
        this.initMetrice();
        this.initDataRow();

        // init ----
        this.beforeInit();
        this.init(this.model);
        this.afterInit();
    }

    /**
     * 对model进行初始化
     * @param {Object} model
     */
    initModel(model) {
        model = merge(this.getDefaultModel(), model);
        if (!model.colors || model.colors.length === 0) {
            model.colors = [];
        }
        this.initSettings(model);
        return model;
    }

    /**
     * 对model settings进行初始化
     */
    initSettings(model) {
        const settingsSchemas = this.constructor.settingsSchemas;
        if (settingsSchemas) {
            model.settings = merge(getDefaultBySchema(settingsSchemas), model.settings);
        }
    }

    /**
     * 初始化纬度映射关系
     */
    initMetrice() {
        const SUPPORTSCALESTYPE = ['linear', 'cat'];
        const metrics = cloneDeep(this.model.metrics);
        const scales = cloneDeep(this.model.scales) || {};
        this.metrics = {};
        Object.keys(metrics).forEach((key) => {
            const metricsItem = metrics[key];
            if (typeof metricsItem === 'string') {
                this.metrics[key] = metricsItem;
                scales[metricsItem] = merge(scales[metricsItem] || {}, {});
            } else if (Array.isArray(metricsItem)) {
                this.metrics[key] = metricsItem;
            } else if (typeof metricsItem === 'object') {
                const scalesName = metricsItem.name;
                this.metrics[key] = scalesName;
                if (!SUPPORTSCALESTYPE.includes(metricsItem.type)) {
                    metricsItem.type = null;
                }
                metricsItem.key = key;
                scales[scalesName] = merge(scales[scalesName] || {}, metricsItem);
            }
        });

        /**
         * @hack
         * 补全历史数据xField缺失
         */
        if (this.metrics.colorDimension && !this.metrics.xField) {
            this.metrics.xField = this.metrics.colorDimension;
        }

        this.model.scales = scales;
    }

    /**
     * 初始化数据
     */
    initDataRow() {
        this.$dataSetController = new ResolveData(
            this.model.chartData,
            this.metrics,
            this.model.scales,
        );
    }

    // 初始化图形
    init(model) {
        // 创建一个基础chart
        this.chart = this._initChart(model);
        this._initScalse(); // 度量
        this._initData(); // 初始化数据

        // 初始化
        this._initTitle(); // 标题
        this._initLegends(); // 图例
        this._initAxes(); // 坐标系
        this._initCoord(); // 坐标系
        this._initGeom(); // 图形
        this._initGeomMetrices();
        this._initGeomStyle();
        this._initGuide(); // 辅助线
        this._initLabel(); // label
        this._initOpacity(); // 透明度
    }

    /**
     * render
     */
    render() {
        this.chart.render();
    }

    // 销毁方法
    destroy() {
        this.beforeDestroy();
        this._callChartNativeFunc('destroy');
        // 数据控制器
        this.$dataSetController = null;
        this.$legendController.destroy(); // 图例
        this.$legendController = null;
        this.$xAxisController = null; // x坐标轴
        this.$yAxisController = null; // y坐标轴
        this.chart = null;
        this.geom = null;
    }

    /**
     * 初始化chart，包括title
     */
    _initChart(model) {
        const renderer = 'canvas';
        // 创建chart
        // 暂时不支持SVG
        // let renderer = 'svg';
        // if(
        //     (model.xAxis === null || (model.xAxis && model.xAxis.enable === false)) &&
        //     (model.yAxis === null || (model.xAxis && model.yAxis.enable === false))
        // ) {
        //     renderer = 'canvas';
        // }
        if (!model.render) {
            model.renderer = renderer;
        }

        return createChart({
            container: this.container,
            width: model.width,
            height: model.height,
            title: model.title,
            renderer: model.renderer,
            padding: [10, 10, 10, 10], // model.padding
        });
    }

    // hooks ------------------
    beforeInit() {} // 初始化之前
    afterInit() {} // 初始化之后
    beforeDestroy() {} // 销毁之前

    // ————————————————————
    // 初始化过程
    // ————————————————————

    // 初始化数据控制器
    _initData() {
        const { chart, $dataSetController } = this;
        // 计算数据
        const data = $dataSetController.source();

        if (data.length > 0) {
            chart.source(data);
        }
    }

    // 初始化坐标系
    _initCoord() {}
    // 初始化辅助线
    _initGuide() {}
    // 初始化图形
    _initGeom() {}
    // 初始化图形的维度相关
    _initGeomMetrices() {
        const { metrics, geom, geoms } = this;
        const { xField, yField } = metrics;
        if (geom && !geoms) {
            this.geoms = [geom];
        }
        this.geoms.forEach((geom) => {
            if (!geom || geom.destroyed) return;
            geom.position(`${xField}*${yField}`);

            // 配置动画
            // if(this.model.dynamicContext) {
            //     geom.animate({
            //         appear: {
            //             duration: this.model.dynamicContext.duration,
            //         }
            //     });
            // }
        });
        this._initeGeomColors();
    }

    _initeGeomColors() {
        const { model, geoms, metrics } = this;
        const { colorDimension, xField } = metrics;
        const colors = parseColorsWithType(model.colors, model.colorType);
        const _colorDimension = colorDimension || xField;
        geoms.forEach((geom) => {
            if (!geom || geom.destroyed) return;
            geom.color(_colorDimension, colors);
        });
    }

    // 初始化图形样式
    _initGeomStyle() {}
    // 初始化label
    _initLabel() {
        const { metrics, geom, model } = this;
        const labelDimension = metrics.labelDimension || metrics.yField;
        this.$labelController = new LabelController(model.label, labelDimension, geom);
    }

    // 初始化图形透明度
    _initOpacity() {
        const shapeOpacity = this.model.shapeOpacity || 0.94;
        const geoms = this._callChartNativeFunc('get', 'geoms') || [];
        this._opacityGeoms = [];
        geoms.forEach((geom) => {
            /**
             * @hack
             */
            const options = geom.get('attrOptions');
            const opacityAttr = options.opacity;
            if (!opacityAttr) {
                geom.opacity(shapeOpacity);
                this._opacityGeoms.push(geom);
            }
        });
    }

    // 初始化坐标轴
    _initAxes() {
        const { xAxis = {}, yAxis = {} } = this.model;
        this.$xAxisController = new XAxisController(this.chart, this.metrics.xField, xAxis || {});
        this.$yAxisController = new YAxisController(this.chart, this.metrics.yField, yAxis || {});
    }

    // 初始化title
    _initTitle() {
        const { title } = this.model;
        this.$titleController = new TileController(this.chart, title);
    }

    // 初始化图例
    _initLegends() {
        const legendField = this.metrics.colorDimension;
        const legendCfg = this.model.legend;

        // 同步透明度
        legendCfg.opacity = this.model.shapeOpacity;
        this.$legendController = new LegendController(this.chart, legendCfg, legendField);

        /**
         * 暂时只显示一个图例
         * 其他图例全隐藏
         */
        Object.values(this.metrics)
            .filter((f) => f !== legendField)
            .forEach((field) => this.chart.legend(field, false));
    }

    // 度量
    _initScalse() {
        const scales = this.model.scales;
        if (scales && Object.keys(scales).length > 0) {
            this.chart.scale(scales);
        }
        /**
         * 数据更新之后，度量可能会变化，所以要将重新生成度量对象
         */
        this.chart.on('afterchangedata', this.initChartScalseFirst.bind(this));
    }

    // 初始化第一次度量
    initChartScalseFirst() {
        const { chart, metrics } = this;
        const data = chart.get('data');
        /**
         * @hack
         * 先创建坐标轴相关的scale, 为了坐标轴标题offset计算
         */
        chart.set('scales', {}); // 先清空，再创建
        [metrics.xField, metrics.yField, metrics.y2Field].forEach((field) => {
            field && chart.createScale(field, data);
        });
    }

    getScalesByField(field) {
        return getScalesByField(this.chart, field);
    }

    /**
     * 兼容svg模式出图
     */
    getCanvas() {
        return new Promise((resolve) => {
            if (!this.chart) return resolve(null);

            const { width, height } = this.model;
            const chartFullCanvas = document.createElement('canvas');
            chartFullCanvas.width = width;
            chartFullCanvas.height = height;
            const chartCxt = chartFullCanvas.getContext('2d');

            const drawChartElement = new Image();
            drawChartElement.src = this.toDataURL();
            drawChartElement.onload = () => {
                const sw = drawChartElement.width;
                const sh = drawChartElement.height;
                // 绘制图表
                chartCxt.drawImage(
                    drawChartElement,
                    // 开始裁剪位置 + 宽高
                    0,
                    0,
                    sw,
                    sh,
                    // 绘制位置 + 宽高
                    0,
                    0,
                    width,
                    height,
                );
                // 返回
                resolve(chartFullCanvas);
            };
        });
    }

    /**
     * 高清屏幕是二倍图
     */
    toDataURL() {
        return this.chart.toDataURL();
    }
}
