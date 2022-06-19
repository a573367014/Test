import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _defaultsDeep from "lodash/defaultsDeep";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import tinycolor from 'tinycolor2';
import defaultModel from "./default-model";

var ThreeTextModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(ThreeTextModel, _BaseModel);

  function ThreeTextModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;

    if (!_this.contents || !_this.contents.length) {
      _this.contents = serialize.fromJSON(_this.content || '', _assertThisInitialized(_this));
    }

    _defaultsDeep(_assertThisInitialized(_this), defaultModel);

    var _this$layers$ = _this.layers[0],
        frontMaterials = _this$layers$.frontMaterials,
        sideMaterials = _this$layers$.sideMaterials,
        bevelMaterials = _this$layers$.bevelMaterials;

    var isWhite = function isWhite(color) {
      return color.toHex8String().toLowerCase() === '#ffffffff';
    };

    var color = tinycolor('#000');
    var materials = [frontMaterials, sideMaterials, bevelMaterials];

    for (var i = 0; i < materials.length; i++) {
      var baseColor = tinycolor(materials[i].albedo.color);

      if (!isWhite(baseColor)) {
        color = baseColor;
        break;
      }
    }

    var layer = _this.layers[0];
    layer.expand = layer.expand || layer.scale || 0;
    delete layer.scale;
    _this.contents = _this.contents.map(function (content) {
      return Object.assign(content, {
        color: color.toHex8String(),
        fontFamily: _this.fontFamily,
        fontStyle: _this.fontStyle || 'normal',
        fontSize: _this.fontSize,
        fontWeight: _this.fontWeight || 400,
        textDecoration: _this.textDecoration || 'none'
      });
    }).filter(function (item) {
      return item.content;
    });

    if (layer.extrudeScaleX || layer.extrudeScaleY) {
      _this.deformation.extrudeScaleX = layer.extrudeScaleX;
      _this.deformation.extrudeScaleY = layer.extrudeScaleY;
      delete layer.extrudeScaleX;
      delete layer.extrudeScaleY;
    }

    return _this;
  }

  return ThreeTextModel;
}(BaseModel);

export default ThreeTextModel;