import { BBox, getFont } from '../../helpers/axis';
import { changeChartScale, getScalesByField } from '../../helpers/g2-helper';
// 暂时处理字体配置
import { FONT_FAMILY } from '../../render/gd-theme';
import { isNil, cloneDeep, isNumber, pick, merge } from '@antv/g2/lib/util';
import { combine } from '../../helpers/index';

import TitleAdapter from './assemblys/title';
import LabelAdapter from './assemblys/label';
import LineAdapter from './assemblys/line';
import GridAdapter from './assemblys/grid';
import TickLineAdapter from './assemblys/tick-line';
import SubTickLineAdapter from './assemblys/sub-tick-line';
// all adapter comonents
const allComponentAdapter = [
    TitleAdapter,
    LabelAdapter,
    LineAdapter,
    TickLineAdapter,
    SubTickLineAdapter,
    GridAdapter,
];

export const isDefaultPostion = (position) =>
    position ? ['bottom', 'left'].includes(position) : true;

export default class AxisController {
    /**
     * 开关
     */
    get enable() {
        return this.config && this.config.enable;
    }

    /**
     * 获取默认值
     */
    getDefaultCfg() {
        return {
            enable: false,

            /**
             * 可设置的值包含 top、bottom、left、right，即上下左右四个位置
             * 相对于笛卡尔坐标系才有的配置。
             * X轴只有上下，左右
             */
            position: 'bottom',

            // scale -------------------
            /**
             * 最大值和最小值，只有liner类型的度量才会有的方案
             * 最大值和最小值控制着度量的长度，控制相同的最大值最小值可以实现对多个图表对比。
             * 比如，在mini图的时候，统一度量是非常重要的事情。
             */
            // max: null, // 最大值
            // min: null, // 最小值

            /**
             * 渲染区域是每一个度量都有的方式
             * 直接决定从哪里开始渲染。
             */
            // startRange: null, // 从哪里开始
            // endRange: null // 从哪里结束
        };
    }

    /**
     * @constructor
     * @param {G2Chart} chart
     * @param {string} field
     * @param {Object} axisConfig // 坐标配置
     */
    constructor(chart, field, axisConfig) {
        this.chart = chart;
        this.field = field;
        this.dimType = axisConfig.dimType;
        this.config = null;
        this.g2Config = null;

        // 初始化配置
        this._initCfg(axisConfig);
        // 监听数据变化
        this._initListenDataChange();
        // 配置坐标轴
        this._deployAxis();
    }

    /**
     * 初始化config
     * @override
     * @param {Object} cfg
     */
    _initCfg(cfg) {
        // 1. 初始化默认值
        this._initDefault(cfg);
        // 2. 创建子设配器对象
        this._createAdators();
        // 3. 生成scale配置
        this._setScaleConfig();
        // 4. 生成G2配置
        this.assembleConfigToG2();
    }

    /**
     * 初始化数据变化
     */
    _initListenDataChange() {
        /**
         * @hack
         * 数据变化，会导致坐标轴的scale变化，从而导致label变化
         * label变化要考虑坐标轴名称自适应问题，否则可能导致遮挡
         */
        this.chart.on('afterchangedata', () => {
            if (!this.enable || !this.$title.enable || !this.$label.enable) return;
            // TODO: 暂时处理，
            this.assembleConfigToG2();
            this._deployAxis();
        });
    }

    /**
     * 初始化默认值
     * @param {Obejct} cfg
     */
    _initDefault(cfg) {
        this.config = combine(cfg || {}, this.config || {}, this.getDefaultCfg());
        return this.config;
    }

    /**
     * 创建子设配对象
     * @param {Object} cfg
     */
    _createAdators() {
        const cfg = this.config;
        this.componentAdapters = allComponentAdapter.map((Ctor) => {
            const adapterName = Ctor.adapterName;
            const adapterComponent = new Ctor(cfg[adapterName]);
            adapterComponent.on('update', () => {
                // 重新生成配置
                this._setScaleConfig();
                this.assembleConfigToG2();
                this._deployAxis();
            });

            adapterComponent.name = adapterName;
            this[`$${adapterName}`] = adapterComponent;
            return adapterComponent;
        });
    }

    /**
     * 组合G2的参数
     */
    assembleConfigToG2() {
        this.g2Config = this.enable ? this.buildG2Config(this.config) : null;
    }

    /**
     * 改变config
     * @override
     * @param {Object} cfg
     */
    changeConfig(cfg) {
        cfg = this.config = merge(this.config, cfg);

        // 所有设配器都要改变
        this.componentAdapters.forEach((componentAdapter) => {
            componentAdapter.changeConfig(cfg[componentAdapter.name]);
        });
        // 组装scale
        this._setScaleConfig();
        // 组装
        this.assembleConfigToG2();
    }

