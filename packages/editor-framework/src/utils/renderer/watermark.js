import loader from '@gaoding/editor-utils/loader';
import { getRepeatPatternCanvas } from '@gaoding/editor-utils/canvas';

export function checkNoRepeat(width, height) {
    return width <= 300 && Math.abs(1 - width / height) < 0.2;
}

export function getLayoutWatermark(width, height, options) {
    const isNoRepeat = checkNoRepeat(width, height);
    const url = options.watermarkImages[isNoRepeat ? 'layoutNoRepeat' : 'layoutRepeat'];

    return url;
}

export function renderLayoutWatermark(layout, ctx, options) {
    const { width, height } = layout;
    const isNoRepeat = checkNoRepeat(width, height);
    const url = getLayoutWatermark(width, height, options);

    return loader.loadImage(url).then((img) => {
        if (!isNoRepeat) {
            const patternCanvas = getRepeatPatternCanvas(img, { width, height, ratio: 1 });
            ctx.drawImage(patternCanvas, 0, 0);
        } else {
            const radio = Math.max(width / img.width, height / img.height);
            const sWidth = img.width * radio;
            const sHeight = img.height * radio;
            ctx.drawImage(img, (width - sWidth) / 2, (height - sHeight) / 2, sWidth, sHeight);
        }
    });
}
