import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _extends from "@babel/runtime/helpers/extends";
import _throttle from "lodash/throttle";
import _get from "lodash/get";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

import _regeneratorRuntime from "@babel/runtime/regenerator";
import Promise from 'bluebird';
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import { adaptationImageTransform } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import { uuid } from "@gaoding/editor-utils/lib/string";
import { decodeGifOrApng } from "@gaoding/editor-framework/lib/utils/gif-utils";
import ImageRenderer from "@gaoding/editor-framework/lib/utils/renderer/image";
import { initMaskInfo, debounceUpdateMaskInfo } from "@gaoding/editor-framework/lib/static/mask-wrap/utils";
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { getCurrentFrame } from "@gaoding/editor-utils/lib/animation-image";

var isEqId = function isEqId(a, b) {
  return _get(a, '$id') === _get(b, '$id');
}; // 缓存解析好的动图帧数据


var cacheAnimationImgData = new Map();
export default inherit(BaseElement, {
  props: ['global', 'model', 'options', 'editor'],
  data: function data() {
    return {
      canvasRendered: false,
      lazyRendering: false,
      isFirstRendered: false,
      imageUrlCache: '',
      usePlaceholder: false // rendering: false,

    };
  },
  computed: {
    zoom: function zoom() {
      return this.global.zoom;
    },
    isGif: function isGif() {
      return this.model.url && (this.model.isGif || this.model.isApng);
    },
    imageUrl: function imageUrl() {
      var model = this.model,
          options = this.options;
      return utils.getComputedUrl(model.imageUrl, options.fitCrossOrigin);
    },
    mainStyle: function mainStyle() {
      var padding = this.padding,
          borderRadius = this.borderRadius,
          readyToDrop = this.readyToDrop,
          visible = this.visible,
          imageInsideDropArea = this.imageInsideDropArea;
      return {
        padding: padding,
        borderRadius: borderRadius,
        overflow: visible,
        opacity: readyToDrop ? imageInsideDropArea ? 0 : 0.3 : 1
      };
    },
    maskStyle: function maskStyle() {
      if (this.isGif && this.isMask || this.isVideo && this.model.mask) {
        return {
          maskImage: "url(" + this.model.mask + ")",
          maskSize: '100% 100%'
        };
      }

      return null;
    },
    cssStyle: function cssStyle() {
      var rect = this.rect;
      var padding = rect.padding;
      var maskStyle = {};
      return _extends({
        height: rect.height + padding[0] + padding[2] + 'px',
        width: rect.width + padding[1] + padding[3] + 'px',
        transform: this.transform.toString(),
        left: rect.left + 'px',
        top: rect.top + 'px',
        opacity: this.opacity
      }, maskStyle);
    },
    effectedImageRect: function effectedImageRect() {
      var model = this.model,
          global = this.global;
      return this.hasEffects && !this.isNeedRenderAnimatioFrame ? {
        width: model.effectedResult.width * global.zoom,
        height: model.effectedResult.height * global.zoom,
        left: model.effectedResult.left * global.zoom,
        top: model.effectedResult.top * global.zoom
      } : {
        width: model.width * global.zoom,
        height: model.height * global.zoom,
        left: 0,
        top: 0
      };
    },
    effectedImageStyle: function effectedImageStyle() {
      var model = this.model,
          effectedImageRect = this.effectedImageRect,
          rect = this.rect;
      var top = effectedImageRect.top,
          left = effectedImageRect.left,
          width = effectedImageRect.width,
          height = effectedImageRect.height;
      var style = {
        position: 'absolute',
        width: width + 'px',
        height: height + 'px',
        left: left + 'px',
        top: top + 'px'
      };

      if (model.$imageDraging && this.isMask) {
        Object.assign(style, {
          width: rect.width + 'px',
          height: rect.height + 'px',
          left: 0,
          top: 0
        });
      }

      return style;
    },
    hasEffects: function hasEffects() {
      return this.model.hasEffects && this.model.url;
    },
    hasFilters: function hasFilters() {
      return this.model.hasFilters;
    },
    linkSelected: function linkSelected() {
      var element = this.editor.currentSubElement || this.editor.currentElement || {};
      return this.isLinkWith(element);
    },
    enableImageRenderer: function enableImageRenderer() {
      return this.model.$enableImageRenderer;
    },
    imageRenderer: function imageRenderer() {
      if (!this._imageRenderer) {
        this._imageRenderer = this.createRenderer();
      }

      return this._imageRenderer;
    },
    imageWrapStyle: function imageWrapStyle() {
      var _this$model = this.model,
          naturalWidth = _this$model.naturalWidth,
          naturalHeight = _this$model.naturalHeight,
          width = _this$model.width,
          height = _this$model.height;
      return {
        position: 'absolute',
        left: -(naturalWidth - width) / 2 * this.zoom + 'px',
        top: -(naturalHeight - height) / 2 * this.zoom + 'px'
      };
    },
    imageStyle: function imageStyle() {
      var _this$model2 = this.model,
          imageTransform = _this$model2.imageTransform,
          naturalWidth = _this$model2.naturalWidth,
          naturalHeight = _this$model2.naturalHeight;

      var _imageTransform$toJSO = imageTransform.toJSON(),
          a = _imageTransform$toJSO.a,
          b = _imageTransform$toJSO.b,
          c = _imageTransform$toJSO.c,
          d = _imageTransform$toJSO.d,
          tx = _imageTransform$toJSO.tx,
          ty = _imageTransform$toJSO.ty;

      return {
        position: 'absolute',
        width: Math.max(1, naturalWidth * this.zoom) + 'px',
        height: Math.max(1, naturalHeight * this.zoom) + 'px',
        transform: "matrix(" + a + "," + b + "," + c + "," + d + "," + tx * this.zoom + "," + ty * this.zoom + ")"
      };
    },

    /**
     * 是否需要渲染帧画面(平面编辑器直接渲染整个动图，剪辑编辑器需要手动渲染帧画面)
     */
    isNeedRenderAnimatioFrame: function isNeedRenderAnimatioFrame() {
      return this.isGif && this.model.$needRenderFrame;
    }
  },
  watch: {
    model: function model() {
      this.imageRenderer && this.imageRenderer.updateModel(this.model);
    },
    isGif: function isGif(v) {
      if (v) {
        this.canvasRendered = false;
      }
    },
    'model.imageEffects': {
      deep: true,
      handler: function handler() {
        if (this.editor.global.$draging) return;
        this.lazyRender();
      }
    },
    'model.shadows': {
      deep: true,
      handler: function handler() {
        if (this.editor.global.$draging) return;
        this.lazyRender();
      }
    },
    'model.filter': {
      deep: true,
      handler: function handler() {
        if (this.editor.global.$draging) return;
        this.lazyRender();
      }
    },
    'model.filterInfo': {
      deep: true,
      handler: function handler() {
        if (this.editor.global.$draging) return;
        this.lazyRender();
      }
    },
    'model.$currentTime': function model$currentTime() {
      if (this.canvasRendered && this.isNeedRenderAnimatioFrame) {
        this.renderAnimationImage();
      }
    }
  },
  methods: {
    loadGifOrApng: function loadGifOrApng() {
      var _this = this;

      var model = this.model;

      if (this.isNeedRenderAnimatioFrame) {
        this.canvasRendered = true;
        return this.loadAnimationImgData(this.model.url).then(function (result) {
          _this.model.naturalDuration = result.duration;
          _this.model.$frames = result.frames; // 如果不存在 startTime 与 endTime，则重新设置

          if (typeof _this.model.startTime !== 'number' || typeof _this.model.endTime !== 'number') {
            _this.model.startTime = 0;
            _this.model.endTime = result.duration;
          }

          _this.renderAnimationImage();
        });
      }

      return Promise.try(function () {
        if (!_this.isPreviewMode && (model.isGif || model.isApng)) {
          return decodeGifOrApng(_this.model).then(function (result) {
            _this.model.naturalDuration = result.duration;

            if (!result.duration) {
              _this.model.resourceType = 'image';
            }
          });
        }
      }).catch(console.warn);
    },
    baseLoad: function baseLoad() {
      var _this2 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var _yield$_this2$imageRe, originalImg, res;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this2.imageRenderer.load();

              case 2:
                _yield$_this2$imageRe = _context.sent;
                originalImg = _yield$_this2$imageRe[0];
                originalImg && _this2.initDataByImg(originalImg);
                _context.next = 7;
                return _this2.render({
                  force: true
                });

              case 7:
                res = _context.sent;
                _context.next = 10;
                return initMaskInfo(_this2.model, _this2.editor);

              case 10:
                return _context.abrupt("return", res);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    render: function render(imageOptions) {
      if (imageOptions === void 0) {
        imageOptions = {};
      }

      if (this.isGif || this.isVideo) return;
      return this.imageRenderer.render(_extends({
        resizeByPica: this.options.picaResizeEnable
      }, imageOptions));
    },
    lazyRender: function lazyRender(imageOptions) {
      if (imageOptions === void 0) {
        imageOptions = {};
      }

      if (this.isGif || this.isVideo) return;
      var needCanvasRender = this.hasEffects || this.hasFilters || this.canvasRendered;

      if (!this.isDesignMode || this.isImage && !needCanvasRender || !this.enableImageRenderer) {
        return;
      }

      if (this.hasFilters || this.hasEffects) {
        return this.imageRenderer.lazyRender(_extends({
          resizeByPica: this.options.picaResizeEnable
        }, imageOptions));
      }

      return this.render(imageOptions);
    },
    lazyRenderByCanvas: function lazyRenderByCanvas(canvas, inputCanvas, zoom) {
      var _this3 = this;

      if (!this._lazyRenderByCanvas) {
        this._lazyRenderByCanvas = _throttle(function () {
          var _this3$imageRenderer;

          (_this3$imageRenderer = _this3.imageRenderer).renderByCanvas.apply(_this3$imageRenderer, arguments);
        }, 1000, {
          trailing: true
        });
      }

      this._lazyRenderByCanvas(canvas, inputCanvas, zoom);
    },
    createRenderer: function createRenderer() {
      var editor = this.editor;
      var imageRenderer = editor.$renderers.get(this.model.$id);

      if (imageRenderer && this.isPreviewMode) {
        editor.$renderers.count(this.model.$id);
        return imageRenderer;
      }

      if (imageRenderer) {
        editor.$renderers.count(this.model.$id);
        imageRenderer.updateModel(this.model);
      } else {
        imageRenderer = editor.$renderers.create(this.model.$id, new ImageRenderer({
          model: this.model,
          byNaturalSize: !!this.isBackground,
          editor: editor
        }));
      }

      return imageRenderer;
    },
    initDataByImg: function initDataByImg(originalImg) {
      if (this.isBackground) return;
      adaptationImageTransform(this.model, originalImg);
      this.model.naturalWidth = originalImg.naturalWidth;
      this.model.naturalHeight = originalImg.naturalHeight;
      this.model.setClipCache();
    },

    /**
     * 加载动态贴纸数据并缓存
     * @param { String } url - apng | gif图片地址
     * @returns { Promise<{ frames: Array<Frame>, width: Number, height: Number, duration: Number }> }
     */
    loadAnimationImgData: function loadAnimationImgData(url) {
      var _this4 = this;

      if (cacheAnimationImgData.has(url)) {
        var data = cacheAnimationImgData.get(url);
        return Promise.resolve(data);
      } else {
        return decodeGifOrApng(this.model, {
          needBuffer: true
        }).then(function (result) {
          var width = result.width,
              height = result.height,
              duration = result.duration,
              frames = result.frames;
          var imageFrames = []; // 帧延迟时间

          var frameDelay = 0;

          for (var _iterator = _createForOfIteratorHelperLoose(frames), _step; !(_step = _iterator()).done;) {
            var frame = _step.value;

            // 一帧的时长
            var _duration = _this4.model.isGif ? frame.delay * 10 : frame.delay;

            var buffer = new Uint8ClampedArray(frame.buffer);
            var imageData = new ImageData(buffer, width, height);
            var canvas = createCanvas(width, height);
            var context = canvas.getContext('2d');
            context.putImageData(imageData, 0, 0);
            var frameData = {
              canvas: canvas,
              duration: _duration,
              delay: frameDelay
            };
            imageFrames.push(frameData);
            frameDelay += _duration;
          }

          var data = {
            width: width,
            height: height,
            duration: duration,
            frames: imageFrames
          };
          cacheAnimationImgData.set(url, data);
          return data;
        });
      }
    },

    /**
     * 渲染动态贴纸当前帧
     */
    renderAnimationImage: function renderAnimationImage() {
      var _this$model3 = this.model,
          $frames = _this$model3.$frames,
          $currentTime = _this$model3.$currentTime,
          naturalDuration = _this$model3.naturalDuration,
          loop = _this$model3.loop,
          $imageTop = _this$model3.$imageTop,
          $imageLeft = _this$model3.$imageLeft,
          width = _this$model3.width,
          height = _this$model3.height,
          imageTransform = _this$model3.imageTransform;
      var frame = getCurrentFrame($frames, $currentTime, naturalDuration, loop);

      if (frame) {
        var canvas = this.$refs.canvas;

        if (canvas) {
          var w = Math.round(width);
          var h = Math.round(height);
          canvas.width = w;
          canvas.height = h;
          var context = canvas.getContext('2d');
          context.clearRect(0, 0, w, h); // 支持裁剪

          var _imageTransform$scale = imageTransform.scale,
              scaleX = _imageTransform$scale.x,
              scaleY = _imageTransform$scale.y;
          var sx = Math.abs(Math.round($imageLeft)) / scaleX;
          var sy = Math.abs(Math.round($imageTop)) / scaleY;
          var sWidth = Math.round(w / scaleX);
          var sHeight = Math.round(h / scaleY);
          context.drawImage(frame.canvas, sx, sy, sWidth, sHeight, 0, 0, w, h);
        }
      }
    }
  },
  mounted: function mounted() {
    var _this5 = this;

    // 最小尺存限制
    this.model.$resizeLimit = true;

    this.model.$getResizeLimit = function () {
      return {
        maxWidth: Infinity,
        minWidth: 10,
        maxHeight: Infinity,
        minHeight: 10
      };
    }; // 数据源变更时重绘


    this.$watch(function () {
      return _this5.model.url + _this5.model.mask;
    }, function () {
      if (!_this5.isDesignMode) {
        _this5.usePlaceholder && _this5.checkLoad();
        return;
      }

      _this5.$nextTick(function () {
        _this5.model.imageUrl = '';

        _this5.imageRenderer.lazyRenderCancel();

        _this5.checkLoad();
      });
    }); // 参数变更时触发重绘

    this.$watch(function () {
      var _this5$model = _this5.model,
          width = _this5$model.width,
          height = _this5$model.height,
          scale = _this5$model.imageTransform.scale;
      return [width, height, scale.x, scale.y].join(' ');
    }, function () {
      if (!_this5.isDesignMode || _this5.editor.global.$draging) return;

      _this5.model.setClipCache();
    });
    this.$watch(function () {
      return _this5.model.$renderProps;
    }, function () {
      if (_this5.isGif || _this5.isVideo) return;
      var needCanvasRender = _this5.hasEffects || _this5.hasFilters || _this5.canvasRendered;

      if (!_this5.isDesignMode || _this5.isImage && !needCanvasRender || !_this5.enableImageRenderer) {
        return;
      }

      debounceUpdateMaskInfo(_this5.model, _this5.editor);
    }, {
      deep: true
    });
  },
  events: {
    'element.editApply': function elementEditApply(model) {
      var _this6 = this;

      if (model.$id !== this.model.$id || this.isMask && model.type !== '$masker' || this.isImage && model.type !== '$croper' || !this.hasEffects && !this.hasFilters) {
        return;
      }

      this.$nextTick(function () {
        _this6.lazyRender();
      });
    },
    'element.dragStart': function elementDragStart(model) {
      if (model !== this.model) return;
      this.lazyRendering = false;
    },
    'element.transformStart': function elementTransformStart(model) {
      if (model !== this.model) return;
      this.lazyRendering = false;
    },
    'element.transformEnd': function elementTransformEnd(model, drag, _ref) {
      var action = _ref.action;
      // const isNotRerender = this.isImage && !this.hasEffects && this.hasFilters;
      if (model !== this.model || action !== 'resize') return;
      this.lazyRender({
        force: this.options.supportAdaptiveElements.includes(model.type)
      });
    },
    'element.imageTransformStart': function elementImageTransformStart(model) {
      if (model !== this.model || !this.isDesignMode || !this.isMask) return;
      this.lazyRendering = false;
      this.render({
        resizeByPica: false,
        renderFilter: false,
        renderEffect: false
      });
    },
    'element.imageTransformEnd': function elementImageTransformEnd(model) {
      if (model !== this.model) return;
      this.lazyRender({
        force: true
      });
    },
    'element.change': function elementChange(model, propName) {
      var _this7 = this;

      if (propName === 'url' && this.isLinkWith(model) && this.model.url !== model.url) {
        // this._eventChange = true;
        var url = model.url;
        utils.loadImage(url, this.options.fitCrossOrigin, true).then(function (image) {
          var _this7$editor$options;

          var width = image.width,
              height = image.height;
          var _this7$model = _this7.model,
              elementWidth = _this7$model.width,
              elementHeight = _this7$model.height;
          var ratio = Math.max(elementWidth / width, elementHeight / height);
          var clipSize = [width * ratio, height * ratio];
          var props = {
            url: model.url,
            imageUrl: '',
            $imageWidth: clipSize[0],
            $imageHeight: clipSize[1],
            $imageLeft: (elementWidth - clipSize[0]) / 2,
            $imageTop: (elementHeight - clipSize[1]) / 2
          };

          _this7.editor.changeElement(props, _this7.model, false);

          (_this7$editor$options = _this7.editor.options) === null || _this7$editor$options === void 0 ? void 0 : _this7$editor$options.changeMetaInfoHook({
            oldElement: model,
            newElement: _this7.model,
            type: 'replace'
          });
        });
      }
    },
    'imageRenderer.renderBefore': function imageRendererRenderBefore(model) {
      var _this8 = this;

      if (!this.isDesignMode || !isEqId(model, this.model) || this.isVideo) return;
      this.imageUrlCache = this.canvasRendered ? '' : this.model.imageUrl;
      this.model.imageUrl = '';

      if (this.isFirstRendered || !this.$renderId) {
        this.model.$renderId = uuid();
      }

      this.isFirstRendered = true; // 延迟 400 毫秒在出现 loading

      clearTimeout(this._renderingTimer);
      this._renderingTimer = setTimeout(function () {
        _this8.lazyRendering = true;
      }, 400);
    },
    'imageRenderer.renderEffectAfter': function imageRendererRenderEffectAfter(model, effectModel) {
      if (!isEqId(model, this.model)) return;
      Object.assign(this.model, effectModel);
    },
    'imageRenderer.renderAfter': function imageRendererRenderAfter(model) {
      var _this9 = this;

      if (!isEqId(model, this.model)) return;
      this.canvasRendered = true;
      this.lazyRendering = false;
      this.imageUrlCache = '';
      clearTimeout(this._renderingTimer);
      var zoom = 1;

      if (this.isPreviewMode) {
        var ratio = Math.min(1, model.naturalWidth / model.$imageWidth, model.naturalHeight / model.$imageHeight) / window.devicePixelRatio;
        zoom = Math.min(1, this.zoom / ratio);
      }

      this.$nextTick(function () {
        if (_this9.isPreviewMode) {
          _this9.lazyRenderByCanvas(_this9.$refs.canvas, _this9.imageRenderer.canvas, zoom);
        } else {
          _this9.imageRenderer.renderByCanvas(_this9.$refs.canvas, _this9.imageRenderer.canvas);
        }
      });
    }
  },
  beforeDestroy: function beforeDestroy() {
    this._lazyRenderByCanvas && this._lazyRenderByCanvas.cancel();
    this.editor.$renderers.destory(this.model.$id);
  }
});