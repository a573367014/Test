import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";

var ChartModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(ChartModel, _BaseModel);

  function ChartModel(data) {
    var _this;

    if (typeof data.title === 'object' && !data.chartTitle) {
      data.chartTitle = data.title;
      delete data.title;
    }

    _this = _BaseModel.call(this, data) || this;
    _this.$loaded = false; // init colorType

    _this.colorType = _this.colorType || 0;
    _this.scales = _this.scales || {};
    return _this;
  }

  return ChartModel;
}(BaseModel);

export { ChartModel as default };