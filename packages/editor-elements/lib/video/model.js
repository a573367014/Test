import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import ImageBaseModel from "../image-base-model";

var VideoModel = /*#__PURE__*/function (_ImageBaseModel) {
  _inheritsLoose(VideoModel, _ImageBaseModel);

  function VideoModel(data) {
    var _this;

    if (typeof data.duration !== 'number' && typeof data.naturalDuration !== 'number') {
      throw new Error('Video 元素缺少 duration 或 naturalDuration 属性');
    }

    _this = _ImageBaseModel.call(this, data) || this;

    if (!_this.naturalDuration && _this.duration) {
      _this.naturalDuration = Math.round(_this.duration * 1000);
    } // 兼容 loop


    if (typeof data.loop === 'boolean') {
      _this.loop = data.loop ? 0 : 1;
    }

    _this.endTime = Math.min(_this.endTime || _this.naturalDuration, _this.naturalDuration);
    delete _this.duration;
    return _this;
  }

  return VideoModel;
}(ImageBaseModel);

export default VideoModel;