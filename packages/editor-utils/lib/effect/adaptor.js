"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEffectShadowList = getEffectShadowList;
exports.getEffectedTextEffects = getEffectedTextEffects;
exports.getEffectsAndShadows = getEffectsAndShadows;

var _merge2 = _interopRequireDefault(require("lodash/merge"));

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _element = require("../element");

function getEffectedTextEffects(element) {
  let result = element.textEffects.filter(effect => {
    return effect.enable !== false;
  });
  result = result.reduce((newResult, effect) => {
    const valid = effect.enable !== false && effect.stroke && effect.stroke.enable !== false && effect.stroke.type === 'outer';
    effect = (0, _cloneDeep2.default)(effect);

    if (!valid) {
      newResult.push(effect);
    } else {
      const nextEffect = (0, _merge2.default)({}, effect, {
        stroke: {
          enable: true,
          type: 'center',
          color: effect.stroke.color,
          width: effect.stroke.width * 2
        }
      });
      if (effect.stroke) effect.stroke.enable = false;
      if (effect.shadow) effect.shadow.enable = false;
      newResult.push(effect);
      newResult.push(nextEffect);
    }

    return newResult;
  }, []);
  return result;
}

function getEffectsAndShadows(element) {
  if (!(0, _element.isSupportEffectElement)(element)) {
    return {
      shadows: [],
      effects: []
    };
  }

  const shadows = [...(element.shadows || [])].filter(sh => sh.enable);
  const effects = (0, _element.isTextElement)(element) ? getEffectedTextEffects(element) : element.imageEffects.filter(ef => ef.enable);
  shadows.reverse();
  effects.reverse();
  return {
    shadows,
    effects
  };
}

function getEffectShadowList(element) {
  const {
    shadows,
    effects
  } = getEffectsAndShadows(element);
  return [...shadows.map(shadow => ({
    enable: shadow.enable,
    shadow
  })), ...effects];
}