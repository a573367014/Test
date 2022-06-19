"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextEffectEngine = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _adaptor = require("./adaptor");

var _utils = require("./utils");

class TextEffectEngine {
  constructor(options) {
    var _options$ratio;

    (0, _defineProperty2.default)(this, "ratio", 1);
    this.ratio = (_options$ratio = options === null || options === void 0 ? void 0 : options.ratio) !== null && _options$ratio !== void 0 ? _options$ratio : 1;
  }

  static draw(element, ratio) {
    const textEffectEngine = new TextEffectEngine({
      ratio
    });
    return textEffectEngine.draw(element);
  }

  draw(element) {
    const {
      shadows,
      effects
    } = (0, _adaptor.getEffectsAndShadows)(element);
    const shadowStyles = shadows.map(shadow => this.drawShadow(shadow, element));
    const effectStyles = effects.map(effect => this.drawEffect(effect, element));
    return [...shadowStyles, ...effectStyles];
  }

  drawShadow(shadow, element) {
    if (shadow.type && shadow.type !== 'base') {
      return {};
    }

    const style = {};
    const effects = (0, _utils.getEffects)(element);
    const enabledEffects = effects.filter(ef => ef.enable);
    const enabledShadows = element.shadows.filter(sh => sh.enable);
    const x = shadow.offsetX * this.ratio;
    const y = shadow.offsetY * this.ratio;
    const blur = shadow.blur * this.ratio;
    const color = shadow.color;
    style.textShadow = `${x}px ${y}px ${blur}px ${color}`;

    if (enabledEffects.length || enabledShadows[0] !== shadow) {
      style.webkitTextFillColor = 'transparent';
    }

    return style;
  }

  drawEffect(effect, element) {
    var _effect$filling, _effect$stroke, _effect$skew, _effect$offset;

    const style = {};

    if ((_effect$filling = effect.filling) !== null && _effect$filling !== void 0 && _effect$filling.enable) {
      Object.assign(style, this.drawFill(effect, element));
    }

    if ((_effect$stroke = effect.stroke) !== null && _effect$stroke !== void 0 && _effect$stroke.enable) {
      Object.assign(style, this.drawStroke(effect));
    }

    if ((_effect$skew = effect.skew) !== null && _effect$skew !== void 0 && _effect$skew.enable) {
      Object.assign(style, this.drawSkew(effect));
    }

    if ((_effect$offset = effect.offset) !== null && _effect$offset !== void 0 && _effect$offset.enable) {
      Object.assign(style, this.drawOffset(effect));
    }

    return style;
  }

  drawOffset(effect) {
    const {
      x,
      y
    } = effect.offset;
    const left = `${(x !== null && x !== void 0 ? x : 0) * this.ratio}px`;
    const top = `${(y !== null && y !== void 0 ? y : 0) * this.ratio}px`;
    return {
      left,
      top
    };
  }

  drawStroke(effect) {
    const {
      type,
      color,
      width
    } = effect.stroke;
    const strokeWidth = width;

    if (type === 'center') {
      const textStroke = `${strokeWidth * this.ratio}px ${color}`;
      return {
        webkitTextStroke: textStroke
      };
    }

    return {};
  }

  drawSkew(effect) {
    const {
      x,
      y
    } = effect.skew;

    if (x || y) {
      return {
        transform: `skew(${x * this.ratio}deg, ${y * this.ratio}deg)`
      };
    }

    return {};
  }

  drawFill(effect, element) {
    const {
      type,
      color,
      imageContent,
      gradient
    } = effect.filling;

    if (['color', 0].includes(type)) {
      return {
        webkitTextFillColor: color
      };
    }

    if (['image', 1].includes(type) && imageContent && imageContent.image) {
      var _imageContent$type;

      const style = {};
      const type = (_imageContent$type = imageContent.type) !== null && _imageContent$type !== void 0 ? _imageContent$type : 'tiled';
      style.backgroundImage = `url(${imageContent.image})`;
      style.backgroundClip = 'text';
      style.webkitBackgroundClip = 'text';
      style.webkitTextFillColor = 'transparent';

      if (imageContent.width && imageContent.height && element.width && element.height) {
        let size = 'auto auto';
        let repeat = 'repeat';
        let position = 'center';

        switch (type) {
          case 'fill':
            size = 'cover';
            repeat = 'no-repeat';
            break;

          case 'fit':
            size = 'contain';
            repeat = 'no-repeat';
            break;

          case 'crop':
            size = '100% 100%';
            repeat = 'no-repeat';
            break;

          case 'tiled':
          default:
            size = `${imageContent.width * imageContent.scaleX * this.ratio}px ${imageContent.height * imageContent.scaleY * this.ratio}px`;
            position = '0 0';
        }

        style.backgroundSize = size;
        style.backgroundRepeat = repeat;
        style.backgroundPosition = position;
      } else {
        var _imageContent$repeat;

        style.backgroundSize = 'contain';
        style.backgroundRepeat = (_imageContent$repeat = imageContent.repeat) !== null && _imageContent$repeat !== void 0 ? _imageContent$repeat : 'no-repeat';
      }

      return style;
    }

    if (['gradient', 2].includes(type)) {
      const {
        stops,
        angle
      } = gradient;
      const stopStyles = stops.map(stop => `${stop.color} ${stop.offset * 100}%`);
      const angleStyle = 90 - angle + 'deg';
      return {
        backgroundImage: `linear-gradient(${angleStyle}, ${stopStyles.join(',')})`,
        backgroundClip: 'text',
        webkitBackgroundClip: 'text',
        webkitTextFillColor: 'transparent'
      };
    }

    return {};
  }

}

exports.TextEffectEngine = TextEffectEngine;