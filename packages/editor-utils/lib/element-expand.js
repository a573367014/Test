"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateEffectExpand = calculateEffectExpand;
exports.calculateExpand = calculateExpand;
exports.calculateImageShadowExpand = calculateImageShadowExpand;
exports.calculateTextShadowExpand = calculateTextShadowExpand;
exports.getElementExpandRect = getElementExpandRect;
exports.getExpandByExpands = getExpandByExpands;
exports.getGroupExpandRect = getGroupExpandRect;
exports.getImageExpandRect = getImageExpandRect;
exports.getTextExpandRect = getTextExpandRect;
exports.handlerImageEffectedResult = handlerImageEffectedResult;

var _get2 = _interopRequireDefault(require("lodash/get"));

var _shadow = require("@gaoding/shadow");

var _rect = _interopRequireDefault(require("./rect"));

var _transformMath = _interopRequireDefault(require("./transform-math"));

var _transform = require("./transform");

var _element = require("./element");

var _utils = require("./effect/utils");

var _drawImageToCanvas = require("./effect/utils/draw-image-to-canvas");

const {
  max,
  round
} = Math;

function handlerImageEffectedResult(element, image) {
  const {
    width,
    height,
    hasEffects,
    effectedResult,
    resourceType
  } = element;
  const isEffectImage = hasEffects && (!resourceType || ['image', 'jpeg', 'jpg', 'png'].includes(resourceType));
  return {
    canvas: image,
    offsetX: isEffectImage ? -effectedResult.left : 0,
    offsetY: isEffectImage ? -effectedResult.top : 0,
    elementRealWidth: isEffectImage ? effectedResult.width : width,
    elementRealHeight: isEffectImage ? effectedResult.height : height
  };
}

function getExpandByExpands(expands) {
  const finalExpand = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };
  expands.forEach(expand => {
    for (const key in finalExpand) {
      finalExpand[key] = Math.max(finalExpand[key], Math.ceil(expand[key]), 0);
    }
  });
  return finalExpand;
}

function calculateEffectExpand(element) {
  const effects = (0, _utils.getEffects)(element);
  const expands = effects.filter(ef => ef.enable).map(effect => {
    const expand = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    const {
      offset,
      stroke
    } = effect;

    if (offset && offset.enable) {
      expand.right += offset.x;
      expand.left -= offset.x;
      expand.bottom += offset.y;
      expand.top -= offset.y;
    }

    if (stroke && stroke.enable && stroke.width > 0) {
      const safeThreshold = 6;
      const ratio = stroke.type === 'outer' ? 2 : 1;
      expand.right += stroke.width * ratio + safeThreshold;
      expand.left += stroke.width * ratio + safeThreshold;
      expand.bottom += stroke.width * ratio + safeThreshold;
      expand.top += stroke.width * ratio + safeThreshold;
    }

    return expand;
  });
  return getExpandByExpands(expands);
}

function calculateTextShadowExpand(element) {
  const expands = (element.shadows || []).filter(shadow => shadow.enable).reduce((result, shadow) => {
    const expand = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    expand.right += Math.max(shadow.offsetX, 0);
    expand.left -= Math.min(shadow.offsetX, 0);
    expand.bottom += Math.max(shadow.offsetY, 0);
    expand.top -= Math.min(shadow.offsetY, 0);
    expand.right += shadow.blur;
    expand.left += shadow.blur;
    expand.bottom += shadow.blur;
    expand.top += shadow.blur;
    return result.concat(expand);
  }, []);
  return getExpandByExpands(expands);
}

