"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getImageInfo;
exports.getArrayBufferByURL = getArrayBufferByURL;
exports.getArrayBufferType = getArrayBufferType;
exports.getBlob = getBlob;
exports.getImageHasAlpha = getImageHasAlpha;
exports.getImageIsSolidColor = getImageIsSolidColor;

var _isEqual2 = _interopRequireDefault(require("lodash/isEqual"));

var _loader = _interopRequireDefault(require("./loader"));

function getArrayBufferType(arrayBuffer) {
  const buf = new Uint8Array(arrayBuffer);

  if (buf.length < 1) {
    return null;
  }

  const imageHeaderMap = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    gif: [0x47, 0x49, 0x46]
  };

  for (const type in imageHeaderMap) {
    const header = imageHeaderMap[type];
    const bufHeader = Array.from(buf.slice(0, header.length));

    if ((0, _isEqual2.default)(header, bufHeader)) {
      return type;
    }
  }
}

function getArrayBufferByURL(url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'arraybuffer';

    request.onload = function () {
      resolve(request.response);
    };

    request.onerror = function () {
      reject(new Error('Request error: ' + url));
    };

    request.send();
  });
}

function getBlob(arrayBuffer) {
  return new Blob([new Uint8Array(arrayBuffer)]);
}

function getImageHasAlpha(imageData, convolution = 1, sx = 0, sy = 0, dx = imageData.width, dy = imageData.height) {
  const {
    data,
    width,
    height
  } = imageData;

  if (convolution % 2 === 0) {
    throw new Error('convolution must be a odd number');
  }

  sx = Math.floor(sx);
  sy = Math.floor(sy);
  dx = Math.floor(dx);
  dy = Math.floor(dy);
  const radius = Math.min(Math.floor(convolution / 2), Math.floor(width / 2), Math.floor(height / 2));
  const step = Math.min(Math.max(radius * 2, 1));

  for (let y = sy + radius; y < dy; y += step) {
    for (let x = sx + radius; x < dx; x += step) {
      const index = y * width + x;
      const alpha = data[index * 4 + 3];
      const isAllowed = y !== height - 1 && y !== 0 && x !== 0 && x !== width - 1;

      if (alpha < 220 && isAllowed) {
        return true;
      }

      if (x + step >= dx && x !== dx - 1) {
        x = dx - 1 - step;
      }
    }

    if (y + step >= dy && y !== dy - 1) {
      y = dy - 1 - step;
    }
  }

  return false;
}

function getImageIsSolidColor(imageData, convolution = 1, sx = 0, sy = 0, dx = imageData.width, dy = imageData.height) {
  const {
    data,
    width,
    height
  } = imageData;
  let rgba = [];

  if (convolution % 2 === 0) {
    throw new Error('convolution must be a odd number');
  }

  sx = Math.floor(sx);
  sy = Math.floor(sy);
  dx = Math.floor(dx);
  dy = Math.floor(dy);
  const radius = Math.min(Math.floor(convolution / 2), Math.floor(width / 2), Math.floor(height / 2));
  const step = Math.min(Math.max(radius * 2, 1));

  for (let y = sy + radius; y < dy; y += step) {
    for (let x = sx + radius; x < dx; x += step) {
      const index = y * width + x;
      const r = data[index * 4 + 0];
      const g = data[index * 4 + 1];
      const b = data[index * 4 + 2];
      const a = data[index * 4 + 3];
      const isAllowed = y !== height - 1 && y !== 0 && x !== 0 && x !== width - 1;

      if (!rgba.length) {
        rgba = [r, g, b, a];
      } else if ((rgba[0] !== r || rgba[1] !== g || rgba[2] !== b || rgba[3] !== a) && isAllowed) {
        return false;
      }

      if (x + step >= dx && x !== dx - 1) {
        x = dx - 1 - step;
      }
    }

    if (y + step >= dy && y !== dy - 1) {
      y = dy - 1 - step;
    }
  }

  return rgba;
}

function getImageInfo(url) {
  return getArrayBufferByURL(url).then(arrayBuffer => {
    const blob = getBlob(arrayBuffer);
    const blobURL = URL.createObjectURL(blob);
    return _loader.default.loadImage(blobURL).then(img => ({
      width: img.width,
      height: img.height
    })).then(pixelSize => {
      URL.revokeObjectURL(blobURL);
      return { ...pixelSize,
        size: blob.size,
        type: getArrayBufferType(arrayBuffer)
      };
    });
  });
}