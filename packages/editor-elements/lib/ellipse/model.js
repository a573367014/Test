import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";

var ellipseModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(ellipseModel, _BaseModel);

  function ellipseModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.stroke = hexaToRgba(_this.stroke);
    _this.fill = hexaToRgba(_this.fill);
    return _this;
  }

  return ellipseModel;
}(BaseModel);

export default ellipseModel;