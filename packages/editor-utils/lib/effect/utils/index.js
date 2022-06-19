"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEffects = getEffects;
exports.mergeData = mergeData;
exports.scaleEffect = scaleEffect;

var _merge2 = _interopRequireDefault(require("lodash/merge"));

var _vue = _interopRequireDefault(require("vue"));

var _tinycolor = _interopRequireDefault(require("tinycolor2"));

var _element = require("../../element");

function getEffects(element) {
  if (!(0, _element.isSupportEffectElement)(element)) {
    return [];
  }

  if ((0, _element.isTextElement)(element)) {
    return element.textEffects || [];
  }

  return element.imageEffects || [];
}

function scaleEffect(element, ratio, isPreviewScale = false) {
  if (!element) {
    return;
  }

  const effects = getEffects(element);
  effects.forEach(effect => {
    const {
      offset,
      stroke,
      filling
    } = effect;
    const {
      insetShadow
    } = effect;

    if (offset) {
      offset.x *= ratio;
      offset.y *= ratio;
    }

    if (stroke) {
      stroke.width *= ratio;
    }

    if (insetShadow) {
      insetShadow.offsetX *= ratio;
      insetShadow.offsetY *= ratio;
    }

    if (filling && [1, 'image'].includes(filling.type) && filling.imageContent) {
      const {
        scaleX,
        scaleY
      } = filling.imageContent;
      filling.imageContent.scaleX = Math.max(1e-2, scaleX * ratio);
      filling.imageContent.scaleY = Math.max(1e-2, scaleY * ratio);
    }
  });

  if (element.shadows) {
    element.shadows.forEach(shadow => {
      if (shadow.type === 'base' || isPreviewScale) {
        shadow.offsetX *= ratio;
        shadow.offsetY *= ratio;
      } else {
        shadow.opacity *= ratio;

        if (shadow.opacity > 1) {
          shadow.opacity = 1;
        }

        if (shadow.type !== 'reflect') {
          const colorObj = (0, _tinycolor.default)(shadow.color);
          colorObj.setAlpha(shadow.opacity);
          shadow.color = colorObj.toString('rgb');
        }
      }
    });
  }
}

function mergeData(target, options) {
  const data = (0, _merge2.default)({}, target, options);

  for (const key in data) {
    _vue.default.set(target, key, data[key]);
  }
}