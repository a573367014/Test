import { createCanvas } from './canvas';
import loader from './loader';

// 根据 border-image 的绘制算法
// https://drafts.csswg.org/css-backgrounds-3/#border-image-process

function round(value) {
    return Math.round(value * 10000) / 10000;
}

function getArea(image, x, y, width, height, scaleX, scaleY, targetWidth, targetHeight, repeat) {
    const imageWidth = Math.max(Math.round(width * scaleX), 1);
    const imageHeight = Math.max(Math.round(height * scaleY), 1);
    const canvas = createCanvas(imageWidth, imageHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, y, width, height, 0, 0, imageWidth, imageHeight);
    const targetCanvas = createCanvas(targetWidth, targetHeight);
    const targetCtx = targetCanvas.getContext('2d');

    if (repeat === 'repeat') {
        let repeatColNum = Math.ceil(targetWidth / imageWidth);
        repeatColNum = repeatColNum - (repeatColNum % 2) + 1;
        let repeatRowNum = Math.ceil(targetHeight / imageHeight);
        repeatRowNum = repeatRowNum - (repeatRowNum % 2) + 1;
        const repeatCanvas = createCanvas(repeatColNum * imageWidth, repeatRowNum * imageHeight);
        const repeatCtx = repeatCanvas.getContext('2d');
        repeatCtx.fillStyle = ctx.createPattern(canvas, repeat);
        repeatCtx.fillRect(0, 0, repeatCanvas.width, repeatCanvas.height);
        const offsetX = (repeatCanvas.width - targetCanvas.width) / 2;
        const offsetY = (repeatCanvas.height - targetCanvas.height) / 2;
        targetCtx.drawImage(
            repeatCanvas,
            offsetX,
            offsetY,
            targetWidth,
            targetHeight,
            0,
            0,
            targetWidth,
            targetHeight,
        );
    } else if (repeat === 'round') {
        const roundColNum = Math.max(1, Math.round(targetWidth / imageWidth));
        const roundRowNum = Math.max(1, Math.round(targetHeight / imageHeight));

        const roundWidth = Math.round(targetWidth / roundColNum);
        const roundHeight = Math.round(targetHeight / roundRowNum);
        const roundCanvas = createCanvas(roundWidth, roundHeight);
        const roundCtx = roundCanvas.getContext('2d');
        roundCtx.drawImage(canvas, 0, 0, roundWidth, roundHeight);
        targetCtx.fillStyle = ctx.createPattern(roundCanvas, 'repeat');
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
    }

    return targetCanvas;
}

