import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

import _regeneratorRuntime from "@babel/runtime/regenerator";
import Promise from 'bluebird';
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { drawPath, toRadian } from "./index";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import { createPromiseQueue } from "@gaoding/editor-framework/lib/utils/three-text/utils/promise-queue";
import { getEffectsAndShadows } from "@gaoding/editor-utils/lib/effect/adaptor";
var canvas1 = createCanvas();
var canvas2 = createCanvas();
var canvas3 = createCanvas();
var timeOut = 20000;
var promiseQueue = createPromiseQueue({
  timeout: timeOut
});

var FontEffect = /*#__PURE__*/function () {
  function FontEffect(_ref) {
    var inputCtx = _ref.inputCtx,
        outputCtx = _ref.outputCtx,
        paths = _ref.paths,
        pathOffset = _ref.pathOffset,
        model = _ref.model,
        _ref$mode = _ref.mode,
        mode = _ref$mode === void 0 ? 'design' : _ref$mode,
        _ref$devicePixelRatio = _ref.devicePixelRatio,
        devicePixelRatio = _ref$devicePixelRatio === void 0 ? window.devicePixelRatio : _ref$devicePixelRatio;
    this.paths = paths;
    this.pathOffset = pathOffset;
    this.inputCtx = inputCtx;
    this.inputCanvas = inputCtx.canvas;
    this.outputCtx = outputCtx;
    this.outputCanvas = outputCtx.canvas;
    this.offCanvas = canvas1;
    this.effectCanvas = canvas2;
    this.temCanvas = canvas3;
    this.model = model; // 设计渲染队列的请求发起方识别,如果不加 mode 会导致，会导致多模式下同一元素的渲染请求只会保留一个

    this.id = model.$id + mode;
    this.devicePixelRatio = devicePixelRatio; // 渲染过程 inputCanvas -> temCanvas -> effectCanvas -> offCanvas -> outputCanvas

    this.offCtx = this.offCanvas.getContext('2d');
    this.effectCtx = this.effectCanvas.getContext('2d');
    this.temCtx = this.temCanvas.getContext('2d');
  }

  var _proto = FontEffect.prototype;

  _proto.init = function init() {
    this.width = this.inputCanvas.width;
    this.height = this.inputCanvas.height;
    this.outputCanvas.width = this.temCanvas.width = this.offCanvas.width = this.effectCanvas.width = this.width;
    this.outputCanvas.height = this.temCanvas.height = this.offCanvas.height = this.effectCanvas.height = this.height;
  };

  _proto.load = function load() {
    var _this = this;

    var urls = [];
    this._imgsMap = {}; // 加载图案填充的图

    this.model.textEffects.forEach(function (effect) {
      var url = effect.filling && effect.filling.enable && [1, 'image'].includes(effect.filling.type) && effect.filling.imageContent.image;
      url && urls.push(url);
    });
    return Promise.map(urls, utils.loadImage).then(function (imgs) {
      imgs.forEach(function (img, i) {
        _this._imgsMap[urls[i]] = img;
      });
    });
  };

  _proto.draw = /*#__PURE__*/function () {
    var _draw = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var _this2 = this;

      var _getEffectsAndShadows, shadows, effects;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.load();

            case 2:
              this.init();
              _getEffectsAndShadows = getEffectsAndShadows(this.model), shadows = _getEffectsAndShadows.shadows, effects = _getEffectsAndShadows.effects;
              shadows.forEach(function (sh) {
                // 存在 type 字段，且不是基础投影的不渲染
                if (sh.type && sh.type !== 'base') {
                  return;
                }

                _this2.shadow(sh);

                _this2.offCtx.drawImage(_this2.effectCanvas, 0, 0); // effectCanvas(单个特效) -> offsetCanvas(单层特效)


                _this2._clearRect(_this2.effectCtx);

                _this2.transform();

                _this2._clearRect(_this2.offCtx);
              });

              if (effects.length > 0) {
                effects.forEach(function (effect) {
                  ['filling', 'stroke'].forEach(function (key) {
                    var item = effect[key];

                    if (item && item.enable && _this2[key]) {
                      _this2[key](item); // inputCanvas -> tempCanvas ->effectCanvas


                      _this2.offCtx.drawImage(_this2.effectCanvas, 0, 0); // effectCanvas(单个特效) -> offsetCanvas(单层特效)


                      _this2._clearRect(_this2.effectCtx);
                    } // 没有填充色的话用原本颜色


                    if (item && key === 'filling' && !item.enable) {
                      _this2.offCtx.drawImage(_this2.inputCanvas, 0, 0);
                    }
                  });

                  _this2.transform(effect); // offectCanvas(单层特效) -> ouputCanvas(总体效果)


                  _this2._clearRect(_this2.offCtx);
                });
              } else {
                this.offCtx.drawImage(this.inputCanvas, 0, 0);
                this.transform();

                this._clearRect(this.offCtx);
              }

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function draw() {
      return _draw.apply(this, arguments);
    }

    return draw;
  }();

  _proto.render = /*#__PURE__*/function () {
    var _render = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt("return", promiseQueue.run(this.id, this.draw.bind(this)));

            case 1:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function render() {
      return _render.apply(this, arguments);
    }

    return render;
  }();

  _proto.transform = function transform(effect) {
    if (effect === void 0) {
      effect = {};
    }

    var ctx = this.outputCtx;
    var _effect = effect,
        _effect$skew = _effect.skew,
        skew = _effect$skew === void 0 ? {
      x: 0,
      y: 0
    } : _effect$skew,
        _effect$offset = _effect.offset,
        offset = _effect$offset === void 0 ? {
      x: 0,
      y: 0
    } : _effect$offset;
    ctx.save();
    ctx.setTransform(1, Math.tan(toRadian(skew.y)), Math.tan(toRadian(skew.x)), 1, offset.x * this.devicePixelRatio, offset.y * this.devicePixelRatio);
    ctx.drawImage(this.offCanvas, 0, 0);
    ctx.restore();
  };

  _proto.stroke = function stroke(_ref2) {
    var _this3 = this;

    var width = _ref2.width,
        color = _ref2.color;
    var ctx = this.temCtx;

    this._clearRect(ctx);

    ctx.save();
    ctx.translate(this.pathOffset.x, this.pathOffset.y);
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    ctx.miterLimit = 4 * this.devicePixelRatio;
    this.paths.forEach(function (path) {
      drawPath(ctx, path.commands, {
        strokeWidth: Math.round(width),
        strokeStyle: color,
        isOnlyStorke: true,
        offset: _this3.pathOffset
      });
    });
    ctx.restore(); // tempCanvas -> effectCanvas

    this.effectCtx.drawImage(this.temCanvas, 0, 0);
  };

  _proto.shadow = function shadow(option) {
    var ctx = this.temCtx;

    this._clearRect(ctx);

    ctx.save();
    ctx.shadowColor = option.color;
    ctx.shadowBlur = option.blur;
    ctx.shadowOffsetX = option.offsetX * this.devicePixelRatio + 10000;
    ctx.shadowOffsetY = option.offsetY * this.devicePixelRatio;
    ctx.drawImage(this.inputCanvas, -10000, 0);
    ctx.restore(); // tempCanvas -> effectCanvas

    this.effectCtx.drawImage(this.temCanvas, 0, 0);
  };

  _proto.filling = function filling(option) {
    var ctx = this.temCtx;

    this._clearRect(ctx);

    ctx.drawImage(this.inputCanvas, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'source-in';

    if ([0, 'color'].includes(option.type)) {
      this.fillingColor(ctx, option);
    } else if ([1, 'image'].includes(option.type)) {
      this.fillingImage(ctx, option);
    } else if ([2, 'gradient'].includes(option.type)) {
      this.fillingGradient(ctx, option);
    }

    ctx.restore(); // tempCanvas -> effectCanvas

    this.effectCtx.drawImage(this.temCanvas, 0, 0);
  };

  _proto.fillingColor = function fillingColor(ctx, option) {
    ctx.fillStyle = option.color;

    this._fillRect(ctx);
  };

  _proto.fillingGradient = function fillingGradient(ctx, option) {
    var w = this.width / 2;
    var h = this.height / 2;
    var radian = -toRadian(option.gradient.angle);
    var r = Math.abs(w * Math.sin(radian)) + Math.abs(h * Math.cos(radian));
    var linegrad = ctx.createLinearGradient(w - r * Math.cos(radian), h - r * Math.sin(radian), w + r * Math.cos(radian), h + r * Math.sin(radian));

    for (var _iterator = _createForOfIteratorHelperLoose(option.gradient.stops), _step; !(_step = _iterator()).done;) {
      var colorSet = _step.value;
      linegrad.addColorStop(colorSet.offset, colorSet.color);
    }

    ctx.fillStyle = linegrad;

    this._fillRect(ctx);
  };

  _proto.fillingImage = function fillingImage(ctx, option) {
    if (!option.imageContent.image) {
      return Promise.resolve();
    }

    var ptrn = ctx.createPattern(this._imgsMap[option.imageContent.image], 'repeat');
    ctx.fillStyle = ptrn;
    var _option$imageContent = option.imageContent,
        scaleX = _option$imageContent.scaleX,
        scaleY = _option$imageContent.scaleY;
    ctx.scale(scaleX, scaleY);

    this._fillRect(ctx, scaleX, scaleY);
  };

  _proto._fillRect = function _fillRect(ctx, scaleX, scaleY) {
    if (scaleX === void 0) {
      scaleX = 1;
    }

    if (scaleY === void 0) {
      scaleY = 1;
    }

    ctx.fillRect(0, 0, ctx.canvas.width / scaleX, ctx.canvas.height / scaleY);
  };

  _proto._clearRect = function _clearRect(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  return FontEffect;
}();

export { FontEffect as default };