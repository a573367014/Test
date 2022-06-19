import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import ImageBaseModel from "../image-base-model";
import { version } from "@gaoding/editor-framework/lib/utils/utils";

var MaskModel = /*#__PURE__*/function (_ImageBaseModel) {
  _inheritsLoose(MaskModel, _ImageBaseModel);

  function MaskModel(data, options) {
    var modelVersion = version.parse(data.version || '0.0.0'); // Compatible old datas;

    if (modelVersion.major < 2) {
      data.imageUrl = data.imageUrl || data.image;
      delete data.image;
      var clip = data.clip;

      if (clip) {
        data.imageWidth += clip.left + clip.right;
        data.imageHeight += clip.top + clip.bottom;
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
        delete data.clip;
      }
    }

    return _ImageBaseModel.call(this, data, options) || this;
  }

  return MaskModel;
}(ImageBaseModel);

export default MaskModel;