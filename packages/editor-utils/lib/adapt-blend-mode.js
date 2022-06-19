"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = adaptBlendMode;

function adaptBlendMode(blendMode) {
  if (!blendMode || !blendMode.startsWith('blend')) {
    return blendMode;
  }

  return blendMode.replace(/[A-Z]/g, s => '-' + s.toLowerCase()).replace('blend-', '');
}