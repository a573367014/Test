"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "absSvgPath", {
  enumerable: true,
  get: function () {
    return _absSvgPath.default;
  }
});
Object.defineProperty(exports, "ellipseToPaths", {
  enumerable: true,
  get: function () {
    return _shape2path.ellipseToPaths;
  }
});
Object.defineProperty(exports, "getSvgBounds", {
  enumerable: true,
  get: function () {
    return _svgPathBounds.default;
  }
});
Object.defineProperty(exports, "normalizeSvgPath", {
  enumerable: true,
  get: function () {
    return _normalizeSvgPath.default;
  }
});
exports.pathsToSvg = pathsToSvg;
Object.defineProperty(exports, "rectToPaths", {
  enumerable: true,
  get: function () {
    return _shape2path.rectToPaths;
  }
});
exports.svgToPaths = svgToPaths;

var _normalizeSvgPath = _interopRequireDefault(require("./normalize-svg-path"));

var _shape2path = require("./shape2path");

var _parseSvgPath = _interopRequireDefault(require("parse-svg-path"));

var _absSvgPath = _interopRequireDefault(require("abs-svg-path"));

var _svgPathBounds = _interopRequireDefault(require("./svg-path-bounds"));

function svgToPaths(str) {
  if (!str) return [];
  return (0, _parseSvgPath.default)(str);
}

function pathsToSvg(arr) {
  return arr.reduce((str, path) => {
    path = path.map(v => {
      if (typeof v === 'number') return +v.toFixed(2);
      return v;
    });
    return str + path.join(' ');
  }, '');
}