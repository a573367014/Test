"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEditable = isEditable;

function isEditable(element) {
  const nodeName = element.nodeName;
  const editable = element.contentEditable + '';
  const rInput = /(?:input|textarea)/i;

  if (editable === 'true' || rInput.test(nodeName)) {
    return true;
  }

  return false;
}