"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resizeImageByCanvas = exports.newDrawImageToCanvas = exports.imageUrlHasOpacity = exports.imageHasOpacity = exports.getRepeatPatternCanvas = exports.drawImageToCanvas = exports.createCanvas = exports.cleanupCanvasMemory = exports.canvasHasOpacity = void 0;

var _resizeImage = _interopRequireDefault(require("./resize-image"));

var _loader = _interopRequireDefault(require("./loader"));

const {
  sin,
  cos,
  atan,
  sqrt,
  round
} = Math;

const createCanvas = (width = 0, height = 0, offscreenCanvas) => {
  const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

  if (offscreenCanvas && isChrome && window.OffscreenCanvas) {
    return new OffscreenCanvas(round(width), round(height));
  }

  const canvas = document.createElement('canvas');
  canvas.height = round(height);
  canvas.width = round(width);
  return canvas;
};

exports.createCanvas = createCanvas;

const cleanupCanvasMemory = canvas => {
  if (canvas.getContext) {
    canvas.width = 0;
    canvas.height = 0;
  }
};

exports.cleanupCanvasMemory = cleanupCanvasMemory;

const resizeImageByCanvas = (image, width = 100, height = 100, resizeOptions = {}, usePica = true) => {
  const canvas = createCanvas(width, height);

  if (!usePica) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    return Promise.resolve(canvas);
  }

  return (0, _resizeImage.default)(image, canvas, resizeOptions);
};

exports.resizeImageByCanvas = resizeImageByCanvas;

const drawImageToCanvas = (canvas, image, imageCenter, imageSize, imageRotation, blendMode = 'source-in') => {
  const context = canvas.getContext('2d');
  context.globalCompositeOperation = blendMode;
  const imageRadius = sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height) / 2;
  const turn = atan(imageSize.height / imageSize.width);
  const x = round(imageCenter.x - cos(imageRotation + turn) * imageRadius);
  const y = round(imageCenter.y - sin(imageRotation + turn) * imageRadius);
  context.translate(x, y);
  context.rotate(imageRotation);
  context.drawImage(image, 0, 0, imageSize.width, imageSize.height);
  context.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
};

exports.drawImageToCanvas = drawImageToCanvas;

const getRepeatPatternCanvas = (img, {
  width,
  height,
  ratio = 1
}) => {
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  const resizeSize = width / height > 1 ? [imgWidth * height / imgHeight, height] : [width, imgHeight * width / imgWidth];
  const resizeCanvas = createCanvas(resizeSize[0] * ratio, resizeSize[1] * ratio);
  const resizeCtx = resizeCanvas.getContext('2d');
  resizeCtx.drawImage(img, 0, 0, resizeSize[0] * ratio, resizeSize[1] * ratio);
  const temCanvas = createCanvas(width, height);
  const temCtx = temCanvas.getContext('2d');
  const pattern = temCtx.createPattern(resizeCanvas, 'repeat');
  temCtx.fillStyle = pattern;
  temCtx.fillRect(0, 0, width, height);
  return temCanvas;
};

exports.getRepeatPatternCanvas = getRepeatPatternCanvas;

const canvasHasOpacity = (canvas, context) => {
  let hasOpacity = false;
  let pixels = null;
  pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  pixels = pixels.data;
  let index = pixels.length - 1;

  while (index > 0) {
    if (pixels[index] !== 255) {
      hasOpacity = true;
      break;
    }

    index -= 4;
  }

  return hasOpacity;
};

exports.canvasHasOpacity = canvasHasOpacity;

const imageHasOpacity = image => {
  const maxSize = 1000;
  const ratio = Math.min(1, Math.min(maxSize / image.width, maxSize / image.height));
  const canvas = createCanvas(image.width * ratio, image.height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width * ratio, image.height * ratio);
  return canvasHasOpacity(canvas, ctx);
};

exports.imageHasOpacity = imageHasOpacity;

const imageUrlHasOpacity = async url => {
  if (!/.png$/.test(url)) {
    return false;
  }

  const img = await _loader.default._loadImage(url);
  return imageHasOpacity(img);
};

exports.imageUrlHasOpacity = imageUrlHasOpacity;

const newDrawImageToCanvas = ({
  canvas,
  image,
  width,
  height,
  naturalWidth,
  naturalHeight,
  imageTransformArray,
  blendMode = 'source-out',
  mask
}) => {
  const initTranslate = {
    x: (naturalWidth - width) / 2,
    y: (naturalHeight - height) / 2
  };
  const imageSize = {
    width: naturalWidth,
    height: naturalHeight,
    cx: naturalWidth / 2,
    cy: naturalHeight / 2
  };
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  mask && ctx.drawImage(mask, 0, 0, width, height);
  ctx.globalCompositeOperation = blendMode;
  ctx.translate(-initTranslate.x + imageSize.cx, -initTranslate.y + imageSize.cy);
  ctx.transform(...imageTransformArray.map((v, i) => {
    return i > 3 ? v : v;
  }));
  ctx.translate(-imageSize.cx, -imageSize.cy);
  ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
};

exports.newDrawImageToCanvas = newDrawImageToCanvas;