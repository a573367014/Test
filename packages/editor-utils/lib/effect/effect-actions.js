"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEffect = addEffect;
exports.clearEffects = clearEffects;
exports.copyEffect = copyEffect;
exports.createEffect = createEffect;
exports.moveEffect = moveEffect;
exports.removeEffect = removeEffect;
exports.updateEffect = updateEffect;

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _element = require("../element");

var _utils = require("./utils");

var _constant = require("./constant");

function createEffect() {
  return (0, _cloneDeep2.default)(_constant.DEFAULT_EFFECT);
}

function addEffect(element, options = {}) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const effects = (0, _utils.getEffects)(element);
  const newEffect = createEffect();
  (0, _utils.mergeData)(newEffect, options);
  effects.unshift(newEffect);
}

function copyEffect(element, effect) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const effects = (0, _utils.getEffects)(element);
  const newEffect = createEffect();
  (0, _utils.mergeData)(newEffect, effect);
  const index = effects.findIndex(ef => ef === effect);
  effects.splice(index + 1, 0, newEffect);
}

function updateEffect(effect, options = {}) {
  (0, _utils.mergeData)(effect, options);
}

function moveEffect(element, effect, newIndex) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const effects = (0, _utils.getEffects)(element);
  const index = effects.findIndex(ef => ef === effect);

  if (index === newIndex) {
    return;
  }

  const isMoveAfter = newIndex > index;
  effects.splice(newIndex + (isMoveAfter ? 1 : 0), 0, effect);
  effects.splice(index + (isMoveAfter ? 0 : 1), 1);
}

function removeEffect(element, effect) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const effects = (0, _utils.getEffects)(element);
  const index = effects.findIndex(ef => ef === effect);
  effects.splice(index, 1);
}

function clearEffects(element) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  if ((0, _element.isTextElement)(element)) {
    element.textEffects = [];
  } else {
    element.imageEffects = [];
  }
}