import _createClass from "@babel/runtime/helpers/createClass";
import _pick from "lodash/pick";
import paper from 'paper';
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { PaperOffset } from "./paper-offset";
import { getRectRenderRadius, modelColorToPaperColor } from "./utils";
export var PathRenderer = /*#__PURE__*/function () {
  function PathRenderer(model, canvas) {
    this._paper = void 0;
    this._model = void 0;
    this._canvas = void 0;
    this._strokeBounds = void 0;
    this._path = void 0;
    this._offsetPath = void 0;
    if (!canvas) canvas = createCanvas(model.width, model.height);

    var _paper = new paper.PaperScope();

    _paper.setup(canvas);

    paper.settings.insertItems = false;
    _paper.view.autoUpdate = false;
    this._paper = _paper;
    this._model = model;
    this._canvas = canvas;
  }
  /**
   * 可视尺寸
   */


  var _proto = PathRenderer.prototype;

  _proto.getStrokeBounds = function getStrokeBounds() {
    var _model = this._model,
        _paper = this._paper;
    var strokeType = _model.$currentPathEffect.lineType;

    var _path = new _paper.Path(_model.path);

    if (_model.isRect()) _path = _path.toShape(false).set({
      radius: getRectRenderRadius(_model)
    }).toPath(false);
    this._path = _path.set({
      fillColor: modelColorToPaperColor(_model),
      strokeWidth: _model.$currentPathEffect.width,
      strokeColor: _model.$currentPathEffect.color
    });
    var strokeBounds = this._path.strokeBounds;

    if (strokeType !== 'center') {
      var offset = _model.$currentPathEffect.width / 2 * (strokeType === 'inner' ? -1 : 1);
      this._offsetPath = PaperOffset.offset(this._path, offset, {
        insert: false
      });
      strokeBounds = this._offsetPath.strokeBounds;
    } // 用padding -> 1px解决1px像素边界问题


    strokeBounds.left--;
    strokeBounds.top--;
    strokeBounds.width += 2;
    strokeBounds.height += 2;
    return this._strokeBounds = _pick(strokeBounds, ['left', 'top', 'width', 'height']);
  }
  /**
   * 同步画布尺寸
   * 画布padding:1px解决1px像素问题
   */
  ;

  _proto.syncSize = function syncSize() {
    var _this$getStrokeBounds = this.getStrokeBounds(),
        width = _this$getStrokeBounds.width,
        height = _this$getStrokeBounds.height;

    this._paper.view.viewSize = new paper.Size(width, height);
  };

  _proto.render = function render(zoom) {
    if (zoom === void 0) {
      zoom = 1;
    }

    this._path = null;
    this._offsetPath = null;

    this._paper.view.scale(1 / this._paper.view.zoom * zoom, new this._paper.Point(0, 0));

    this.syncSize();
    var _paper = this._paper,
        _strokeBounds = this._strokeBounds;

    _paper.project.activeLayer.removeChildren();

    var renderPath = this._offsetPath || this._path;

    _paper.project.activeLayer.addChild(renderPath);

    var left = _strokeBounds.left,
        top = _strokeBounds.top;
    _paper.view.matrix.tx = -left;
    _paper.view.matrix.ty = -top;

    if (!this._model.isLine()) {
      this._canvas.style.transform = "translate(" + left + "px," + top + "px)";
    }

    _paper.view.update();

    return this;
  };

  _createClass(PathRenderer, [{
    key: "strokeBounds",
    get: function get() {
      return this._strokeBounds;
    }
  }, {
    key: "canvas",
    get: function get() {
      var _window;

      var canvas = this._canvas;
      var scale = 1 / (((_window = window) === null || _window === void 0 ? void 0 : _window.devicePixelRatio) || 1);
      if (scale === 1) return this._canvas;
      var c = createCanvas(canvas.width * scale, canvas.height * scale);
      c.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, c.width, c.height);
      return c;
    }
  }]);

  return PathRenderer;
}();