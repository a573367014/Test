import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _escape from "lodash/escape";
import _get from "lodash/get";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba, useEffects } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import { version, serialize } from "@gaoding/editor-framework/lib/utils/utils";
import { MODIFY_MIN_FONTSIZE_VERSION } from "@gaoding/editor-framework/lib/utils/consts";

var TextModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(TextModel, _BaseModel);

  function TextModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this; // Compatible 修正颜色 支持8为16进制： #000000FF

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
      // 有效特效层并且无填充时，回退到文字颜色，主要避免右侧面板金字塔交互规则异常
      // this.textEffects.forEach((effect) => {
      //     if (!effect.enable) return;
      //     if (effect.filling && effect.filling.enable) return;
      //     const contents = this.contents || [];
      //     const colors = uniq(contents.map((item) => item.color).filter((color) => color));
      //     if (colors.length > 1) return;
      //     this.color = hexaToRgba(colors[0] || this.color);
      //     effect.filling = cloneDeep(editorDefaults.effect.filling);
      //     effect.filling.color = this.color;
      //     effect.filling.enable = true;
      // });
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

          var stops = _get(effect, 'filling.gradient.stops');

          stops && stops.forEach(function (stopPoint) {
            stopPoint.color = hexaToRgba(stopPoint.color);
          });
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

    useEffects(_assertThisInitialized(_this), true); // @TODO model schema
    // 修复行高为字符串问题

    if (typeof _this.lineHeight === 'string') {
      _this.lineHeight = Number(_this.lineHeight) || 1.2;
    } // 修复子间距为字符串问题


    if (typeof _this.letterSpacing === 'string') {
      _this.letterSpacing = Number(_this.letterSpacing) || 0;
    } // 自动配置文本 autoScale


    var _data$writingMode = data.writingMode,
        writingMode = _data$writingMode === void 0 ? 'horizontal-tb' : _data$writingMode,
        resize = data.resize; // 6个点时字号大小强制支持自动缩放

    if (!_this.autoScale && (writingMode === 'horizontal-tb' && resize === 5 || writingMode === 'vertical-rl' && resize === 3)) {
      _this.autoScale = true;
    }

    if (data.autoAdaptive === undefined && _this.writingMode === 'vertical-rl' && _this.resize === 5 && _this.autoScale) {
      data.resize = _this.resize = 3;
    } else if (data.autoAdaptive === undefined && _this.writingMode !== 'vertical-rl' && _this.resize === 3 && _this.autoScale) {
      data.resize = _this.resize = 5;
    }

    if (data.autoAdaptive === undefined) {
      var autoAdaptiveMap = {
        0: 3,
        1: 3,
        2: 2,
        3: 2,
        4: 1,
        5: 1,
        6: 0,
        7: 0
      };
      _this.autoAdaptive = autoAdaptiveMap[_this.resize];
    }

    if (!_this.contents || !_this.contents.length) {
      var content = !_this.listStyle ? _escape(_this.content) : "<ul><li>" + _escape(_this.content) + "</li></ul>";
      _this.contents = serialize.fromJSON(content || '', Object.assign({}, _assertThisInitialized(_this)), {
        listStyle: _this.listStyle
      });
    } // 修复历史数据 contents 没有存在默认值, content 为空的情况下过滤


    _this.contents = _this.contents.map(function (content) {
      return Object.assign({}, {
        color: _this.color,
        fontFamily: _this.fontFamily,
        fontStyle: _this.fontStyle || 'normal',
        fontSize: _this.fontSize,
        fontWeight: _this.fontWeight || 400,
        textDecoration: _this.textDecoration || 'none'
      }, content);
    }).filter(function (item) {
      return item.content;
    });
    return _this;
  }

  _createClass(TextModel, [{
    key: "$miniFontSize",
    get: function get() {
      return version.checkVersion(this.version, MODIFY_MIN_FONTSIZE_VERSION) ? 12 : 14;
    }
  }, {
    key: "$renderProps",
    get: function get() {
      return [this.maskInfo.enable, this.width, this.height, this.lineHeight, this.letterSpacing, this.fontFamily, this.fontSize, this.fontWeight, this.textAlign, this.autoAdaptive, this.textDecoration, this.textShadow, this.contents, this.opacity, this.textEffects, this.shadows];
    }
  }]);

  return TextModel;
}(BaseModel);

export default TextModel;