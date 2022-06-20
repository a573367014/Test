import XAxis from '../../controller/axis/x-axis';
import YAxis from '../../controller/axis/y-axis';
import createBarRectShape from '../../render/shape/bar-rect-shape';
import { merge } from '@antv/g2/lib/util';
import BaseColumn from '../../base/base-column/base-column';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';
import DynamicDroup from '../../controller/data/instructs/dynamic-group';
import { parseColorsWithType } from '../../helpers/colors';
import { COLOR_TYPE_MAP, HOOKS } from '../../helpers/constants';

/**
 * 注册动画
 */
import Animate from '@antv/g2/lib/animate/animate';
import {
    labelAppearAdd,
    labelUpdateAdd,
    barUpdateWidthAndPosition,
} from '../../render/animate/index';

const LABEL_APPEAR = 'label-appear';
const LABEL_UPDATE = 'label-update';
const BAR_UPDATE = 'bar-update';

Animate.registerAnimation('appear', LABEL_APPEAR, labelAppearAdd);
Animate.registerAnimation('update', LABEL_UPDATE, labelUpdateAdd);
Animate.registerAnimation('update', BAR_UPDATE, barUpdateWidthAndPosition);

/**
 * 动态基础条形图
 * @class DynamicBar
 */
@DimensionRevise(TwoDimension)
@PrecentDecorator(false)
export default class DynamicBar extends BaseColumn {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                itemWidthRatio: 0.6,
                itemMaxWidth: 80,
            },
            label: {
                offset: -1.36,
            },
        });
    }

    /**
     * @override
     */
    beforeInit() {
        super.beforeInit();
        /**
         * 增加数据处理
         * 将数据处理为以动态字段为分组的数据格式
         */
        this._dynamicDroup = new DynamicDroup({
            groupKey: this.metrics.dynamicField,
            currentKey: this.model.dynamicContext.currentKey,
        });
        this.$dataSetController.registerTranform(this._dynamicDroup);
    }

    /**
     * @override
     */
    render() {
        // 自动播放
        if (this.model.dynamicContext.autoAnimate) {
            this.playAnimate();
        } else {
            super.render();
        }
    }

    /**
     * 开始播放动画
     */
    playAnimate() {
        if (this.__isPlaying) {
            return false;
        }
        clearInterval(this.__timeId);
        // 配置动画
        this._addAnimateConfig();
        this.__isPlaying = true;

        /**
         * TODO:
         * 参数化， 播放速度
         */
        const interval = this.model.settings.interval || 1000;

        // 设置播放定时器
        this.__timeId = setInterval(() => {
            const { groupKeysLength } = this._dynamicDroup;
            const count = this._dynamicDroup.nextLoopKey();

            if (!this.chart) {
                return this.pauseAnimate();
            }
            this.setDynamicData(count);
            this.emit(HOOKS.PLAY, { currentKey: this._dynamicDroup.currentKey });

            // 最后一个结束当前播放
            if (count >= groupKeysLength - 1) {
                this.pauseAnimate();
                this.emit(HOOKS.ENDED);
            }
        }, interval);
    }

    /**
     * 暂停
     */
    pauseAnimate() {
        if (!this.__isPlaying) return;
        clearInterval(this.__timeId);
        this._removeAnimateConfig();
        this.__isPlaying = false;
        this.__timeId = null;
        this.emit(HOOKS.PAUSE);
    }

    /**
     * 重播
     */
    replayAnimate() {
        // 1.暂停动画
        // 移除动画配置
        // 不触发事件
        clearInterval(this.__timeId);
        this._removeAnimateConfig();
        this.__isPlaying = false;
        this.__timeId = null;

        // 2. 设置从最头播放
        this._dynamicDroup.startKeys = 0;
        this.setDynamicData(0);

        // 触发更新第一个播放事件
        this.emit(HOOKS.PLAY, { currentKey: this._dynamicDroup.groupKeys[0] });

        // 3. 开始动画
        this.playAnimate();
    }

    /**
     * TODO: 后期参数化
     * 增加动画配置
     */
    _addAnimateConfig() {
        // geom 动画
        this.geom.animate({
            appear: {
                duration: 900,
                easing: 'easeLinear',
            },
            update: {
                duration: 900,
                animation: BAR_UPDATE,
                easing: 'easeLinear',
            },
        });
        // label 动画
        this.$labelController.changeConfig({
            animateOption: {
                appear: {
                    animation: LABEL_APPEAR,
                    delay: 0,
                    duration: 900,
                    easing: 'easeLinear',
                },
                update: {
                    animation: LABEL_UPDATE,
                    duration: 900,
                    easing: 'easeLinear',
                },
            },
        });
    }

    /**
     * 删除动画配置
     */
    _removeAnimateConfig() {
        this.geom.animate(true);
        this.$labelController.changeConfig({
            animateOption: {
                appear: {
                    animation: 'fadeIn',
                    delay: 0,
                    duration: 350,
                    easing: 'easeLinear',
                },
                update: {
                    animation: 'fadeIn',
                    duration: 350,
                    easing: 'easeLinear',
                },
            },
        });
    }

    /**
     * TODO:
     * API
     * seek() {} 跳转到具体某个位置
     * playbackRate() {}控制播放速度
     */

    /**
     * 设置当前数据
     * @param {number} count
     */
    setDynamicData(count) {
        const { groupValues, groupKeys } = this._dynamicDroup;
        const keyName = groupKeys[count];
        const dataValues = groupValues[count];
        const field = this.metrics.yField;
        const chart = this.chart;

        // 自动化同步一下最大值
        const defaultConfig = chart.get('options').scales[field] || {};
        const yFieldScale = this.model.scales[field] || {};
        const currentMax = dataValues[dataValues.length - 1][field];
        if (yFieldScale.max === undefined || yFieldScale.max < currentMax) {
            chart.scale(field, {
                ...defaultConfig,
                max: currentMax,
                nice: false,
            });
        }

        this._setGuideText(keyName);
        this._callChartNativeFunc('changeData', dataValues);
    }

    // 设置当前文字样式
    // TODO: 样式参数化
    _setGuideText(content) {
        const chart = this.chart;
        chart.guide().clear();
        chart.guide().text({
            position: ['95%', '90%'],
            content: content,
            style: {
                fontSize: 40,
                fontWeight: 'bold',
                fill: '#ddd',
                textAlign: 'end',
            },
            animate: false,
        });
    }

    /**
     * 转换坐标轴
     * 条形图是在默认直角坐标系下转换坐标轴生成
     * @override
     */
    _initCoord() {
        this.chart.coord().transpose();
    }

    /**
     * @override
     */
    _initGeom() {
        super._initGeom();
        this._setGuideText(this._dynamicDroup.currentKey);
    }

    /**
     * @override
     */
    _initeGeomColors() {
        const { model, geoms, metrics } = this;
        const { colorDimension, xField } = metrics;
        const _colorDimension = colorDimension || xField;
        const colorType = model.colorType;
        const colors = parseColorsWithType(model.colors, colorType);

        let colorParmas = null;
        if (colorType === COLOR_TYPE_MAP.POLYCHROME) {
            const colorMap = {};
            let index = 0;
            colorParmas = (value) => {
                if (colorMap[value]) {
                    return colorMap[value];
                }
                const color = colors[index++];
                colorMap[value] = color;
                if (index > colors.length) {
                    index = 0;
                }
                return color;
            };
        } else if (
            colorType === COLOR_TYPE_MAP.MONOCHROME ||
            colorType === COLOR_TYPE_MAP.GRADIEND
        ) {
            colorParmas = colors;
        }

        geoms.forEach((geom) => {
            if (!geom || geom.destroyed) return;
            geom.color(_colorDimension, colorParmas);
        });
    }

    /**
     * @override
     * @param {Array} colors
     */
    changeColors(colors) {
        this.model.colors = colors;
        this._initeGeomColors();
        this._callChartNativeFunc('repaint');
    }

    /**
     * @override
     * 坐标轴也要作出相应的颠倒
     */
    _initAxes() {
        const { xAxis, yAxis } = this.model;
        xAxis.dimType = 'y';
        yAxis.dimType = 'x';
        this.$xAxisController = new XAxis(this.chart, this.metrics.yField, xAxis);
        this.$yAxisController = new YAxis(this.chart, this.metrics.xField, yAxis);
        this._setYAxisLabelFormatter(this.$xAxisController, this.model.settings.isTransformPercent);
    }

    beforeDestroy() {
        // 删除定时器
        this.pauseAnimate();
    }

    // 绘制半径
    _createShape() {
        return createBarRectShape(this);
    }
}
