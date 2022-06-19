import _extends from "@babel/runtime/helpers/extends";
import _throttle from "lodash/throttle";
import _debounce from "lodash/debounce";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import ChartElement from "./chart-element.html";
import Promise from 'bluebird';
import { createDbClickEvent, initChartModel } from "./helper/util";
import { deleteModelKey } from "./helper/diff-switch-chart";

/**
 * chart-element
 */
export default inherit(BaseElement, {
  name: 'chart-element',
  template: ChartElement,
  props: ['editor', 'global', 'model', 'options'],
  computed: {
    cssStyle: function cssStyle() {
      var rect = this.rect;
      var padding = rect.padding,
          height = rect.height,
          width = rect.width;
      var paddingT = padding[0],
          paddingR = padding[1],
          paddingB = padding[2],
          paddingL = padding[3];
      return {
        height: height + paddingT + paddingB + 'px',
        width: width + paddingR + paddingL + 'px'
      };
    },
    isShowAnimateControt: function isShowAnimateControt() {
      var isSelected = this.editor.currentElement && this.editor.currentElement === this.model;
      var isDynamicChart = ['dynamicline', 'dynamicbar'].includes(this.model.chartType);
      return isDynamicChart && isSelected;
    },
    // 判断动画状态
    isDynamicPaused: function isDynamicPaused() {
      var dynamicContext = this.model.dynamicContext;
      console.log(dynamicContext.dynamicPaused);
      return dynamicContext && dynamicContext.dynamicPaused !== undefined ? dynamicContext.dynamicPaused : true;
    }
  },
  events: _extends({}, createDbClickEvent('chart')),
  methods: {
    playAnimate: function playAnimate() {
      this.callChartRenderFn('playAnimate');
    },
    pauseAnimate: function pauseAnimate() {
      this.callChartRenderFn('pauseAnimate');
    },
    replayAnimate: function replayAnimate() {
      this.callChartRenderFn('replayAnimate');
    },

    /**
     * 初始化图表
     */
    initChartRender: function initChartRender() {
      var _this = this;

      var container = this.$refs.chart;
      if (!this._isMounted && !container) return; // 先销毁旧的对象

      this.destoryChart(); // 加载资源

      return this.loadChartRenderSource().then(function (createChartRender) {
        // 获取核心chart model字段
        var chartModel = initChartModel(_this.model);
        return createChartRender(container, chartModel);
      }).then(function (chart) {
        // 赋值初始化
        _this.$chartRender = chart; // 设置当前数据颜色长度

        _this.setColorScalesLenght(); // 初始化监听


        _this.initWatchers(); // 初始化事件机制


        _this.initEvents(); // 返回


        return chart;
      }).catch(function (error) {
        // TODO：校验对错误处理
        _this.errorMessage = '暂不支持该类型，请联系客服';
        throw error;
      });
    },

    /**
     * 设置model中是颜色长度,即数据长度
     */
    setColorScalesLenght: function setColorScalesLenght() {
      var getColorScalesLenght_FnName = 'getColorScalesLenght';
      var scalesLenght = this.callChartRenderFn(getColorScalesLenght_FnName); // 设置长度

      if (typeof scalesLenght === 'number') {
        this.$set(this.model, 'colorScalesLenght', scalesLenght);
      }
    },

    /**
     * 初始化所有的监听
     */
    initWatchers: function initWatchers() {
      var _this2 = this;

      // 避免重复监听
      this.unWatchers();

      var changeSizeThrottle = _throttle(function () {
        return _this2.callChartRenderFn('changeSize', _this2.model.width, _this2.model.height);
      }, 200);

      var normalDebounceTime = 200;

      var _this$createDimChange = this.createDimChangeWatcher(),
          changeChartData = _this$createDimChange.changeChartData,
          changeScales = _this$createDimChange.changeScales,
          changeMetrics = _this$createDimChange.changeMetrics;

      var watcherCfgList = [{
        key: 'model.colorType',
        watcherName: 'changeColorType'
      }, {
        key: 'model.colors',
        watcherName: 'changeColors'
      }, {
        key: 'model.chartTitle',
        watcherName: 'changeTitle'
      }, {
        key: 'model.legend',
        watcherName: 'changeLegend'
      }, {
        key: 'model.label',
        watcherName: 'changeLabel'
      }, {
        key: 'model.settings',
        watcherName: 'changeSettings'
      }, {
        key: 'model.xAxis',
        watcherName: 'changexAxis'
      }, {
        key: 'model.yAxis',
        watcherName: 'changeyAxis'
      }, {
        key: 'model.y2Axis',
        watcherName: 'changey2Axis'
      }, {
        key: 'model.shapeOpacity',
        watcherName: 'changeShapeOpacity'
      }, {
        key: 'model.chartData',
        watcher: changeChartData
      }, {
        key: 'model.scales',
        watcher: changeScales
      }, {
        key: 'model.metrics',
        watcher: changeMetrics
      }, {
        key: 'model.width',
        watcher: changeSizeThrottle
      }, {
        key: 'model.height',
        watcher: changeSizeThrottle
      }]; // 遍历执行监听列表

      this.unWatcherList = watcherCfgList.map(function (_ref) {
        var key = _ref.key,
            watcher = _ref.watcher,
            watcherName = _ref.watcherName;

        if (typeof watcher !== 'function' && watcherName) {
          watcher = _debounce(function () {
            for (var _len = arguments.length, agrs = new Array(_len), _key = 0; _key < _len; _key++) {
              agrs[_key] = arguments[_key];
            }

            return _this2.callChartRenderFn.apply(_this2, [watcherName].concat(agrs));
          }, normalDebounceTime);
        }

        return _this2.$watch(key, watcher, {
          deep: true,
          immediate: false
        });
      });
    },

    /**
     * 初始化事件
     */
    initEvents: function initEvents() {
      var _this3 = this;

      if (this.__removeEvents) {
        this.__removeEvents();
      }

      var updateCurrentKey = function updateCurrentKey(_ref2) {
        var currentKey = _ref2.currentKey;
        _this3.model.dynamicContext.dynamicPaused = false;
        _this3.model.dynamicContext.currentKey = currentKey;
      };

      var updateDynamicPaused = function updateDynamicPaused() {
        _this3.model.dynamicContext.dynamicPaused = true;
      }; // 更新播放进度


      this.$chartRender.on('dynamic:play', updateCurrentKey); // 更新暂停

      this.$chartRender.on('dynamic:pause', updateDynamicPaused); // 声明移除函数

      this.__removeEvents = function () {
        _this3.$chartRender.off('dynamic:play', updateCurrentKey);

        _this3.$chartRender.off('dynamic:pause', updateCurrentKey);

        _this3.__removeEvents = null;
      };
    },

    /**
     * 创建纬度，数据，数据描述变化函数
     * Tip:
     * 纬度变化，必须重新重新生成图表，需要等待chartData和scales赋值之后才重新生成
     */
    createDimChangeWatcher: function createDimChangeWatcher() {
      var self = this;
      var _metricsChanged = false; // 数据改变

      var changeChartData = _debounce(function (chartData) {
        if (!_metricsChanged) {
          self.callChartRenderFn('changeData', chartData, self.model.scales);
          self.setColorScalesLenght();
        }
      }, 100); // 数据描述改变


      var changeScales = _debounce(function (scales) {
        if (!_metricsChanged) {
          self.callChartRenderFn('changeScales', scales);
        }
      }, 100); // 纬度变化


      var changeMetrics = function changeMetrics() {
        _metricsChanged = true; // reRenderChart

        setTimeout(function () {
          self.initChartRender();
          _metricsChanged = false;
        }, 200);
      };

      return {
        changeChartData: changeChartData,
        changeScales: changeScales,
        changeMetrics: changeMetrics
      };
    },

    /**
     * 取消所有监听器
     */
    unWatchers: function unWatchers() {
      var unWatcherList = this.unWatcherList;

      if (Array.isArray(unWatcherList)) {
        unWatcherList.forEach(function (unWatcher) {
          if (typeof unWatcher === 'function') {
            unWatcher();
          }
        }); // 清空

        this.unWatcherList = null;
      }
    },

    /**
     * 取消事件监听释放内存
     */
    removeEvents: function removeEvents() {
      if (this.__removeEvents) {
        this.__removeEvents();

        this.__removeEvents = null;
      }
    },

    /**
     * 获取渲染canvas对象
     */
    getCanvas: function getCanvas() {
      // 如果正在动画，就暂停动画出图
      var dynamicContext = this.model.dynamicContext;

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
    callChartRenderFn: function callChartRenderFn(fn) {
      var $chartRender = this.$chartRender;

      if ($chartRender && typeof $chartRender[fn] === 'function') {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return $chartRender[fn].apply($chartRender, args);
      }
    },

    /**
     *  销毁图表
     */
    destoryChart: function destoryChart() {
      this.callChartRenderFn('destroy');
      this.$chartRender = null;
    },

    /**
     * 加载渲染库资源
     */
    loadChartRenderSource: function loadChartRenderSource() {
      return import(
      /* webpackChunkName: "chart-render" */
      '@gaoding/chart-render').then(function (m) {
        return m.default;
      });
    },

    /**
     * 由于G2动画没有主动暴露动画后的回调，且所有动画时间在450毫秒内
     * 所以默认等待500毫秒, 避免出图的时候渲染不全
     * TODO: 后期注意是否有动画结束回调
     * @override
     */
    load: function load() {
      return this.loadChartRenderSource().then(function () {
        return Promise.delay(500);
      });
    }
  },
  mounted: function mounted() {
    this.initChartRender();
  },
  beforeDestroy: function beforeDestroy() {
    this.unWatchers();
    this.removeEvents();
    this.destoryChart();
    deleteModelKey(this.model);
  }
});