"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exportGif = exportGif;

var _upng = _interopRequireDefault(require("./upng"));

var _omggif = require("omggif");

async function exportGif(datas, width, height, config) {
  if (!config) {
    config = [100, 0, 0, false];
  }

  let buffers = [];
  let delays = [];
  let pixelLength = width * height * 4;
  let transparent = null;

  for (let j = 0; j < datas.length; j++) {
    let uint8 = datas[j][0];

    if (!config[3]) {
      for (let i = 0; i < pixelLength; i += 4) {
        let alpha = uint8[i + 3] = uint8[i + 3] > 127 ? 255 : 0;
        if (alpha == 0) uint8[i] = uint8[i + 1] = uint8[i + 2] = 0;
      }
    }

    buffers.push(uint8.buffer);
    delays.push(datas[j][1]);
  }

  let psize = Math.round(2 + 254 * config[0] / 100);
  let params = [buffers, width, height, psize, [!0, !1, !1, 8, !1], config[3]];

  let info = _upng.default.encode.compress(...params);

  let plte = info.plte;
  let rbga = new Uint8Array(4);
  let unit32Rgba = new Uint32Array(rbga.buffer);

  for (let i = 0; i < plte.length; i++) {
    unit32Rgba[0] = plte[i];
    let r = rbga[0];
    rbga[0] = rbga[2];
    rbga[2] = r;
    plte[i] = unit32Rgba[0];
    if (unit32Rgba[0] == 0) transparent = i;
  }

  while (plte.length < 256) plte.push(0);

  let resultBuf = new Uint8Array(2e3 + width * height * datas.length);
  let loop = config[2];
  let options = {
    palette: plte
  };
  if (loop != 1) options.loop = loop == 0 ? 0 : loop - 1;
  let gif = new _omggif.GifWriter(resultBuf, width, height, options);

  for (let i = 0; i < datas.length; i++) {
    let frame = info.frames[i];
    let rect = frame.rect;
    let dispose = frame.dispose;
    gif.addFrame(rect.x, rect.y, rect.width, rect.height, frame.img, {
      transparent: transparent,
      disposal: dispose + 1,
      delay: Math.round(delays[i] / 10)
    });
    info.frames[i] = null;
  }

  return resultBuf.slice(0, gif.end()).buffer;
}