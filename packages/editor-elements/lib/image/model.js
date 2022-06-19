import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import { isAnimationImage } from "@gaoding/editor-utils/lib/element";
import ImageBaseModel from "../image-base-model";

var ImageModel = /*#__PURE__*/function (_ImageBaseModel) {
  _inheritsLoose(ImageModel, _ImageBaseModel);

  function ImageModel(data, options) {
    var _this;

    var clip = data.clip;

    if (clip && !data.imageTransform) {
      data.imageWidth = clip.left + clip.right + data.width;
      data.imageHeight = clip.top + clip.bottom + data.height;
      var imageTransform = data.imageTransform;

      if (!imageTransform) {
        data.imageTransform = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          tx: 0,
          ty: 0
        };
      }

      data.imageTransform.tx = -clip.left;
      data.imageTransform.ty = -clip.top;
    }

    _this = _ImageBaseModel.call(this, data, options) || this;

    if (!_this.hasEffects && !_this.hasFilters) {
      _this.imageUrl = '';
    }

    delete _this.mask;

    if (isAnimationImage(data)) {
      _this.imageUrl = data.imageUrl || '';
      _this.enableDragToMask = false;
    }

    return _this;
  }

  return ImageModel;
}(ImageBaseModel);

export default ImageModel;