/**
 * utils/canvas
 */

import resizeImage from './resize-image';
import utilsLoader from './loader';

const { sin, cos, atan, sqrt, round } = Math;

export const createCanvas = (width = 0, height = 0, offscreenCanvas) => {
    const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    if (offscreenCanvas && isChrome && window.OffscreenCanvas) {
        return new OffscreenCanvas(round(width), round(height));
    }

    const canvas = document.createElement('canvas');

    // 手动处理宽高，否则 canvas 将向下取整
    canvas.height = round(height);
    canvas.width = round(width);

    return canvas;
};

export const cleanupCanvasMemory = (canvas) => {
    if (canvas.getContext) {
        canvas.width = 0;
        canvas.height = 0;
    }
};

export const resizeImageByCanvas = (
    image,
    width = 100,
    height = 100,
    resizeOptions = {},
    usePica = true,
) => {
    const canvas = createCanvas(width, height);

    if (!usePica) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        return Promise.resolve(canvas);
    }

    return resizeImage(image, canvas, resizeOptions);
};

export const drawImageToCanvas = (
    canvas,
    image,
    imageCenter,
    imageSize,
    imageRotation,
    blendMode = 'source-in',
) => {
    const context = canvas.getContext('2d');

    context.globalCompositeOperation = blendMode;

    const imageRadius =
        sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height) / 2;
    const turn = atan(imageSize.height / imageSize.width);

    const x = round(imageCenter.x - cos(imageRotation + turn) * imageRadius);
    const y = round(imageCenter.y - sin(imageRotation + turn) * imageRadius);

    context.translate(x, y);
    context.rotate(imageRotation);
    context.drawImage(image, 0, 0, imageSize.width, imageSize.height);

    // Reset current transformation matrix to the identity matrix.
    context.setTransform(1, 0, 0, 1, 0, 0);

    return canvas;
};

export const getRepeatPatternCanvas = (img, { width, height, ratio = 1 }) => {
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    const resizeSize =
        width / height > 1
            ? [(imgWidth * height) / imgHeight, height]
            : [width, (imgHeight * width) / imgWidth];

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

export const canvasHasOpacity = (canvas, context) => {
    let hasOpacity = false;
    let pixels = null;

    // canvas
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

export const imageHasOpacity = (image) => {
    const maxSize = 1000;
    const ratio = Math.min(1, Math.min(maxSize / image.width, maxSize / image.height));
    const canvas = createCanvas(image.width * ratio, image.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width * ratio, image.height * ratio);

    return canvasHasOpacity(canvas, ctx);
};

export const imageUrlHasOpacity = async (url) => {
    if (!/.png$/.test(url)) {
        return false;
    }
    const img = await utilsLoader._loadImage(url);
    return imageHasOpacity(img);
};

export const newDrawImageToCanvas = ({
    canvas,
    image,
    width,
    height,
    naturalWidth,
    naturalHeight,
    imageTransformArray,
    blendMode = 'source-out',
    mask,
}) => {
    // 中心点对齐
    const initTranslate = {
        x: (naturalWidth - width) / 2,
        y: (naturalHeight - height) / 2,
    };

    const imageSize = {
        width: naturalWidth,
        height: naturalHeight,
        cx: naturalWidth / 2,
        cy: naturalHeight / 2,
    };

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    // if(imageSmoothingEnabled !== undefined) {
    //     ctx.imageSmoothingEnabled = true;
    // }

    mask && ctx.drawImage(mask, 0, 0, width, height);
    //
    ctx.globalCompositeOperation = blendMode;

    // 先让图片跟元素中心点对齐
    // 再以图片中心为 trsansform 锚点
    ctx.translate(-initTranslate.x + imageSize.cx, -initTranslate.y + imageSize.cy);
    ctx.transform(
        ...imageTransformArray.map((v, i) => {
            return i > 3 ? v : v;
        }),
    );
    ctx.translate(-imageSize.cx, -imageSize.cy);

    ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas;
};
