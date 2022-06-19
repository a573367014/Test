import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";

var AudioModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(AudioModel, _BaseModel);

  function AudioModel(data) {
    var _this;

    if (typeof data.duration !== 'number' && typeof data.naturalDuration !== 'number') {
      throw new Error('Audio 元素缺少 duration 或 naturalDuration 属性');
    }

    _this = _BaseModel.call(this, data) || this;

    if (!_this.naturalDuration && _this.duration) {
      _this.naturalDuration = Math.round(_this.duration * 1000);
    }

    _this.endTime = Math.min(_this.endTime || _this.naturalDuration, _this.naturalDuration);
    delete _this.duration;
    return _this;
  }

  return AudioModel;
}(BaseModel);

export default AudioModel;