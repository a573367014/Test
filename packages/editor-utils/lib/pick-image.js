"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pickFile = _interopRequireDefault(require("./pick-file"));

var _ua = _interopRequireDefault(require("./ua"));

const pickImage = (options = {}) => {
  if (!options) {
    options = {};
  }

  if (!options.accept) {
    options.accept = !_ua.default.isAndorid() ? 'image/png,image/jpeg,image/gif' : 'image/*';
  }

  return (0, _pickFile.default)(options);
};

var _default = pickImage;
exports.default = _default;