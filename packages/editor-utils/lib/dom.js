"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _zepto = _interopRequireDefault(require("./zepto"));

var _default = {
  contains(elA, elB) {
    if (!elA || !elB) {
      return false;
    }

    if (elA instanceof _zepto.default) {
      elA = elA[0];
    }

    if (elB instanceof _zepto.default) {
      elB = elB[0];
    }

    if (elA === elB || _zepto.default.contains(elA, elB)) {
      return true;
    }

    return false;
  },

  isContentEditable(element) {
    let parent = element;

    while (parent) {
      const editable = parent.contentEditable + '';

      if (editable === 'true') {
        return true;
      }

      parent = parent.parentNode;
    }

    return false;
  },

  isEditable(element) {
    const nodeName = element.nodeName;
    const rInput = /(?:input|textarea)/i;

    if (this.isContentEditable(element) || rInput.test(nodeName)) {
      return true;
    }

    return false;
  }

};
exports.default = _default;