import _createClass from "@babel/runtime/helpers/createClass";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import { pathsToSvg, svgToPaths } from "@gaoding/editor-utils/lib/svg-path";

var brushModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(brushModel, _BaseModel);

  function brushModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.color = hexaToRgba(_this.color);
    return _this;
  }

  _createClass(brushModel, [{
    key: "$paths",
    get: function get() {
      return svgToPaths(this.path);
    },
    set: function set(v) {
      this.path = pathsToSvg(v);
    }
  }]);

  return brushModel;
}(BaseModel);

export default brushModel;