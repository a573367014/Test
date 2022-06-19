import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";

var ninePatchModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(ninePatchModel, _BaseModel);

  function ninePatchModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;

    if (data.stretchPoint) {
      var stretchPoint = data.stretchPoint,
          originWidth = data.originWidth,
          originHeight = data.originHeight;
      _this.imageSlice = {
        left: stretchPoint.x,
        top: stretchPoint.y,
        right: originWidth - stretchPoint.x - 1,
        bottom: originHeight - stretchPoint.y - 1
      };
      delete _this.stretchPoint;
    }

    return _this;
  }

  return ninePatchModel;
}(BaseModel);

export default ninePatchModel;