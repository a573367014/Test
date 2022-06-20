import { merge } from '@antv/g2/lib/util';
import Line from '../line/index';
import DataDynamicLine from '../../controller/data/instructs/dynamic-line';
import { HOOKS } from '../../helpers/constants';

/**
 * 动态折线图
 * @class DynamicLine
 */
export default class DynamicLine extends Line {
    __isPlaying = false;
    /**
     * 获取默认参数
     * @override
     */
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            xAxis: {
                startRange: 0,
                endRange: 1,
            },
            settings: {
                lineType: 'smooth',
                lineWidth: 3,
                lineDash: [0, 0],
                enablePoint: false,
            },
            label: {
                offset: 0.91,
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
        this._dynamicDroup = new DataDynamicLine({
            groupKey: this.metrics.dynamicField,
            currentKey: this.model.dynamicContext && this.model.dynamicContext.currentKey,
        });
        this.$dataSetController.registerTranform(this._dynamicDroup);
    }

    /**
     * @override
     */
    render() {
        // 自动播放
        if (this.model.dynamicContext && this.model.dynamicContext.autoAnimate) {
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
        this.__isPlaying = true;
        // 配置动画
        this._addAnimateConfig();
        /**
         *
         * TODO:
         * 参数化， 播放速度
         */
        const interval = this.model.settings.interval || 300;
        this.__timeId = setInterval(() => {
            const { groupKeysLength } = this._dynamicDroup;
            const count = this._dynamicDroup.nextLoopKey();
            if (!this.chart) {
                return this.pauseAnimate();
            }
            this.setDynamicData(count);
            this.emit(HOOKS.PLAY, { currentKey: this._dynamicDroup.currentKey });
            if (count >= groupKeysLength - 1) {
                this.pauseAnimate();
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
        // 不触发暂停事件
        clearInterval(this.__timeId);
        this._removeAnimateConfig();
        this.__isPlaying = false;
        this.__timeId = null;

        // 2. 设置从最头播放
        this._dynamicDroup.dataList = [];
        this._dynamicDroup.startKeys = 1;
        this.setDynamicData(1);

        // 触发更新第一个播放事件
        this.emit(HOOKS.PLAY, {
            currentKey: this._dynamicDroup.groupKeys[0],
        });

        // 3. 开始动画
        this.playAnimate();
    }

    /**
     * TODO:
     * 参数化
     * 增加动画配置
     */
    _addAnimateConfig() {
        // geom 动画
        this.geom.animate({
            appear: {
                duration: 300,
                easing: 'easeLinear',
                animation: 'pathIn',
            },
            update: {
                duration: 300,
                animation: 'pathIn',
                easing: 'easeLinear',
            },
        });
        // label 动画
        // this.$labelController.changeConfig({
        //     animateOption: {
        //         appear: {
        //             animation: LABEL_APPEAR,
        //             delay: 0,
        //             duration: 900,
        //             easing: 'easeLinear'
        //         },
        //         update: {
        //             animation: LABEL_UPDATE,
        //             duration: 900,
        //             easing: 'easeLinear'
        //         }
        //     }
        // });
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
     * 设置当前数据
     * @param {number} count
     */
    setDynamicData(count) {
        const { groupValues, dataList } = this._dynamicDroup;
        const dataValues = groupValues[count];
        const field = this.metrics.yField;

        const _dataList = dataList.concat(dataValues);
        this._dynamicDroup.dataList = _dataList;

        this._setGuideText(_dataList[_dataList.length - 1][field]);
        this._callChartNativeFunc('changeData', _dataList);
    }

    /**
     * TODO
     * 暂时不开放数字跟随，等动画方案解决
     */
    _setGuideText() {
        // const chart = this.chart;
        // const { dataList } = this._dynamicDroup;
        // const lastItem = dataList[dataList.length - 1];
        // const content = lastItem[this.metrics.yField];
        // chart.guide().clear();
        // let guideShape = chart.guide().text({
        //     position: lastItem,
        //     content: content,
        //     style: {
        //         // TODO: 参数化
        //         fontSize: 23,
        //         fill: '#333333',
        //         textAlign: 'left'
        //     },
        //     animateCfg: {
        //         appear: {
        //             duration: 300,
        //             easing: 'easeLinear',
        //             animation: LABEL_UPDATE,
        //         },
        //         update: {
        //             duration: 300,
        //             animation: 'pathIn',
        //             easing: LABEL_UPDATE
        //         }
        //     },
        // });
    }

    /**
     * @override
     */
    _initGeom() {
        super._initGeom();
        this._setGuideText(this._dynamicDroup.getLastValue());
    }

    beforeDestroy() {
        // 删除定时器
        this.pauseAnimate();
    }

    // 绘制半径
    _createShape() {
        // return createBarRectShape(this);
    }
}
