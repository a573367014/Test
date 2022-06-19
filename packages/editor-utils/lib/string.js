"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uuid = exports.isBase64 = exports.default = void 0;

var _uuid = require("uuid");

const uuid = () => {
  return (0, _uuid.v4)();
};

exports.uuid = uuid;

const isBase64 = str => {
  return str && str.indexOf(';base64') > 0;
};

exports.isBase64 = isBase64;
var _default = {
  uuid,
  isBase64
};
exports.default = _default;