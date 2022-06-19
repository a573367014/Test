"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drawImageToCanvas = void 0;

const drawImageToCanvas = ({
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

exports.drawImageToCanvas = drawImageToCanvas;