async function calculateImageShadowExpand(element, cacheKey) {
  const img = await new Promise(resolve => {
    const _img = new Image();

    _img.crossOrigin = 'Anonymous';

    _img.onload = () => resolve(_img);

    _img.src = element.url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = element.width;
  canvas.height = element.height;
  (0, _drawImageToCanvas.drawImageToCanvas)({
    canvas,
    image: img,
    width: element.width,
    height: element.height,
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
    imageTransformArray: element.imageTransform.toArray(),
    blendMode: 'source-over'
  });
  const {
    bbox,
    points
  } = (0, _shadow.getCacheBBoxData)(canvas, cacheKey);
  const baseBBox2 = (0, _shadow.getBBox2)(bbox, element.shadows || [], points);
  return {
    left: -baseBBox2.xMin,
    top: -baseBBox2.yMin,
    right: baseBBox2.xMax - element.width,
    bottom: baseBBox2.yMax - element.height
  };
}

function calculateExpand(element, cacheKey) {
  const effectExpand = calculateEffectExpand(element);

  if ((0, _element.isTextElement)(element)) {
    const shadowExpand = calculateTextShadowExpand(element);
    return getExpandByExpands([effectExpand, shadowExpand]);
  }

  return calculateImageShadowExpand(element, cacheKey).then(shadowExpand => {
    return getExpandByExpands([effectExpand, shadowExpand]);
  });
}

function getGroupExpandRect(element) {
  let rects = element.elements.map(child => {
    const childRect = child.effectedResult || {
      width: child.width,
      height: child.height,
      left: 0,
      top: 0
    };
    const pivot = {
      x: child.left + child.width / 2,
      y: child.top + child.height / 2
    };
    const transform = (0, _get2.default)(child, 'transform.toJSON') ? child.transform : (0, _transform.parseTransform)(child.transform);

    const points = _rect.default.newGetRectPoints({
      left: child.left + childRect.left,
      top: child.top + childRect.top,
      width: childRect.width,
      height: childRect.height,
      rotate: transform.rotate,
      scaleX: transform.scale.x,
      scaleY: transform.scale.y
    }, pivot);

    const rect = _rect.default.getRectByPoints(points);

    return rect;
  });
  rects = rects.concat([{
    width: element.width,
    height: element.height,
    left: 0,
    top: 0,
    rotate: 0
  }]);
  return _rect.default.getBBoxByBBoxs(rects);
}

async function getImageExpandRect(element) {
  const expand = await calculateExpand(element);
  return {
    left: -expand.left,
    top: -expand.top,
    width: element.width + expand.left + expand.right,
    height: element.height + expand.top + expand.bottom
  };
}

function _getTextBBoxRect(element) {
  const rect = {
    width: element.width,
    height: element.height,
    left: 0,
    top: 0,
    rotate: 0
  };
  const skewEffects = element.textEffects.filter(ef => ef.enable && ef.skew && ef.skew.enable);
  if (!skewEffects.length) return rect;
  const points = skewEffects.reduce((r, ef) => {
    const point = _rect.default.newGetRectPoints({ ...rect,
      skewX: _transformMath.default.degToRad(ef.skew.x),
      skewY: _transformMath.default.degToRad(ef.skew.y)
    }, {
      x: 0,
      y: 0
    });

    r.push(point.nw, point.ne, point.sw, point.se);
    return r;
  }, []);
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  points.forEach(point => {
    if (point.x < left) {
      left = point.x;
    }

    if (point.x > right) {
      right = point.x;
    }

    if (point.y < top) {
      top = point.y;
    }

    if (point.y > bottom) {
      bottom = point.y;
    }
  });
  return {
    width: right - left,
    height: bottom - top,
    left: left,
    top: top
  };
}

function getTextExpandRect(element) {
  if (element.autoAdaptive === 0) {
    return {
      left: 0,
      top: 0,
      width: round(element.width),
      height: round(element.height)
    };
  }

  const rect = _getTextBBoxRect(element);

  const expand = calculateExpand(element);
  const contents = element.contents || [element];
  const safeThreshold = max(...contents.map(item => item.fontSize || element.fontSize)) / 2;
  return {
    width: round(rect.width + expand.left + expand.right + safeThreshold),
    height: round(rect.height + expand.top + expand.bottom + safeThreshold),
    left: round(rect.left - expand.left - safeThreshold / 2),
    top: round(rect.top - expand.top - safeThreshold / 2)
  };
}

function getElementExpandRect(element) {
  switch (element.type) {
    case 'text':
      return getTextExpandRect(element);

    case 'image':
    case 'mask':
      return getImageExpandRect(element);

    case 'flex':
    case 'group':
    case undefined:
      return getGroupExpandRect(element);

    default:
  }

  if (element.imageUrl && element.effectedResult) {
    return element.effectedResult;
  }

  return {
    left: 0,
    top: 0,
    width: element.width,
    height: element.height
  };
}