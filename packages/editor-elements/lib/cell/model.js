import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";

/**
 * CellModel
 */
import BaseElementModel from "@gaoding/editor-framework/lib/base/element-base-model";

var CellModel = /*#__PURE__*/function (_BaseElementModel) {
  _inheritsLoose(CellModel, _BaseElementModel);

  function CellModel(data) {
    var _this;

    _this = _BaseElementModel.call(this, data) || this; // 初始化拼图cell元素

    _this.$active = false;
    _this.$loaded = false;
    _this.$activeSide = '';
    _this.offset = data.offset || {
      x: 0,
      y: 0
    };
    _this.zoom = data.zoom || 1;
    _this.rotate = Math.round(_this.rotate, 10); // 避免transform计算带来的小数误差，如-270可能会变成90.0000...1

    return _this;
  }

  return CellModel;
}(BaseElementModel);

export { CellModel as default };