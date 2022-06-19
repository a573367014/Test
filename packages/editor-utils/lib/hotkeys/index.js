"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hotkeys = void 0;
Object.defineProperty(exports, "handleMap", {
  enumerable: true,
  get: function () {
    return _handleMap.handleMap;
  }
});

var _hotkeysLib = _interopRequireDefault(require("./hotkeys-lib"));

var _handleMap = require("./handle-map");

const Hotkeys = _hotkeysLib.default;
exports.Hotkeys = Hotkeys;