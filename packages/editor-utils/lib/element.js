"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearElement = clearElement;
exports.collapseGroupElement = collapseGroupElement;
exports.isAnimationImage = isAnimationImage;
exports.isApngElement = isApngElement;
exports.isAutoSubtitle = isAutoSubtitle;
exports.isDynamicElement = isDynamicElement;
exports.isGifElement = isGifElement;
exports.isGroup = isGroup;
exports.isMaskElement = isMaskElement;
exports.isMediaElement = isMediaElement;
exports.isPlaceholderElement = isPlaceholderElement;
exports.isPureTextGroup = isPureTextGroup;
exports.isRangeElement = isRangeElement;
exports.isSupportEffectElement = isSupportEffectElement;
exports.isTextElement = isTextElement;
exports.isVideoResource = isVideoResource;
exports.walkLayouts = walkLayouts;

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _rect = _interopRequireDefault(require("./rect"));

var _transform = require("./transform");

function walkLayouts(callbak, deep = true, layouts) {
  const promises = [];
  const deepConditionFn = typeof deep === 'function' ? deep : null;

  const walkElements = (elements = [], layout, parents) => {
    elements.some((element, index) => {
      if (!element) return false;
      const result = callbak(element, layout, index, parents);
      if (result === false) return true;
      promises.push(result);

      if (deepConditionFn && !deepConditionFn(element)) {
        return null;
      }

      if (deep && (isGroup(element) || element.type === 'collage')) {
        walkElements(element.elements, element, [...parents, element]);
      }

      if (deep && ['watermark'].includes(element.type)) {
        walkElements([element.$groupModel || element.template], element, [...parents, element]);
      }

      return false;
    });
  };

  if (!layouts) throw Error('layouts为空');
  layouts.forEach(layout => {
    layout && layout.elements && walkElements(layout.elements, layout, []);
  });
  return Promise.all(promises);
}

function isGroup(element) {
  return element && (element.type === 'group' || element.type === 'flex');
}

function isAnimationImage(element) {
  return element && ['image', 'mask'].includes(element.type) && ['apng'].includes(element.resourceType) && element.naturalDuration > 0;
}

function isVideoResource(element) {
  return element && element.type === 'image' && element.resourceType === 'mp4' && element.naturalDuration > 0;
}

function isTextElement(element) {
  return ['text', 'effectText', 'threeText'].includes(element.type);
}

function isGifElement(element) {
  return (element.isGif || element.resourceType === 'gif') && (element.type === 'mask' || element.type === 'image');
}

function isApngElement(element) {
  return element.isApng || element.resourceType === 'apng' && (element.type === 'mask' || element.type === 'image');
}

function isPureTextGroup(element) {
  let hasUnText = false;
  walkLayouts(elm => {
    if (!elm.type.includes('text')) {
      hasUnText = true;
      return false;
    }
  }, true, [{
    elements: element.elements || []
  }]);
  return !hasUnText;
}

function isDynamicElement(element) {
  var _element$animations;

  return isGifElement(element) || isApngElement(element) || element.type === 'video' || ((_element$animations = element.animations) === null || _element$animations === void 0 ? void 0 : _element$animations.length);
}

function collapseGroupElement({
  element,
  deep = false,
  keepGroup = false,
  createElement,
  isGroup
} = {}) {
  const group = element;
  const elements = group && group.elements;

  if (!elements && !elements.length) {
    return [];
  }

  const recursiveFn = group => {
    const groupTransform = group.transform.toArray ? group.transform : (0, _transform.parseTransform)(group.transform);
    const groupRotate = groupTransform.rotate;
    const elements = group.elements;
    let result = [];

    if ((group.backgroundColor || group.backgroundEffect) && keepGroup) {
      result.push({ ...group,
        watermarkEnable: false,
        elements: []
      });
    }

    result = elements.reduce((r, element) => {
      element = createElement({ ...element
      });
      element.enableEditable && element.enableEditable();
      element.transform.rotate += groupRotate;

      if (groupTransform.scale.y < 0) {
        element.transform.scale.y *= groupTransform.scale.y;
        element.top = group.height - element.top - element.height;
      }

      if (groupTransform.scale.x < 0) {
        element.transform.scale.x *= groupTransform.scale.x;
        element.left = group.width - element.left - element.width;
      }

      const prePoint = {
        x: group.left + element.left + element.width / 2,
        y: group.top + element.top + element.height / 2
      };

      const newPoint = _rect.default.getRectPoints({
        left: prePoint.x,
        top: prePoint.y,
        width: group.width - element.left * 2 - element.width,
        height: group.height - element.top * 2 - element.height,
        rotate: groupRotate,
        skewX: 0,
        skewY: 0
      });

      element.left += group.left + newPoint.nw.x - prePoint.x;
      element.top += group.top + newPoint.nw.y - prePoint.y;
      element.animation = (0, _cloneDeep2.default)(group.animation);
      delete element.$parentId;

      if (deep && isGroup(element)) {
        element = recursiveFn(element);
      }

      return r.concat(element);
    }, result);

    if (group.watermarkEnable && keepGroup) {
      result.push({ ...group,
        backgroundColor: null,
        backgroundEffect: null,
        elements: []
      });
    }

    return result;
  };

  return recursiveFn(group);
}

function isMediaElement(element) {
  return ['video', 'audio'].includes(element.type) || isGifElement(element) || isApngElement(element);
}

function isAutoSubtitle(element) {
  return element.category === 'autoSubTitle';
}

function isRangeElement(element) {
  return isMediaElement(element) || isAutoSubtitle(element);
}

function isPlaceholderElement(element) {
  return element.type === 'placeholder';
}

function clearElement(elements) {
  const _elements = [].concat(elements);

  walkLayouts(el => {
    delete el.$id;
    delete el.uuid;
  }, true, [{
    elements: _elements
  }]);
  return elements;
}

function isSupportEffectElement(element) {
  return ['text', 'effectText', 'image', 'mask'].includes(element.type);
}

function isMaskElement(element) {
  return element.type === 'mask';
}