    /**
     *
     * 根据配置config生成 G2 config 配置对象
     * @override
     * @param {Object} config
     */
    buildG2Config(cfg) {
        // todo 重新计算offset
        const { $title, $label, $tickLine, $subTickLine, $grid, $line } = this;

        /**
         * @hack
         * 修复坐标轴的title offset
         * G2 是针对坐标轴轴线的offset
         * 修改为针对label文字的距离
         */
        const title = cloneDeep($title.getG2Config());
        if (
            $label.enable &&
            $title.enable &&
            $title.config.relative === 'label' &&
            (($label.config.offset > 0 && title.offset > 0) ||
                ($label.config.offset < 0 && title.offset < 0))
        ) {
            title.offset += this._autoComputedTitleOffsetByLabel($label.config);
        }

        /**
         * @hack
         * 反转坐标轴
         * 条形图的坐标轴反转了
         */

        const position = this._reverseByDim(cfg.position);
        return {
            // 设置坐标轴的显示位置，可设置的值包含 top、bottom、left、right，即上下左右四个位置。
            position: position,
            // 标题
            title: title,
            // 坐标轴文本的样式
            label: $label.getG2Config(),
            // 坐标轴线
            line: $line.getG2Config(),
            // 坐标轴刻度线
            tickLine: $tickLine.getG2Config(),
            // subTickCount: number, 设置每两个刻度之间次刻度线的个数，默认为 0，即不展示次刻度线。
            subTickCount: $subTickLine.enable ? $subTickLine.config.count : 0,
            // 子刻度线的样式
            subTickLine: $subTickLine.getG2Config(),
            // 网格线
            grid: $grid.getG2Config(),
        };
    }

    /**
     * 反转坐标轴参数
     * @param {String} position
     */
    _reverseByDim(position) {
        const dimType = this.dimType;
        // right => top
        if (dimType === 'x' && position === 'right') {
            return 'top';
        }
        // top => right
        if (dimType === 'y' && position === 'top') {
            return 'right';
        }
        return position;
    }

    /**
     * 配置坐标轴
     */
    _deployAxis() {
        const { field, chart } = this;
        if (!field) return;
        // 设置坐标轴的配置信息
        chart.axis(field, this.enable ? this.getG2Config() : false);
    }

    /**
     * 配置scale的最大最小值
     */
    _setScaleConfig() {
        const { config, field } = this;
        const axisScaleConfig = this.chart.get('options').scales[field] || {};

        // 最大值最小值
        const { min, max } = pick(config, ['min', 'max']);
        if (!isNil(min) && !isNil(max) && max <= min && process.env.NODE_ENV === 'development') {
            console.error(new Error('坐标值的最大值必须大于最小值'));
        }
        if (isNumber(min) && isNil(axisScaleConfig.min)) {
            axisScaleConfig.min = min;
        }
        if (isNumber(max) && isNil(axisScaleConfig.max)) {
            axisScaleConfig.max = max;
        }
        // 刻度线个数
        const tickCount = this.$tickLine.config.count;
        if (tickCount > 0) {
            axisScaleConfig.tickCount = tickCount;
        }

        // 针对cat类型要做一个调整
        let { startRange, endRange } = config;
        if (isNil(startRange) && !isNil(endRange)) {
            startRange = 0;
        }
        if (!isNil(startRange) && isNil(endRange)) {
            endRange = 1;
        }

        const isDefault = startRange === 0 && endRange === 1;
        if (!isNil(startRange) && !isNil(endRange) && endRange > startRange && !isDefault) {
            axisScaleConfig.range = [startRange, endRange];
        }
        changeChartScale(this.chart, field, axisScaleConfig);
    }

    /**
     * 获取当前的scales
     */
    _getAxisScale() {
        return getScalesByField(this.chart, this.field);
    }

    /**
     * 改变坐标轴的field
     * @param {string}} field
     */
    changeField(field) {
        if (!field || this.field === field) return;

        // 重新配置
        this.field = field;
        this._deployAxis();
        this._setScaleConfig();
    }

    /**
     * 改变坐标轴的配置
     */
    changeAxis(cfg) {
        // 重新初始化
        this.changeConfig(cfg);
        // 重新配置
        this._deployAxis();
    }

    /**
     * 获取G2Config
     */
    getG2Config() {
        return this.g2Config;
    }

    /**
     * 自动计算offset
     */
    _autoComputedTitleOffsetByLabel({ enable, fontSize, offset }) {
        if (!enable) {
            return 0;
        }
        return fontSize / 2 + offset * fontSize;
    }

    /**
     * 获取最大值
     */
    _getMaxValue() {
        const scale = this._getAxisScale();
        const ticks = (scale && scale.ticks) || [100];
        // TODO: 是否有format
        if (ticks.length === 0) return 100;
        const maxLenghtTick = ticks.reduce((a, b) => (String(a).length > String(b).length ? a : b));
        return maxLenghtTick;
    }

    /**
     * 计算宽度
     */
    measureMaxLabel() {
        const maxValue = this._getMaxValue();
        const font = getFont({
            ...this.config.label,
            fontFamily: FONT_FAMILY,
        });
        // get max value
        return BBox(font, maxValue);
    }
}
