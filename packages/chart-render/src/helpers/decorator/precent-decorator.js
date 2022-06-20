/**
 * 抽离图形数据展示为百分比功能
 * 采用对类加装饰器的方式注入
 *
 *
 * 1. 需要对数据注入百分比转换指令
 * 2. 需要改变维度，metrics.yField = 'precent'
 * 3. 对所有用到yField的进行切换
 * 3.1. 需要改变当前图形的geom, position
 * 3.2. 需要改变使用yField坐标轴的控制器, 改变format
 * 3.3. 需要改变label的配置（目前默认是采用yField）,改变format
 *
 */
import ComputePrecent from '../../controller/data/instructs/compute-precent';
// import { changeChartScale } from '../g2-helper';
import { merge, isFunction } from '@antv/g2/lib/util';

/**
 * 可辅助使用装饰器方法，避免方法来源混乱
 * 导出核心方法名
 */
export const TransformPrecent = 'transformPrecent';

/**
 * 百分比数据的属性名
 */
export const PRECENT = 'precent';

/**
 * 初始化转换指令
 * 在数据的转换过程中加入数据的转换指令，计算出y轴的百分比占比，key 值为 precent
 * 通过将y轴的Field设置为precent
 */
function initPrecentCompute(enable) {
    const { xField, yField, precentGroupKey, colorDimension } = this.metrics;
    this.__precentField = PRECENT; // 百分比field
    this.__yFieldCopy = yField;

    let groupByKey = precentGroupKey;
    if (!groupByKey && xField !== colorDimension) {
        groupByKey = xField;
    }

    this._computePrecent = new ComputePrecent(PRECENT, {
        groupByKey,
        computeKey: yField,
        open: enable,
    });

    // 注入百分比转换器
    this.$dataSetController.registerTranform(this._computePrecent);
}

/**
 * 需要注入的方法对象
 */
const precentDecoratorMethods = {
    /**
     * 主方法
     * 控制是否转换为百分比方式
     * @param {boolean} isTransformPercent
     */
    [TransformPrecent](isTransformPercent = false) {
        this._setPrecentKey(isTransformPercent);
        this._setLabelFormatter(isTransformPercent);
    },

    /**
     * 设置百分比坐标轴维度
     * @private
     * @param {Boolean} isTransformPercent
     */
    _setPrecentKey(isTransformPercent) {
        const { metrics, __yFieldCopy, __precentField } = this;

        // 非空判断
        if (!__yFieldCopy && !__precentField) return;

        const transformField = isTransformPercent ? __precentField : __yFieldCopy;
        if (transformField === metrics.yField) return;

        /**
         * set yField
         * 1. y坐标轴字段要进行改变
         */
        const beforeField = metrics.yField;
        metrics.yField = transformField;

        // 2. 改变坐标轴控制器
        const axisController = this.__getAxisControllerByField(beforeField);
        axisController && axisController.changeField(transformField);

        // 3. 改变坐标轴label
        this._setYAxisLabelFormatter(axisController, isTransformPercent);

        // 4. 重新初始化维度设置
        this._initGeomMetrices();
    },

    _setYAxisLabelFormatter(axisController, isTransformPercent) {
        let { __axisLabeFormatter } = this;
        const labelAdapter = axisController.$label;
        if (!__axisLabeFormatter) {
            __axisLabeFormatter = this.__axisLabeFormatter =
                labelAdapter.config.formatter || ((i) => i);
        }

        let formatter = (i) => i;
        if (isTransformPercent) {
            formatter = (v) => v + '%';
        } else if (isFunction(__axisLabeFormatter)) {
            // reset before
            formatter = __axisLabeFormatter;
        }

        labelAdapter.changeConfig(
            {
                formatter,
            },
            true,
        );
    },

    __getAxisControllerByField(field) {
        return [this.$xAxisController, this.$yAxisController].find((i) => i.field === field);
    },

    /**
     * 对label
     * @param {boolean} isTransformPercent
     */
    // 设置labelFormatter, label要变成百分比值
    _setLabelFormatter(isTransformPercent) {
        let { __labeFormatter, $labelController } = this;
        if (!$labelController) return;

        // save before
        if (!__labeFormatter) {
            __labeFormatter = this.__labeFormatter =
                $labelController.config.formatter || ((i) => i);
        }

        // 是否转换百分比
        let formatter = (i) => i;
        if (isTransformPercent) {
            formatter = (v) => v + '%';
        } else if (isFunction(__labeFormatter)) {
            // reset before
            formatter = __labeFormatter;
        }
        $labelController.changeLabel({ formatter });
        $labelController.changeField(this.metrics.yField);
    },
};

export default function PrecentDecorator(enable = false) {
    return function (target) {
        const _beforeInit = target.prototype.beforeInit;
        const _initLabel = target.prototype._initLabel;
        const _initAxes = target.prototype._initAxes;
        const changeSettings = target.prototype.changeSettings;
        const _initGeomStyle = target.prototype._initGeomStyle;
        // const _initScalse = target.prototype._initScalse;
        /**
         * @override
         */
        target.prototype.beforeInit = function () {
            _beforeInit.call(this);

            const isOpen = this.model.settings.isTransformPercent || enable;
            initPrecentCompute.call(this, isOpen);
            if (isOpen) {
                this.metrics.yField = PRECENT;
            }
            this.model.scales[PRECENT] = {
                type: 'linear',
                max: 100,
                // nice: false
            };
        };

        /**
         * @override
         */
        target.prototype._initLabel = function () {
            // 设置format
            _initLabel.call(this);
            if (this.model.settings.isTransformPercent || enable) {
                this._setLabelFormatter(true);
            }
        };

        target.prototype._initAxes = function () {
            // 设置format
            _initAxes.call(this);
            if (this.model.settings.isTransformPercent || enable) {
                const $yAxisController = this.__getAxisControllerByField(this.metrics.yField);
                this._setYAxisLabelFormatter($yAxisController, true);
            }
        };

        target.prototype.changeSettings = function (settings) {
            const isTransformPercent = settings.isTransformPercent;
            if (
                this._computePrecent &&
                this._computePrecent.open !== isTransformPercent &&
                isTransformPercent
            ) {
                this._computePrecent.open = isTransformPercent;
                this._initData();
            }

            changeSettings.call(this, settings);
        };

        target.prototype._initGeomStyle = function () {
            _initGeomStyle.call(this);
            // 转换为百分比
            this[TransformPrecent](this.model.settings.isTransformPercent);
        };

        // target.prototype._initScalse = function() {
        //     changeChartScale(this.chart, PRECENT, {
        //         max: 100,
        //     });
        //     _initScalse.call(this);
        // };

        // mixin
        merge(target.prototype, precentDecoratorMethods);
    };
}
