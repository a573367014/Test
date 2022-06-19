"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _config = require("vitest/config");

var _default = (0, _config.defineConfig)({
  test: {
    environment: 'happy-dom'
  }
});

exports.default = _default;