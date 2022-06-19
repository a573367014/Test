import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import ChartElement from './chart-element.html';
import Promise from 'bluebird';
import { createDbClickEvent, initChartModel } from './helper/util';
import { deleteModelKey } from './helper/diff-switch-chart';
import { debounce, throttle } from 'lodash';

/**
 * chart-element
 */
export default inherit(BaseElement, {
    name: 'chart-element',
    template: ChartElement,
    props: ['editor', 'global', 'model', 'options'],
    computed: {
        cssStyle() {
            const { rect } = this;
            const { padding, height, width } = rect;
            const [paddingT, paddingR, paddingB, paddingL] = padding;
            return {
                height: height + paddingT + paddingB + 'px',
                width: width + paddingR + paddingL + 'px',
            };
        },
        isShowAnimateControt() {
            const isSelected =
                this.editor.currentElement && this.editor.currentElement === this.model;
            const isDynamicChart = ['dynamicline', 'dynamicbar'].includes(this.model.chartType);
            return isDynamicChart && isSelected;
        },
        // 判断动画状态
        isDynamicPaused() {
            const dynamicContext = this.model.dynamicContext;
            console.log(dynamicContext.dynamicPaused);
            return dynamicContext && dynamicContext.dynamicPaused !== undefined
                ? dynamicContext.dynamicPaused
                : true;
        },
    },
    events: {
        ...createDbClickEvent('chart'),
    },
    methods: {
        playAnimate() {
            this.callChartRenderFn('playAnimate');
        },
        pauseAnimate() {
            this.callChartRenderFn('pauseAnimate');
        },
        replayAnimate() {
            this.callChartRenderFn('replayAnimate');
        },
        /**
         * 初始化图表
         */
        initChartRender() {
            const container = this.$refs.chart;
            if (!this._isMounted && !container) return;
            // 先销毁旧的对象
            this.destoryChart();
            // 加载资源
            return this.loadChartRenderSource()
                .then((createChartRender) => {
                    // 获取核心chart model字段
                    const chartModel = initChartModel(this.model);
                    return createChartRender(container, chartModel);
                })
                .then((chart) => {
                    // 赋值初始化
                    this.$chartRender = chart;
                    // 设置当前数据颜色长度
                    this.setColorScalesLenght();
                    // 初始化监听
                    this.initWatchers();
                    // 初始化事件机制
                    this.initEvents();
                    // 返回
                    return chart;
                })
                .catch((error) => {
                    // TODO：校验对错误处理
                    this.errorMessage = '暂不支持该类型，请联系客服';
                    throw error;
                });
        },

        /**
         * 设置model中是颜色长度,即数据长度
         */
        setColorScalesLenght() {
            const getColorScalesLenght_FnName = 'getColorScalesLenght';
            const scalesLenght = this.callChartRenderFn(getColorScalesLenght_FnName);
            // 设置长度
            if (typeof scalesLenght === 'number') {
                this.$set(this.model, 'colorScalesLenght', scalesLenght);
            }
        },

        /**
         * 初始化所有的监听
         */
        initWatchers() {
            // 避免重复监听
            this.unWatchers();

            const changeSizeThrottle = throttle(
                () => this.callChartRenderFn('changeSize', this.model.width, this.model.height),
                200,
            );
            const normalDebounceTime = 200;
            const { changeChartData, changeScales, changeMetrics } = this.createDimChangeWatcher();

            const watcherCfgList = [
                {
                    key: 'model.colorType',
                    watcherName: 'changeColorType',
                },
                {
                    key: 'model.colors',
                    watcherName: 'changeColors',
                },
                {
                    key: 'model.chartTitle',
                    watcherName: 'changeTitle',
                },
                {
                    key: 'model.legend',
                    watcherName: 'changeLegend',
                },
                {
                    key: 'model.label',
                    watcherName: 'changeLabel',
                },
                {
                    key: 'model.settings',
                    watcherName: 'changeSettings',
                },
                {
                    key: 'model.xAxis',
                    watcherName: 'changexAxis',
                },
                {
                    key: 'model.yAxis',
                    watcherName: 'changeyAxis',
                },
                {
                    key: 'model.y2Axis',
                    watcherName: 'changey2Axis',
                },
                {
                    key: 'model.shapeOpacity',
                    watcherName: 'changeShapeOpacity',
                },
                {
                    key: 'model.chartData',
                    watcher: changeChartData,
                },
                {
                    key: 'model.scales',
                    watcher: changeScales,
                },
                {
                    key: 'model.metrics',
                    watcher: changeMetrics,
                },
                {
                    key: 'model.width',
                    watcher: changeSizeThrottle,
                },
                {
                    key: 'model.height',
                    watcher: changeSizeThrottle,
                },
            ];

            // 遍历执行监听列表
            this.unWatcherList = watcherCfgList.map(({ key, watcher, watcherName }) => {
                if (typeof watcher !== 'function' && watcherName) {
                    watcher = debounce(
                        (...agrs) => this.callChartRenderFn(watcherName, ...agrs),
                        normalDebounceTime,
                    );
                }
                return this.$watch(key, watcher, {
                    deep: true,
                    immediate: false,
                });
            });
        },

        /**
         * 初始化事件
         */
        initEvents() {
            if (this.__removeEvents) {
                this.__removeEvents();
            }
            const updateCurrentKey = ({ currentKey }) => {
                this.model.dynamicContext.dynamicPaused = false;
                this.model.dynamicContext.currentKey = currentKey;
            };
            const updateDynamicPaused = () => {
                this.model.dynamicContext.dynamicPaused = true;
            };
            // 更新播放进度
            this.$chartRender.on('dynamic:play', updateCurrentKey);
            // 更新暂停
            this.$chartRender.on('dynamic:pause', updateDynamicPaused);
            // 声明移除函数
            this.__removeEvents = () => {
                this.$chartRender.off('dynamic:play', updateCurrentKey);
                this.$chartRender.off('dynamic:pause', updateCurrentKey);
                this.__removeEvents = null;
            };
        },

        /**
         * 创建纬度，数据，数据描述变化函数
         * Tip:
         * 纬度变化，必须重新重新生成图表，需要等待chartData和scales赋值之后才重新生成
         */
        createDimChangeWatcher() {
            const self = this;
            let _metricsChanged = false;
            // 数据改变
            const changeChartData = debounce((chartData) => {
                if (!_metricsChanged) {
                    self.callChartRenderFn('changeData', chartData, self.model.scales);
                    self.setColorScalesLenght();
                }
            }, 100);
            // 数据描述改变
            const changeScales = debounce((scales) => {
                if (!_metricsChanged) {
                    self.callChartRenderFn('changeScales', scales);
                }
            }, 100);
            // 纬度变化
            const changeMetrics = () => {
                _metricsChanged = true;
                // reRenderChart
                setTimeout(() => {
                    self.initChartRender();
                    _metricsChanged = false;
                }, 200);
            };
            return {
                changeChartData,
                changeScales,
                changeMetrics,
            };
        },

        /**
         * 取消所有监听器
         */
        unWatchers() {
            const unWatcherList = this.unWatcherList;
            if (Array.isArray(unWatcherList)) {
                unWatcherList.forEach((unWatcher) => {
                    if (typeof unWatcher === 'function') {
                        unWatcher();
                    }
                });
                // 清空
                this.unWatcherList = null;
            }
        },
        /**
         * 取消事件监听释放内存
         */
        removeEvents() {
            if (this.__removeEvents) {
                this.__removeEvents();
                this.__removeEvents = null;
            }
        },

        /**
         * 获取渲染canvas对象
         */
        getCanvas() {
            // 如果正在动画，就暂停动画出图
            const dynamicContext = this.model.dynamicContext;
            if (dynamicContext && dynamicContext.dynamicPaused === false) {
                this.pauseAnimate();
            }
            return this.callChartRenderFn('getCanvas');
        },
        /**
         * 执行$chartRender的函数
         * @param {string} fn 函数名称
         * @param  {...any} args 参数
         */
        callChartRenderFn(fn, ...args) {
            const $chartRender = this.$chartRender;
            if ($chartRender && typeof $chartRender[fn] === 'function') {
                return $chartRender[fn](...args);
            }
        },

        /**
         *  销毁图表
         */
        destoryChart() {
            this.callChartRenderFn('destroy');
            this.$chartRender = null;
        },

        /**
         * 加载渲染库资源
         */
        loadChartRenderSource() {
            return import(/* webpackChunkName: "chart-render" */ '@gaoding/chart-render').then(
                (m) => m.default,
            );
        },

        /**
         * 由于G2动画没有主动暴露动画后的回调，且所有动画时间在450毫秒内
         * 所以默认等待500毫秒, 避免出图的时候渲染不全
         * TODO: 后期注意是否有动画结束回调
         * @override
         */
        load() {
            return this.loadChartRenderSource().then(() => Promise.delay(500));
        },
    },
    mounted() {
        this.initChartRender();
    },
    beforeDestroy() {
        this.unWatchers();
        this.removeEvents();
        this.destoryChart();
        deleteModelKey(this.model);
    },
});
