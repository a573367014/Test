"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImageEffectFillImage = getImageEffectFillImage;

var _transform = require("./transform");

var _resizeImage = _interopRequireDefault(require("../../resize-image"));

const mapCacheImage = {};

const getCacheKey = (imageContent, targetSize) => {
  return '' + imageContent.width + imageContent.height + imageContent.image + imageContent.repeat + imageContent.scaleX + imageContent.scaleY + imageContent.type + targetSize.width + targetSize.height;
};

async function getImageEffectFillImage(imageContent, targetSize, envContext) {
  var _ref, _ref2;

  const cacheKey = getCacheKey(imageContent, targetSize);

  if (mapCacheImage[cacheKey]) {
    return mapCacheImage[cacheKey];
  }

  let loadedImage;

  if (typeof imageContent.image === 'object') {
    loadedImage = imageContent.image;
  } else {
    loadedImage = await envContext.loadImage(imageContent.image);
  }

  const tsf = (0, _transform.getFillTransform)(imageContent.type, {
    width: loadedImage.width,
    height: loadedImage.height
  }, targetSize, {
    scaleX: imageContent.scaleX,
    scaleY: imageContent.scaleY
  });
  const clipCanvas = envContext.createCanvas((_ref = loadedImage.width * tsf[0]) !== null && _ref !== void 0 ? _ref : 100, (_ref2 = loadedImage.height * tsf[3]) !== null && _ref2 !== void 0 ? _ref2 : 100);
  const clipImage = await (0, _resizeImage.default)(loadedImage, clipCanvas, {
    alpha: true
  });
  const canvas = envContext.createCanvas(targetSize.width, targetSize.height);
  const ctx = canvas.getContext('2d');

  if (imageContent.type === 'tiled' || !imageContent.type) {
    ctx.fillStyle = ctx.createPattern(clipImage, 'repeat');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(clipImage, tsf[4], tsf[5]);
  }

  mapCacheImage[cacheKey] = canvas;
  return canvas;
}