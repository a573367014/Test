import { merge, cloneDeep } from '@antv/g2/lib/util';
import { parseColorsWithType } from '../helpers/colors';
import { changeChartScale } from '../helpers/g2-helper';
import EventEmitter from 'wolfy87-eventemitter';
/**
 * @class BaseChartActions
 */
export default class BaseChartActions extends EventEmitter {
    constructor() {
        super();
        this._destoryed = false;
    }

    /**
     * 改变颜色类型
     * @param {CO} colorType
     */
    changeColorType(colorType) {
        this.model.colorType = colorType;
        this.changeColors(this.model.colors);
    }

    /**
     * 改变颜色
     * @param {Array} colors
     */
    changeColors(colors) {
        this.model.colors = colors;
        colors = parseColorsWithType(colors, this.model.colorType);
        const geoms = this._callChartNativeFunc('getAllGeoms') || [];
        geoms.forEach((geom) => {
            const colorAttr = geom.getAttrsForLegend().find((attr) => attr.type === 'color');
            if (colorAttr) {
                geom.color(colorAttr.field, colors);
            }
        });
        // call repaint
        // 渐变渲染延迟，需要执行两次
        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    // 改变标题
    changeTitle(cfg) {
        this._callChartNativeFunc('changeTitle', cfg);
    }

    // 改变图例
    changeLegend(cfg) {
        this.$legendController && this.$legendController.changeLegend(cfg);
        this._callChartNativeFunc('repaint');
    }

    // 改变label
    changeLabel(cfg) {
        const { geom, $labelController } = this;
        if (!geom || !$labelController) {
            return;
        }
        // 改变配置
        $labelController.changeLabel(cfg);
        // call repaint
        this._callChartNativeFunc('repaint');
    }

    // 改变数据
    changeData(data, scales) {
        this.model.data = data;
        if (scales) {
            this.changeScales(scales);
        }
        if (this.$dataSetController) {
            this.$dataSetController.changData(data, scales);
            this._callChartNativeFunc('changeData', this.$dataSetController.source());
        }
    }

    // 改变度量
    changeScales(scales = {}) {
        this.model.scales = scales;
        this.$dataSetController.scales = scales;
        // 更新scales
        Object.keys(scales).forEach((key) => {
            changeChartScale(this.chart, key, scales[key]);
        });
        this._callChartNativeFunc('repaint');
    }

    // 维度变化
    changeMetrics(data, metrics) {
        this.destroy();
        this.model.chartData = cloneDeep(data);
        this.model.metrics = cloneDeep(metrics);

        // 重新渲染
        this.start();
        this.render();
    }

    // 改变宽高
    changeSize(w, h) {
        this.model.width = w;
        this.model.height = h;
        this._callChartNativeFunc('changeSize', w, h);
        this._callChartNativeFunc('repaint');
    }

    // 改变图形透明度
    changeShapeOpacity(opacity) {
        // 图形
        if (this._opacityGeoms) {
            this._opacityGeoms.forEach((i) => i.opacity(opacity));
        }
        // 图例
        this.$legendController.updateConfig('opacity', opacity);
        this._callChartNativeFunc('repaint');
    }

    // 改变x坐标轴
    changexAxis(cfg) {
        this.$xAxisController && this.$xAxisController.changeAxis(cfg);
        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    // 改变y坐标轴
    changeyAxis(cfg) {
        this.$yAxisController && this.$yAxisController.changeAxis(cfg);
        this._callChartNativeFunc('repaint', false);
        this._callChartNativeFunc('repaint');
    }

    /**
     * 新增改变右侧坐标的方法
     * @param {Object} cfg
     */
    changey2Axis(cfg) {
        if (this.$y2AxisController) {
            this.$y2AxisController.changeAxis(cfg);
            this._callChartNativeFunc('repaint', false);
            this._callChartNativeFunc('repaint');
        }
    }

    /**
     * 改变颜色
     * @param {string} fnName
     * @param  {...any} args
     */
    _callChartNativeFunc(fnName, ...args) {
        const chart = this.chart;
        if (chart && typeof chart[fnName] === 'function') {
            return chart[fnName](...args);
        }
        return false;
    }

    /**
     * 修改settings
     */
    changeSettings(cfg) {
        this.model.settings = merge(this.model.settings, cfg);
    }

    getColorScalesLenght() {
        const getAttrsForLegend = ($geom) => $geom && $geom.getAttrsForLegend();
        const findColorAttr = (attrs = []) => attrs.find((attr) => attr.type === 'color');
        const getScalesLength = (colorAttr) => {
            const scales = colorAttr
                ? colorAttr.scales.find((s) => s.field === colorAttr.field)
                : null;
            let i;
            return ((i = scales) && (i = i.values) && (i = i.length)) || 0;
        };

        // 获取所有的数据
        const geoms = this.chart.getAllGeoms();
        return geoms.map(getAttrsForLegend).map(findColorAttr).map(getScalesLength)[0];
    }
}
