"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bloburlToBlob = bloburlToBlob;
exports.canvasToBlob = canvasToBlob;
exports.dataurlToBlob = dataurlToBlob;
exports.default = void 0;
exports.isBlobUrl = isBlobUrl;
exports.isDataUrl = isDataUrl;
const dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
const blobURLPattern = /^blob:/;

function dataurlToBlob(dataURL) {
  const matches = dataURL.match(dataURLPattern);

  if (!matches) {
    throw new Error('invalid data URI');
  }

  const mediaType = matches[2] ? matches[1] : 'text/plain' + (matches[3] || ';charset=US-ASCII');
  const isBase64 = !!matches[4];
  const dataString = dataURL.slice(matches[0].length);
  const byteString = isBase64 ? atob(dataString) : decodeURIComponent(dataString);
  const byteStringLen = byteString.length;
  const arrayBuffer = new ArrayBuffer(byteStringLen);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteStringLen; i += 1) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], {
    type: mediaType
  });
}

async function bloburlToBlob(blobURL) {
  const matches = blobURL.match(blobURLPattern);

  if (!matches) {
    throw new Error('invalid blob URI');
  }

  const result = await fetch(blobURL);
  return result.blob();
}

function isDataUrl(url) {
  const isBase64 = url && url.includes(';base64');
  return isBase64;
}

function isBlobUrl(url) {
  const isBlob = url && url.includes('blob:');
  return isBlob;
}

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob));
  });
}

var _default = {
  isDataUrl,
  isBlobUrl,
  dataurlToBlob,
  bloburlToBlob
};
exports.default = _default;