export default async function autoStretchImage(
    urlOrImage,
    { canvas, targetWidth, targetHeight, imageSlice, targetImageSlice, repeat = 'repeat' },
) {
    let image = urlOrImage;
    if (typeof urlOrImage === 'string') {
        image = await loader.loadImage(urlOrImage);
    }

    const { width: imageWidth, height: imageHeight } = image;
    // const cache = {
    //     targetWidth,
    //     targetHeight,
    // };

    // 保持 image 能用原尺寸绘制，否则缩放后 imageSlice 会有精度问题
    // const ratio = Math.min(1, targetWidth / imageWidth, targetHeight / imageHeight);
    // targetWidth = Math.round(targetWidth / ratio);
    // targetHeight = Math.round(targetHeight / ratio);
    canvas = canvas || createCanvas(targetWidth, targetHeight);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    const { left, top, right, bottom } = imageSlice;
    let {
        left: targetLeft,
        top: targetTop,
        bottom: targetBottom,
        right: targetRight,
    } = targetImageSlice;
    targetLeft = Math.round(targetLeft);
    targetTop = Math.round(targetTop);
    targetBottom = Math.round(targetBottom);
    targetRight = Math.round(targetRight);
    if (targetLeft + targetRight >= targetWidth) {
        const xSum = targetLeft + targetRight;
        targetLeft = Math.floor(targetWidth * (targetLeft / xSum));
        targetRight = Math.floor(targetWidth * (targetRight / xSum));
        targetTop = Math.floor((targetTop * targetWidth) / xSum);
        targetBottom = Math.floor((targetBottom * targetWidth) / xSum);
    }

    if (targetTop + targetBottom >= targetHeight) {
        const ySum = targetTop + targetBottom;
        targetTop = Math.floor(targetHeight * (targetTop / ySum));
        targetBottom = Math.floor(targetHeight * (targetBottom / ySum));
        targetLeft = Math.floor((targetLeft * targetHeight) / ySum);
        targetRight = Math.floor((targetRight * targetHeight) / ySum);
    }
    // 绘制四个角
    // 左上
    if (targetLeft > 0 && targetTop > 0) {
        ctx.drawImage(image, 0, 0, left, top, 0, 0, targetLeft, targetTop);
    }
    // 右上
    if (targetTop > 0 && targetRight > 0) {
        ctx.drawImage(
            image,
            imageWidth - right,
            0,
            right,
            top,
            targetWidth - targetRight,
            0,
            targetRight,
            targetTop,
        );
    }

    // 左下
    if (targetLeft > 0 && targetBottom > 0) {
        ctx.drawImage(
            image,
            0,
            imageHeight - bottom,
            left,
            bottom,
            0,
            targetHeight - targetBottom,
            targetLeft,
            targetBottom,
        );
    }

    // 右下
    if (targetRight > 0 && targetBottom > 0) {
        ctx.drawImage(
            image,
            imageWidth - right,
            imageHeight - bottom,
            right,
            bottom,
            targetWidth - targetRight,
            targetHeight - targetBottom,
            targetRight,
            targetBottom,
        );
    }

    const xSize = Math.max(round(imageWidth - left - right), 0);
    const ySize = Math.max(round(imageHeight - top - bottom), 0);
    const targetXSize = Math.max(round(targetWidth - targetLeft - targetRight), 0);
    const targetYSize = Math.max(round(targetHeight - targetTop - targetBottom), 0);
    // 绘制四个边
    if (targetXSize > 0 && xSize > 0) {
        // 上
        if (targetTop > 0 && top > 0) {
            const topArea = getArea(
                image,
                left,
                0,
                xSize,
                top,
                targetTop / top,
                targetTop / top,
                targetXSize,
                targetTop,
                repeat,
                'x',
            );
            ctx.drawImage(topArea, targetLeft, 0);
        }
        // 下
        if (targetBottom > 0 && bottom > 0) {
            const bottomArea = getArea(
                image,
                left,
                imageHeight - bottom,
                xSize,
                bottom,
                targetBottom / bottom,
                targetBottom / bottom,
                targetXSize,
                targetBottom,
                repeat,
                'x',
            );
            ctx.drawImage(bottomArea, targetLeft, targetHeight - targetBottom);
        }
    }

    if (targetYSize > 0 && ySize > 0) {
        // 右
        if (targetRight > 0 && right > 0) {
            const rightArea = getArea(
                image,
                imageWidth - right,
                top,
                right,
                ySize,
                targetRight / right,
                targetRight / right,
                targetRight,
                targetYSize,
                repeat,
                'y',
            );
            ctx.drawImage(rightArea, targetWidth - targetRight, targetTop);
        }
        // 左
        if (targetLeft > 0 && left > 0) {
            const leftArea = getArea(
                image,
                0,
                top,
                left,
                ySize,
                targetLeft / left,
                targetLeft / left,
                targetLeft,
                targetYSize,
                repeat,
                'y',
            );
            ctx.drawImage(leftArea, 0, targetTop);
        }
    }

    if (targetXSize > 0 && xSize > 0 && targetYSize > 0 && ySize > 0) {
        // 绘制中间
        const targetXScale = targetXSize / xSize;
        const targetYScale = targetYSize / ySize;
        const centerArea = getArea(
            image,
            left,
            top,
            xSize,
            ySize,
            targetXScale,
            targetYScale,
            targetXSize,
            targetYSize,
            repeat,
        );
        ctx.drawImage(centerArea, targetLeft, targetTop);
    }

    return canvas;
}
