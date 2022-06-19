"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ellipseToPaths = ellipseToPaths;
exports.rectToPaths = rectToPaths;

var _absSvgPath = _interopRequireDefault(require("abs-svg-path"));

var _parseSvgPath = _interopRequireDefault(require("parse-svg-path"));

var _normalizeSvgPath = _interopRequireDefault(require("./normalize-svg-path"));

function rectToPaths(x, y, width, height, rx, ry) {
  rx = rx || ry || 0;
  ry = ry || rx || 0;
  if (isNaN(x - y + width - height + rx - ry)) return;
  rx = rx > width / 2 ? width / 2 : rx;
  ry = ry > height / 2 ? height / 2 : ry;

  if (rx === 0 || ry === 0) {
    return (0, _normalizeSvgPath.default)((0, _absSvgPath.default)((0, _parseSvgPath.default)('M' + x + ' ' + y + 'h' + width + 'v' + height + 'h' + -width + 'z')));
  } else {
    return (0, _normalizeSvgPath.default)((0, _absSvgPath.default)((0, _parseSvgPath.default)('M' + x + ' ' + (y + ry) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + -ry + 'h' + (width - rx - rx) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry + 'v' + (height - ry - ry) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + -rx + ' ' + ry + 'h' + (rx + rx - width) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + -rx + ' ' + -ry + 'z')));
  }
}

function ellipseToPaths(cx, cy, rx, ry) {
  if (isNaN(cx - cy + rx - ry)) return;
  const path = 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0' + 'a' + rx + ' ' + ry + ' 0 1 0 ' + -2 * rx + ' 0' + 'z';
  return (0, _normalizeSvgPath.default)((0, _absSvgPath.default)((0, _parseSvgPath.default)(path)));
}