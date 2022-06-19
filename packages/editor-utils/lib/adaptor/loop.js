"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isLoopElement = isLoopElement;

function isLoopElement(element) {
  const loop = element.loop;
  return typeof loop === 'number' ? loop !== 1 : !!loop;
}