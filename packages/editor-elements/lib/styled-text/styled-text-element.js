import _extends from "@babel/runtime/helpers/extends";
import _split from "lodash/split";
import _uniq from "lodash/uniq";
import loader from "@gaoding/editor-utils/lib/loader";
import Matrix from "@gaoding/editor-utils/lib/matrix";
import Transform from "@gaoding/editor-utils/lib/transform";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import TextBase from "../text/text-base";
import template from "./styled-text-element.html";
import { isGroup } from "@gaoding/editor-utils/lib/element"; // 暂时不考虑限制 cache 数量

var renderCache = new Map();
var RENDER_DELAY = 200;
export default inherit(TextBase, {
  template: template,
  name: 'styledText-element',
  props: ['global', 'model', 'options', 'editor'],
  data: function data() {
    return {
      resizing: false,
      isLockRatioResize: false,
      resizeStartRatio: 0,
      resizeStartImgWidth: 0,
      resizeStartImgHeight: 0,
      changing: false,
      rendering: false,
      renderError: null,
      lastRenderTimeStamp: -1,
      renderingTimeStamp: -1,
      lastRenderedTextsData: null,
      // 已经渲染过的文本信息数据
      canvas: null,
      ctx2D: null
    };
  },
  methods: {
    load: function load() {
      return Promise.all([this.loadFonts(), this.loadImage()]);
    },
    loadImage: function loadImage(url) {
      var _this = this;

      url = url || this.model.image.url;

      if (!url) {
        return Promise.resolve();
      }

      return utils.loadImage(url, this.options.fitCrossOrigin).then(function (img) {
        _this.model.$naturalWidth = img.naturalWidth;
        _this.model.$naturalHeight = img.naturalHeight;
        return img;
      }).catch(function () {
        _this.usePlaceholder = true;
      });
    },
    loadFonts: function loadFonts() {
      var _this2 = this;

      var options = this.options;
      var _this$model = this.model,
          contents = _this$model.contents,
          fontFamily = _this$model.fontFamily;
      var names = contents.filter(function (item) {
        return item && item.fontFamily;
      }).map(function (item) {
        return item.fontFamily;
      });
      names.push(fontFamily);
      names = _uniq(names);
      var fontLoads = names.map(function (name) {
        var font = _this2.getCloseFont(name);

        if (!font) {
          return Promise.resolve();
        }

        return loader.loadFont(_extends({}, font, {
          display: 'auto'
        }), options.fontLoadTimeout);
      });
      return Promise.all(fontLoads);
    },
    getTextsData: function getTextsData() {
      var textsData = _extends({
        writingMode: this.model.writingMode,
        fontSize: Math.round(this.model.fontSize),
        maxWidth: Math.round(this.model.width),
        maxHeight: Math.round(this.model.height)
      }, this.model.effectStyle);

      var zoom = this.global.zoom;
      var node = this.$el.querySelector('.element-main-unrotated span');
      if (!node) return null;
      var contents = [];
      var parentRect = node.parentElement.getBoundingClientRect();
      var hasEmoji = false; // 一些字体 span 的宽度会超出外围容器的宽度
      // 对内部的文本 rect 需要考虑这个 diff 来纠正位置

      var minTop = Infinity;
      var maxBottom = -Infinity;
      var minLeft = Infinity;
      var maxRight = -Infinity;
      node.childNodes.forEach(function (child) {
        if (child.nodeType === 3) {
          // text node
          var lines = {};
          var chars = [];

          _split(child.textContent, '').forEach(function (char) {
            // filter emojis
            if (char.length === 1) {
              chars.push(char);
            } else {
              hasEmoji = true;
              chars.push('?');
              chars.push(' ');
            }
          });

          chars.forEach(function (char, index) {
            // 过滤空白符：空格与 tab
            if (char === ' ' || char.charCodeAt(0) === 9) return;
            var range = document.createRange();
            range.setStart(child, index);
            range.setEnd(child, index + 1);
            var rect = range.getBoundingClientRect();
            var info = {
              char: char,
              x: Math.round((rect.x - parentRect.x) / zoom),
              y: Math.round((rect.y - parentRect.y) / zoom),
              width: Math.round(rect.width / zoom),
              height: Math.round(rect.height / zoom)
            };
            minTop = Math.min(minTop, info.y);
            maxBottom = Math.max(maxBottom, info.y + info.height);
            minLeft = Math.min(minLeft, info.x);
            maxRight = Math.max(maxRight, info.x + info.width);

            if (lines[rect.y]) {
              lines[rect.y].push(info);
            } else {
              lines[rect.y] = [info];
            }
          });
          var childContents = Object.keys(lines).map(function (key) {
            return parseFloat(key);
          }).sort(function (k1, k2) {
            return k1 - k2;
          }).map(function (key) {
            return lines[key];
          });
          contents = contents.concat(childContents);
        }
      }); // 行高小的时候，不止会在上面溢出，下面也可能会
      // 导致容器的高度和实际的文本高度不一致

      textsData.maxHeight = Math.max(textsData.maxHeight, maxBottom - minTop); // textsData.maxWidth = Math.max(textsData.maxWidth, maxRight - minLeft);

      textsData.contents = contents;
      textsData.hasEmoji = hasEmoji;
      return textsData;
    },
    renderStyledText: function renderStyledText(timestamp, textsData, doneCb, force) {
      var _this3 = this;

      if (force === void 0) {
        force = false;
      }

      // 如果有缩略图，会导致触发两次事件，导致同时发起两个请求，
      // 因此过滤掉非编辑器的事件发出
      if (!this.isDesignMode) return;
      this.rendering = true;
      this.model.image.url = null;
      this.$events.$emit('element.styledTextUpdate', textsData, function (err, image) {
        // callback when outer renderer done its updating, and return image url as arg
        if (force || timestamp === _this3.renderingTimeStamp && !err && image && image.url) {
          _this3.lastRenderedTextsData = textsData;

          _this3.loadImage(image.url).then(function (img) {
            if (force || !_this3.checkTextsDataDiff(_this3.getTextsData(), textsData)) {
              _this3.model.image = image;

              _this3.renderToCanvas(img);

              _this3.changeImgColor();

              _this3.updateCache(textsData);
            }

            doneCb && doneCb();
            _this3.rendering = false;
            _this3.renderError = null;
          });
        } else {
          _this3.rendering = _this3.renderingTimeStamp > timestamp;
          _this3.renderError = err;
        }
      });
    },

    /**
     * scheduleRender
     * 风格化渲染调度，在一定时间内限制渲染请求频率
     *
     */
    scheduleRender: function scheduleRender(doneCb, force) {
      var _this4 = this;

      if (force === void 0) {
        force = false;
      }

      if (!this.hasSupportedEffect || this.isFontSizeTooSmall) return;
      this.rendering = false;
      var timestamp = Date.now();
      this.$nextTick(function () {
        var textsData = _this4.getTextsData();

        if (!textsData) {
          _this4.renderError = new Error('无文本内容');
          return;
        }

        var hasDifference = !_this4.lastRenderedTextsData || force; // 单纯改变文本框大小，没有影响文本排版时，不需要重新渲染

        if (!hasDifference) {
          hasDifference = _this4.checkTextsDataDiff(textsData, _this4.lastRenderedTextsData);
        }

        if (!hasDifference) return;

        var cache = _this4.getCache(textsData);

        if (cache) {
          _this4.restoreCacheData(textsData, cache);

          _this4.rendering = false;
          return;
        }

        _this4.changing = !force;
        _this4.renderingTimeStamp = timestamp;
        setTimeout(function renderTimer(timestamp, textsData, doneCb, force) {
          if (force || timestamp === this.renderingTimeStamp && timestamp - this.lastRenderTimeStamp > RENDER_DELAY) {
            this.changing = false;
            this.lastRenderTimeStamp = this.renderingTimeStamp;
            this.renderStyledText(timestamp, textsData, doneCb, force);
          }
        }.bind(_this4, timestamp, textsData, doneCb, force), force ? 0 : RENDER_DELAY);
      });
    },
    checkTextsDataDiff: function checkTextsDataDiff(textsData, textsData2) {
      var lastContents = textsData2.contents;
      var hasDifference = textsData.contents.length !== lastContents.length || textsData.fontSize !== textsData2.fontSize || textsData.writingMode !== textsData2.writingMode || textsData.id !== textsData2.id || textsData.effectFontId !== textsData2.effectFontId;

      if (!hasDifference) {
        hasDifference = textsData.contents.some(function (content, index) {
          var oldContent = lastContents[index];
          if (content.length !== oldContent.length) return true;
          return content.some(function (info, innerIndex) {
            var oldInfo = oldContent[innerIndex];
            return Math.abs(info.x - oldInfo.x) > 1 || Math.abs(info.y - oldInfo.y) > 1;
          });
        });
      }

      return hasDifference;
    },
    changeImgColor: function changeImgColor() {
      this.ctx2D.globalCompositeOperation = 'source-in';
      this.ctx2D.fillStyle = this.model.color;
      this.ctx2D.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    renderToCanvas: function renderToCanvas(img) {
      this.canvas.width = img.naturalWidth || img.width;
      this.canvas.height = img.naturalHeight || img.height;
      this.canvas.style.width = this.canvas.width + "px";
      this.canvas.style.height = this.canvas.height + "px";
      this.ctx2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx2D.drawImage(img, 0, 0);
    },
    getCache: function getCache(textsData) {
      return renderCache.get(JSON.stringify(textsData));
    },
    updateCache: function updateCache(textsData) {
      var cachedCanvas = document.createElement('canvas');
      cachedCanvas.width = this.canvas.width;
      cachedCanvas.height = this.canvas.height;
      var ctx = cachedCanvas.getContext('2d');
      ctx.drawImage(this.canvas, 0, 0);
      renderCache.set(JSON.stringify(textsData || this.getTextsData()), {
        image: _extends({}, this.model.image),
        canvas: cachedCanvas
      });
    },
    scheduleExportImg: function scheduleExportImg(textsData) {
      var exportDelay = RENDER_DELAY * 2;
      setTimeout(function exportTimer() {
        if (Date.now() - this.lastRenderTimeStamp >= exportDelay) {
          this.model.image.url = this.canvas.toDataURL();
          this.updateCache(textsData);
        }
      }.bind(this), exportDelay);
    },
    restoreCacheData: function restoreCacheData(textsData, cache) {
      this.model.image = cache.image;
      this.lastRenderedTextsData = textsData;
      this.renderToCanvas(cache.canvas);
      this.changeImgColor();
    }
  },
  computed: {
    showPlainText: function showPlainText() {
      // TODO:
      // 如果当前是等比例拖拽，但是上一次不是且还未返回结果
      // 这时候显示的是图片，而此时的图片与文本的排版不一样了
      return !this.isLockRatioResize && (this.isFontSizeTooSmall || this.resizing || this.changing || this.renderError || this.model.$editing || this.rendering || !this.hasSupportedEffect);
    },
    isFontSizeTooSmall: function isFontSizeTooSmall() {
      // 字体太小的情况下，渲染的效果很模糊，回退到正常文本
      return this.model.fontSize <= 14;
    },
    textStyle: function textStyle() {
      return {
        fontFamily: this.fontFamily,
        fontSize: this.fontSize + 'px',
        letterSpacing: this.letterSpacingScale * this.model.letterSpacing + 'px',
        // textDecoration: this.model.textDecoration,
        verticalAlign: this.model.verticalAlign,
        color: this.color,
        transform: this.mainTransform,
        transformOrigin: this.transformOrigin,
        minWidth: this.mainMinWdith,
        minHeight: this.mainMinHeight,
        width: this.mainWidth,
        height: this.mainHeight,
        opacity: this.showPlainText ? 1 : 0
      };
    },
    canvasStyle: function canvasStyle() {
      return {
        opacity: !this.showPlainText ? 1 : 0,
        marginTop: (this.model.image.offset.y || 0) + "px",
        marginLeft: (this.model.image.offset.x || 0) + "px"
      };
    },
    hasSupportedEffect: function hasSupportedEffect() {
      // 风格化可用需要：
      // 1. 选择了一个特效，即 id 有效
      // 2. 选择了支持这个特效的字体，即 effectFontId 有效
      return !!this.model.effectStyle.id && !!this.model.effectStyle.effectFontId;
    },
    // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
    transformInvert: function transformInvert() {
      var parentRotate = 0;

      if (isGroup(this.$parent.model)) {
        parentRotate = this.$parent.model.rotate * Math.PI / 180;
      }

      var _this$model2 = this.model,
          transform = _this$model2.transform,
          scaleX = _this$model2.scaleX,
          scaleY = _this$model2.scaleY;
      var _transform$localTrans = transform.localTransform,
          a = _transform$localTrans.a,
          b = _transform$localTrans.b,
          c = _transform$localTrans.c,
          d = _transform$localTrans.d,
          tx = _transform$localTrans.tx,
          ty = _transform$localTrans.ty;

      if (scaleX < 0) {
        a = -a;
        b = -b;
      }

      if (scaleY < 0) {
        c = -c;
        d = -d;
      }

      var matrix = new Matrix(a, b, c, d, tx, ty);
      matrix.rotate(parentRotate);
      matrix.invert();
      var invertTransform = new Transform();
      invertTransform.setFromMatrix(matrix);
      return invertTransform.toString();
    }
  },
  watch: {
    'model.contents': function modelContents() {
      var parentModel = this.$parent.model;
      var isAutoGroup = isGroup(parentModel) && parentModel.autoGrow; // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算

      if ((!this.$textResizeMeta || !isAutoGroup) && !this.resizing) {
        this.syncRect();
      }
    },
    'model.$editing': function model$editing(val) {
      if (!val) this.scheduleRender();
    },
    'model.writingMode': function modelWritingMode() {
      if (!this.isDesignMode) {
        return;
      }

      var model = this.model; // 当前 resize 模式旋转 90 度后可能变为新 resize

      var newResize = {
        2: 4,
        4: 2,
        5: 3,
        3: 5
      }[model.resize];

      if (newResize) {
        model.resize = newResize;
      }

      var _ref = [model.height, model.width];
      model.width = _ref[0];
      model.height = _ref[1];
      this.syncRect();
      this.scheduleRender();
    },
    'model.letterSpacing': function modelLetterSpacing() {
      this.syncRect();
      this.scheduleRender();
    },
    'model.lineHeight': function modelLineHeight() {
      this.syncRect();
      this.scheduleRender();
    },
    'model.padding': function modelPadding() {
      this.syncRect();
      this.scheduleRender();
    },
    'model.textAlign': function modelTextAlign() {
      this.scheduleRender();
    },
    'model.color': function modelColor() {
      this.changeImgColor();
    },
    'model.effectStyle': {
      handler: function handler(val, oldVal) {
        var _this5 = this;

        if (val.effectFontId !== oldVal.effectFontId) {
          this.loadFonts().then(function () {
            _this5.scheduleRender(null, true);
          });
        } else {
          this.scheduleRender(null, true);
        }
      },
      deep: true
    },
    'model.fontSize': function modelFontSize(val, oldVal) {
      // 行为同步自 text-element
      var model = this.model,
          options = this.options,
          syncRect = this.syncRect,
          $textResizeMeta = this.$textResizeMeta,
          $events = this.$events;
      var parentModel = this.$parent.model;
      var isAutoGroup = isGroup(parentModel) && parentModel.autoGrow;

      if (options.mode === 'preview') {
        return;
      }

      if (!model.$editing && !$textResizeMeta) {
        model.contents = model.contents.map(function (item) {
          return _extends({}, item, {
            fontSize: val
          });
        });
      } // fontSize 如果是单行文字的，修改字体则不需要再次计算


      if ($textResizeMeta || model.$singleText) {
        // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算
        // return 不做任何处理， 否则会抖动
        model.$singleText = false;
        !isAutoGroup && syncRect();
        return;
      } // 文本框处于自增组中时，其 model 尺寸交由父级 group 计算


      if (isAutoGroup) {
        var ratio = val / oldVal || 1;
        $events.$emit('group.contentScale', parentModel, ratio);
        syncRect();
        return;
      } // 基于 textAlign 元素本身进行对齐


      if (model.autoScale) {
        var _ratio = val / oldVal || 1;

        var tempWidth = model.width,
            tempHeight = model.height;
        var width = tempWidth * _ratio;
        model.letterSpacing *= _ratio; // 跟随textAlign做位置调整

        if (model.textAlign === 'center') {
          model.left -= (width - tempWidth) / 2;
        } else if (model.textAlign === 'right') {
          model.left -= width - tempWidth;
        }

        model.width = width;
        model.height = tempHeight * _ratio;

        if (isGroup(parentModel)) {
          // 手动赋值了 model 的 width、height，syncRect 时小概率无法触发 updateRect
          // 需手动触发 element.rectUpdate 同步 group 更新
          $events.$emit('element.rectUpdate', model, {
            width: model.width - tempWidth,
            height: model.height - tempHeight
          });
          syncRect();
        }
      }

      this.scheduleRender();
    },
    'model.width': function modelWidth() {
      if (!this.isDesignMode || !this.isLockRatioResize) return;
      var resizeRatio = this.resizeStartRatio;
      var width = this.model.width / resizeRatio;
      var height = this.canvas.height * width / this.canvas.width;
      var marginRatio = width / this.model.image.width;
      var _this$model$image$off = this.model.image.offset,
          x = _this$model$image$off.x,
          y = _this$model$image$off.y;
      this.canvas.style.width = width + "px";
      this.canvas.style.height = height + "px";
      this.canvas.style.marginLeft = x * marginRatio + "px";
      this.canvas.style.marginTop = y * marginRatio + "px";
    },
    'model.image': {
      handler: function handler() {
        var _this6 = this;

        if (!this.isDesignMode && this.model.image.url) {
          this.loadImage().then(function (img) {
            _this6.renderToCanvas(img);
          });
        }
      },
      deep: true
    }
  },
  events: {
    'element.transformStart': function elementTransformStart(model, _ref2) {
      var _this7 = this;

      var action = _ref2.action,
          dir = _ref2.dir;
      if (action !== 'resize' || !this.isDesignMode) return;
      var modelMatched = model === this.model;

      if (!modelMatched && (isGroup(model) || model.type === '$selector')) {
        modelMatched = model.elements.some(function (elem) {
          return elem === _this7.model;
        });
      }

      if (!modelMatched) return;
      this.resizing = true;
      this.isLockRatioResize = ['se', 'nw', 'sw', 'ne'].indexOf(dir) > -1;
      this.resizeStartRatio = this.model.width / parseFloat(this.canvas.style.width);
    },
    'element.transformEnd': function elementTransformEnd(model, drag, _ref3) {
      var _this8 = this;

      var action = _ref3.action;
      if (action !== 'resize') return;
      var modelMatched = model === this.model;

      if (!modelMatched && (isGroup(model) || model.type === '$selector')) {
        modelMatched = model.elements.some(function (elem) {
          return elem === _this8.model;
        });
      }

      if (!modelMatched) return;
      this.resizing = false;
      this.scheduleRender(function () {
        _this8.isLockRatioResize = false;
      });
    }
  },
  mounted: function mounted() {
    var _this9 = this;

    this.syncRect();
    this.canvas = this.$el.querySelector('canvas');
    this.ctx2D = this.canvas.getContext('2d'); // 如果没有特效图，则进行第一次渲染出图

    if (!this.model.image || !this.model.image.url) {
      this.load().then(function () {
        _this9.scheduleRender();
      });
    } else {
      // 由于风格化渲染需要发起请求，获取渲染结果图
      // 在请求期间可能会产生多次的历史记录，导致撤销/重做时图片与 model 不一致
      // 目前无法纯粹在风格化内单独处理历史记录的更新（addElement, changeElement 等会全局处理历史记录）
      // 因此，我们缓存渲染的结果，在撤销/重做时读取缓存覆盖掉历史记录，以保证准确性
      var textsData = this.getTextsData();
      var cache = this.getCache(textsData);

      if (cache) {
        this.restoreCacheData(textsData, cache);
      } else {
        this.loadImage().then(function (img) {
          _this9.renderToCanvas(img);

          _this9.changeImgColor();

          _this9.lastRenderedTextsData = textsData;
        });
      }
    }
  }
});