"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _upng = _interopRequireDefault(require("./upng"));

var _ugif = _interopRequireDefault(require("./ugif"));

const ctx = self;

ctx.onmessage = function (magicRequest) {
  const {
    asyncId,
    type,
    data
  } = magicRequest.data;
  if (!asyncId) return;

  if (type === 'decodeGifOrApng') {
    const {
      buffer,
      type,
      needBuffer
    } = data;
    const isGif = type === 'gif';
    const parser = isGif ? _ugif.default : _upng.default;
    const result = parser.decode(buffer);

    if (needBuffer) {
      const buffers = parser.toRGBA8(result);
      result.frames.forEach((item, i) => {
        delete item.d;
        item.index = i;
        item.buffer = buffers[i];
      });
    }

    delete result.data;
    result.frames.forEach(item => {
      delete item.d;
    });
    const framesLength = result.frames.length;

    if (needBuffer && (result.width > 1500 || result.height > 1500 || framesLength > 100)) {
      result.frames.forEach((item, i) => {
        ctx.postMessage({
          payload: { ...result,
            index: i,
            frames: [item],
            framesLength
          },
          asyncId
        });
      });
    } else {
      ctx.postMessage({
        payload: result,
        asyncId
      });
    }
  }

  if (type === 'compressGif') {
    const {
      params
    } = data;

    const payload = _upng.default.encode.compress(...params);

    payload.frames.forEach(frame => {
      frame.img = frame.img.buffer;
    });
    ctx.postMessage({
      payload,
      asyncId
    });
  }
};