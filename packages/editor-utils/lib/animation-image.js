"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeAPNG = decodeAPNG;
exports.getCurrentFrame = getCurrentFrame;
exports.loadAnimeImgData = loadAnimeImgData;

var _canvas = require("./canvas");

var _upng = _interopRequireDefault(require("./export/upng"));

const cachedAnimeImgData = new Map();

function loadAnimeImgData(url) {
  if (cachedAnimeImgData.has(url)) {
    const data = cachedAnimeImgData.get(url);
    return Promise.resolve(data);
  } else {
    return decodeAPNG(url).then(data => {
      cachedAnimeImgData.set(url, data);
      return data;
    });
  }
}

function getCurrentFrame(frames, currentTime, duration, loop) {
  if (typeof loop === 'boolean') {
    loop = loop ? 0 : 1;
  }

  const seekTime = loop !== 1 ? currentTime % duration : currentTime;
  let currentFrame;

  if (seekTime >= duration) {
    currentFrame = frames[frames.length - 1];
  } else {
    currentFrame = frames.find(frame => {
      const {
        delay,
        duration
      } = frame;
      return delay <= seekTime && delay + duration >= seekTime;
    });
  }

  return currentFrame || null;
}

async function decodeAPNG(url) {
  const buffer = await fetch(url).then(res => res.arrayBuffer());

  const apng = _upng.default.decode(buffer);

  const rgbaList = _upng.default.toRGBA8(apng);

  const {
    width,
    height
  } = apng;
  const frames = [];
  let totalDuration = 0;
  const len = rgbaList.length;

  for (let i = 0; i < len; i++) {
    const rgba = rgbaList[i];
    const originFrame = apng.frames[i];
    const duration = originFrame.delay;
    const buffer = new Uint8ClampedArray(rgba);
    const imageData = new ImageData(buffer, width, height);
    const canvas = (0, _canvas.createCanvas)(width, height);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    const frame = {
      canvas,
      duration,
      delay: totalDuration
    };
    frames.push(frame);
    totalDuration += duration;
  }

  return {
    width,
    height,
    duration: totalDuration,
    frames
  };
}