"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMessage = sendMessage;

var _string = require("./string");

function sendMessage(type, data, worker) {
  const promiseMap = {};
  const payloadMap = {};
  const asyncId = (0, _string.uuid)();
  const message = {
    type,
    data,
    asyncId
  };

  worker.onmessage = function (event) {
    let {
      asyncId,
      payload
    } = event.data;

    if (payload.framesLength && asyncId) {
      if (!payloadMap[asyncId]) {
        payloadMap[asyncId] = payload;
      } else {
        payloadMap[asyncId].frames = payloadMap[asyncId].frames.concat(payload.frames);
      }

      payload = payloadMap[asyncId];
      payload.frames.sort((a, b) => a.index - b.index);
    }

    if (asyncId && promiseMap[asyncId] && (payload.frames.length === payload.framesLength || !payload.framesLength)) {
      promiseMap[asyncId][0](payload);
      delete promiseMap[asyncId];
    }
  };

  worker.onerror = function (event) {
    const {
      message
    } = event;

    if (asyncId && promiseMap[asyncId]) {
      promiseMap[asyncId][1](message);
      delete promiseMap[asyncId];
    }

    console.error(message);
  };

  return new Promise((resolve, reject) => {
    promiseMap[message.asyncId] = [resolve, reject];
    worker.postMessage(message);
  });
}