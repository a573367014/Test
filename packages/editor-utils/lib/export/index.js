"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exportGif = exportGif;

var _isFunction2 = _interopRequireDefault(require("lodash/isFunction"));

var _gif = require("./gif");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _canvas = require("../canvas");

async function exportGif({
  frames,
  delays,
  width,
  height,
  quality,
  disabledTransparent,
  needCleanupCanvasMemory
}) {
  height = Math.round(height);
  width = Math.round(width);
  quality = Math.min(quality, 1);
  const datas = await _bluebird.default.mapSeries(frames, (canvas, i) => {
    return _bluebird.default.try(() => {
      return (0, _isFunction2.default)(canvas) ? canvas() : canvas;
    }).then(canvas => {
      if (width !== Math.round(canvas.width) || height !== Math.round(canvas.height)) {
        const newCanvas = document.createElement('canvas');
        newCanvas.height = height;
        newCanvas.width = width;
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, width, height);
        needCleanupCanvasMemory && (0, _canvas.cleanupCanvasMemory)(canvas);
        canvas = newCanvas;
      }

      const result = [new Uint8Array(canvas.getContext('2d').getImageData(0, 0, width, height).data.buffer), delays[i]];
      needCleanupCanvasMemory && (0, _canvas.cleanupCanvasMemory)(canvas);
      return _bluebird.default.delay(10).then(() => result);
    });
  });
  const buffer = await (0, _gif.exportGif)(datas, width, height, [quality * 100, 0, 0, disabledTransparent]);
  return new Blob([buffer], {
    type: 'image/gif'
  });
}