import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";

var rectModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(rectModel, _BaseModel);

  function rectModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.stroke = hexaToRgba(_this.stroke);
    _this.fill = hexaToRgba(_this.fill);
    return _this;
  }

  return rectModel;
}(BaseModel);

export default rectModel;