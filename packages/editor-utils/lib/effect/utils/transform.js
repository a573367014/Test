"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calFillRatio = calFillRatio;
exports.calFitRatio = calFitRatio;
exports.getFillTransform = getFillTransform;

function calFillRatio(sourceSize, targetSize) {
  const defaultSize = {
    width: 0,
    height: 0
  };
  const {
    width: w1,
    height: h1
  } = sourceSize !== null && sourceSize !== void 0 ? sourceSize : defaultSize;
  const {
    width: w2,
    height: h2
  } = targetSize !== null && targetSize !== void 0 ? targetSize : defaultSize;
  let ratio = 1;

  if (w1 > w2 && h1 > h2) {
    ratio = Math.max(w2 / w1, h2 / h1);
  } else if (w1 < w2 && h1 < h2) {
    ratio = Math.max(w2 / w1, h2 / h1);
  } else if (w1 < w2) {
    ratio = w2 / w1;
  } else if (h1 < h2) {
    ratio = h2 / h1;
  }

  return ratio;
}

function calFitRatio(sourceSize, targetSize) {
  const defaultSize = {
    width: 0,
    height: 0
  };
  const {
    width: w1,
    height: h1
  } = sourceSize !== null && sourceSize !== void 0 ? sourceSize : defaultSize;
  const {
    width: w2,
    height: h2
  } = targetSize !== null && targetSize !== void 0 ? targetSize : defaultSize;
  let ratio = 1;

  if (w1 > h1) {
    ratio = w2 / w1;
  } else {
    ratio = h2 / h1;
  }

  return ratio;
}

function getFillTransform(type, sourceSize, targetSize, option) {
  if (type === 'fill' || type === 'fit') {
    const r = type === 'fill' ? calFillRatio(sourceSize, targetSize) : calFitRatio(sourceSize, targetSize);
    const tx = (targetSize.width - sourceSize.width * r) / 2;
    const ty = (targetSize.height - sourceSize.height * r) / 2;
    return [r, 0, 0, r, tx, ty];
  }

  if (type === 'crop') {
    return [targetSize.width / sourceSize.width, 0, 0, targetSize.height / sourceSize.height, 0, 0];
  }

  return [option.scaleX || 1, 0, 0, option.scaleY || 1, 0, 0];
}