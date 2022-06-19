import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _defaultsDeep from "lodash/defaultsDeep";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba, useEffects } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";

var EffectTextModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(EffectTextModel, _BaseModel);

  function EffectTextModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;

    _defaultsDeep(_assertThisInitialized(_this), editorDefaults.effectTextElement); // 同步用来排版的基础宽高,兼容老数据


    if (!_this.typoWidthRatio || !_this.typoHeightRatio || _this.typoWidthRatio === 1 && _this.typoHeightRatio === 1) {
      _this.typoWidthRatio = _this.baseWidthRatio || _this.baseWidth / _this.width || 1;
      _this.typoHeightRatio = _this.baseHeightRatio || _this.baseHeight / _this.height || 1;
    }

    ['baseWidth', 'baseHeight', 'baseWidthRatio', 'baseHeightRatio'].forEach(function (attr) {
      if (_this[attr] !== undefined) {
        delete _this[attr];
      }
    });
    _this.$typoWidth = _this.width * _this.typoWidthRatio;
    _this.$typoHeight = _this.height * _this.typoHeightRatio;
    _this.resize = 1; // Compatible 修正颜色 支持8为16进制： #000000FF

    if (_this.backgroundColor) {
      _this.backgroundColor = hexaToRgba(_this.backgroundColor);
    }

    if (_this.color) {
      _this.color = hexaToRgba(_this.color);
    }

    if (_this.textShadow) {
      var shadow = _this.textShadow;
      shadow.color = hexaToRgba(shadow.color);
    }

    if (_this.textEffects && _this.textEffects.length) {
      _this.textEffects.forEach(function (effect) {
        if (effect.stroke) {
          effect.stroke.color = hexaToRgba(effect.stroke.color);
        }

        if (effect.shadow) {
          effect.shadow.color = hexaToRgba(effect.shadow.color);
        }

        if (effect.insetShadow) {
          effect.insetShadow.color = hexaToRgba(effect.insetShadow.color);
        }

        if (effect.filling) {
          effect.filling.color = hexaToRgba(effect.filling.color);

          if (effect.filling.gradient) {
            effect.filling.gradient.stops.forEach(function (stopPoint) {
              stopPoint.color = hexaToRgba(stopPoint.color);
            });
          }
        }
      });
    }

    if (_this.shadows) {
      _this.shadows.forEach(function (shadow) {
        if (shadow.color) {
          shadow.color = hexaToRgba(shadow.color);
        }
      });
    }

    useEffects(_assertThisInitialized(_this), true);
    return _this;
  }

  return EffectTextModel;
}(BaseModel);

export default EffectTextModel;