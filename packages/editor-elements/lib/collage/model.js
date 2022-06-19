import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import CellModel from "../cell/model";

var CollageModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(CollageModel, _BaseModel);

  function CollageModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this; // 初始化拼图元素, 并实例子元素

    _this.$cellIndex = -1;
    _this.outerGap = data.outerGap || 0;
    _this.gap = data.gap || 0;
    _this.itemRoundness = data.itemRoundness || 0;

    if (_this.elements.length) {
      _this.elements = _this.elements.map(function (data) {
        var element = new CellModel(data);
        element.disableEditable();
        return element;
      });
    }

    return _this;
  }

  return CollageModel;
}(BaseModel);

export { CollageModel as default };