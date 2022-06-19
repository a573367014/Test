"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pathBounds;

var _parseSvgPath = _interopRequireDefault(require("parse-svg-path"));

var _absSvgPath = _interopRequireDefault(require("abs-svg-path"));

var _normalizeSvgPath = _interopRequireDefault(require("normalize-svg-path"));

function pathBounds(path) {
  if (Array.isArray(path) && path.length === 1 && typeof path[0] === 'string') path = path[0];

  if (typeof path === 'string') {
    path = (0, _parseSvgPath.default)(path);
  }

  path = (0, _absSvgPath.default)(path);
  path = (0, _normalizeSvgPath.default)(path);
  if (!path.length) return [0, 0, 0, 0];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (let i = 0, l = path.length; i < l; i++) {
    const points = path[i].slice(1);

    for (let j = 0; j < points.length; j += 2) {
      if (points[j + 0] < bounds[0]) bounds[0] = points[j + 0];
      if (points[j + 1] < bounds[1]) bounds[1] = points[j + 1];
      if (points[j + 0] > bounds[2]) bounds[2] = points[j + 0];
      if (points[j + 1] > bounds[3]) bounds[3] = points[j + 1];
    }
  }

  return bounds;
}