"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addShadow = addShadow;
exports.clearShadows = clearShadows;
exports.copyShadow = copyShadow;
exports.createShadow = createShadow;
exports.moveShadow = moveShadow;
exports.removeShadow = removeShadow;
exports.updateShadow = updateShadow;

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _element = require("../element");

var _constant = require("./constant");

var _utils = require("./utils");

function createShadow(type = 'base') {
  return (0, _cloneDeep2.default)(_constant.DEFAULT_SHADOW[type] || _constant.DEFAULT_SHADOW.base);
}

function addShadow(element, options = {}) {
  if (!element || !element.shadows || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const shadow = createShadow(options.type);
  (0, _utils.mergeData)(shadow, options);

  if ((0, _element.isTextElement)(element)) {
    element.shadows.unshift(shadow);
  } else {
    element.shadows.unshift(shadow);
  }
}

function copyShadow(element, shadow) {
  if (!element || !element.shadows || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const newShadow = createShadow(shadow.type);
  (0, _utils.mergeData)(newShadow, shadow);
  const index = element.shadows.findIndex(s => s === shadow);
  element.shadows.splice(index + 1, 0, newShadow);
}

function updateShadow(shadow, options = {}) {
  if (options.type && options.type !== shadow.type && _constant.DEFAULT_SHADOW[options.type]) {
    for (const key in shadow) {
      delete shadow[key];
    }

    (0, _utils.mergeData)(shadow, { ..._constant.DEFAULT_SHADOW[options.type],
      ...options
    });
  } else {
    (0, _utils.mergeData)(shadow, options);
  }
}

function moveShadow(element, shadow, newIndex) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const shadows = element.shadows || [];
  const index = shadows.findIndex(s => s === shadow);

  if (index === newIndex) {
    return;
  }

  const isMoveAfter = newIndex > index;
  shadows.splice(newIndex + (isMoveAfter ? 1 : 0), 0, shadow);
  shadows.splice(index + (isMoveAfter ? 0 : 1), 1);
}

function removeShadow(element, shadow) {
  if (!element || !element.shadows || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  const index = element.shadows.findIndex(s => s === shadow);
  element.shadows.splice(index, 1);
}

function clearShadows(element) {
  if (!element || !(0, _element.isSupportEffectElement)(element)) {
    return;
  }

  element.shadows = [];
}