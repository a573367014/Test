"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _pica = _interopRequireDefault(require("pica"));

const resizeImage = (src, dist, options = {}) => {
  const throwError = !!options.throwError;
  const timeout = +options.timeout || 5000;
  return _bluebird.default.try(() => {
    if (!resizeImage.resizer) {
      resizeImage.resizer = new _pica.default({
        features: ['js', 'ww', 'cib']
      });
    }

    return resizeImage.resizer;
  }).then(resizer => {
    return resizer.resize(src, dist, options);
  }).timeout(timeout, 'Image resize timeout by pica').catch(err => {
    if (throwError) {
      throw err;
    }

    return src;
  });
};

var _default = resizeImage;
exports.default = _default;