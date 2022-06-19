import _createClass from "@babel/runtime/helpers/createClass";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import paper from 'paper';
import { isLinePath, isRectPath } from "./path-editor/utils";

function _fillUpPathData(data) {
  if (!data.pathEffects) {
    data.pathEffects = [{
      type: 'brush',
      enable: true,
      lineType: 'inner',
      color: '#666666',
      width: 0
    }];
  }

  if (!data.pathEffects[0].filling) {
    // 兼容转换fillColor字段
    data.pathEffects[0].filling = {
      type: 'color',
      enable: true,
      color: data.pathEffects[0].fillColor || ''
    };
    data.pathEffects[0].fillColor = null;
  }
}

var PathModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(PathModel, _BaseModel);

  function PathModel(data) {
    var _this;

    _fillUpPathData(data);

    _this = _BaseModel.call(this, data) || this;

    if (_this.path) {
      _this.$lookLike = _this.lookLike();
    }

    return _this;
  }

  var _proto = PathModel.prototype;

  _proto.scaleElement = function scaleElement(ratio) {
    if (ratio === void 0) {
      ratio = 1;
    }

    if (ratio === 1) return;
    this.$currentPathEffect.width = Math.round(this.$currentPathEffect.width * ratio);
    this.radius = Math.round(this.radius * ratio);
    var path = new paper.Path(this.path);
    path.scale(ratio, new paper.Point(0, 0));
    this.path = path.pathData;
  };

  _proto.getColors = function getColors() {
    var colors = [];
    this.$currentPathEffect.color && colors.push(this.$currentPathEffect.color);
    this.$currentPathEffect.filling && colors.push(this.$currentPathEffect.filling.gradient || this.$currentPathEffect.filling.color);
    return colors;
  };

  _proto.lookLike = function lookLike() {
    if (!paper.project) {
      paper.setup(new paper.Size(1, 1));
      paper.settings.insertItems = false;
    }

    var path = new paper.Path(this.path);
    if (isRectPath(path)) return 'rect';
    if (isLinePath(path)) return 'line';
  }
  /**
   * 是否为直线
   */
  ;

  _proto.isLine = function isLine() {
    return this.$lookLike === 'line';
  }
  /**
   * 是否为矩形
   */
  ;

  _proto.isRect = function isRect() {
    return this.$lookLike === 'rect';
  };

  _createClass(PathModel, [{
    key: "$currentPathEffect",
    get: function get() {
      return this.pathEffects[this.pathEffects.length - 1];
    }
  }, {
    key: "$fillColor",
    get: function get() {
      if (!this.$currentPathEffect.filling) return null;
      return this.$currentPathEffect.filling.gradient || this.$currentPathEffect.filling.color;
    }
  }]);

  return PathModel;
}(BaseModel);

export default PathModel;