import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _forEach from "lodash/forEach";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";

var SvgModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(SvgModel, _BaseModel);

  function SvgModel(data) {
    var _this;

    if (data.iconType) {
      data.iconType = data.iconType.toLocaleLowerCase();
    }

    _this = _BaseModel.call(this, data) || this;

    var _assertThisInitialize = _assertThisInitialized(_this),
        colors = _assertThisInitialize.colors;

    _forEach(colors || [], function (value, key) {
      colors[key] = hexaToRgba(value);
    });

    return _this;
  }

  _createClass(SvgModel, [{
    key: "$renderProps",
    get: function get() {
      return [this.width, this.height, this.opacity, this.maskInfo.enable];
    }
  }]);

  return SvgModel;
}(BaseModel);

export default SvgModel;