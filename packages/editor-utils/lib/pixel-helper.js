"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.absoluteLengthToPixel = absoluteLengthToPixel;
exports.absoluteSizeToPixelSize = absoluteSizeToPixelSize;
exports.default = void 0;
exports.getDpi = getDpi;
exports.pixelToAbsoluteLength = pixelToAbsoluteLength;
const ALLOWED_UNITS = ['in', 'cm', 'mm', 'pt'];

function unitValueTransform(value, dpi, unit, decimalPlaces, mapTransformFn) {
  const validValue = Math.max(value, 0);
  const validDpi = Math.max(dpi, 0);
  let result = validDpi;

  if (!ALLOWED_UNITS.includes(unit)) {
    result = validValue;
  } else if (validValue === 0 || validDpi === 0) {
    result = 0;
  } else {
    var _mapTransformFn$unit;

    result = ((_mapTransformFn$unit = mapTransformFn[unit]) === null || _mapTransformFn$unit === void 0 ? void 0 : _mapTransformFn$unit.call(mapTransformFn, validValue)) || validValue;
  }

  if (decimalPlaces === -1) {
    return result;
  }

  const radio = Math.pow(10, decimalPlaces);
  return Math.round(result * radio) / radio;
}

function absoluteLengthToPixel(absoluteLength, dpi, unit, decimalPlaces = 0) {
  return unitValueTransform(absoluteLength, dpi, unit, decimalPlaces, {
    in: v => v * dpi,
    cm: v => v * dpi / 2.54,
    mm: v => v * dpi / 2.54 / 10,
    pt: v => v / dpi * 72
  });
}

function pixelToAbsoluteLength(px, dpi, unit, decimalPlaces = 0) {
  return unitValueTransform(px, dpi, unit, decimalPlaces, {
    in: v => v / dpi,
    cm: v => v / dpi * 2.54,
    mm: v => v / dpi * 2.54 * 10,
    pt: v => v * dpi / 72
  });
}

function getDpi(width, height, unit) {
  if (!ALLOWED_UNITS.includes(unit) || !(height > 0) || !(width > 0)) {
    return 0;
  }

  switch (unit) {
    case 'in':
      width = width * 2.54;
      height = height * 2.54;
      break;

    case 'mm':
      width = width / 10;
      height = height / 10;
      break;

    case 'cm':
    default:
      break;
  }

  if (width > 300 && width <= 500 || height > 300 && height <= 500) {
    return 45;
  }

  if (width > 120 && width <= 300 || height > 200 && height <= 300) {
    return 72;
  }

  if (width > 60 && width <= 120 || height > 60 && height <= 200) {
    return 150;
  }

  if (width <= 60 && height <= 60) {
    return 300;
  }
}

function absoluteSizeToPixelSize(width, height, unit, defaultDpi) {
  if (!ALLOWED_UNITS.includes(unit)) {
    return {
      width: width,
      height: height,
      dpi: 0
    };
  }

  const dpi = getDpi(width, height, unit) || defaultDpi;
  return {
    width: absoluteLengthToPixel(width, dpi, unit),
    height: absoluteLengthToPixel(height, dpi, unit),
    dpi: dpi
  };
}

var _default = {
  absoluteLengthToPixel,
  pixelToAbsoluteLength,
  getDpi,
  absoluteSizeToPixelSize
};
exports.default = _default;