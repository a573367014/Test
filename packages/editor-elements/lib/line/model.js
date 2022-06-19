import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";

var lineModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(lineModel, _BaseModel);

  function lineModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.stroke = hexaToRgba(_this.stroke);
    _this.fill = hexaToRgba(_this.fill);
    _this.height = _this.strokeWidth;
    return _this;
  }

  return lineModel;
}(BaseModel);

export default lineModel;