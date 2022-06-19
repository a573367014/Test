async function loadImage(
    url,
    options = {
        crossOrigin: true,
    },
) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const clear = () => {
            img.onload = img.onerror = null;
        };

        if (options && options.crossOrigin) {
            img.crossOrigin = 'Anonymous';
        }

        img.onload = () => {
            clear();

            resolve(img);
        };

        img.onerror = () => {
            clear();

            reject(new Error('Image load error'));
        };

        img.src = url;
    });
}

function getImageDataLine(imgData, axes = 'x', offset = 0) {
    const isX = axes === 'x';
    const imgDataArr = imgData.data;
    const { width, height } = imgData;

    const len = isX ? width : height;
    const ret = new Array(len);

    for (let idx, i = 0; i < len; i++) {
        idx = isX ? 4 * (offset * width + i) : 4 * (i * width + offset);

        ret[i] = [imgDataArr[idx], imgDataArr[idx + 1], imgDataArr[idx + 2], imgDataArr[idx + 3]];
    }

    return ret;
}

const distanceColor = (c1, c2) => {
    let d = 0;

    for (let i = 0, len = c1.length; i < len; i++) {
        d += (c1[i] - c2[i]) * (c1[i] - c2[i]);
    }

    return Math.sqrt(d);
};

const isSimilarColor = (c1, c2, threshold = 5) => {
    return distanceColor(c1, c2) < threshold;
};

const isSimilarColorLine = (line1, line2) => {
    return line1.every((c1, i) => {
        return isSimilarColor(c1, line2[i]);
    });
};

const getStretchOffsetPoint = (imgData) => {
    const { width, height } = imgData;

    let yBaseLineOffset = Math.floor(width / 2);
    let xBaseLineOffset = Math.floor(height / 2);

    let xBaseLine = getImageDataLine(imgData, 'x', xBaseLineOffset);
    let yBaseLine = getImageDataLine(imgData, 'y', yBaseLineOffset);

    ['y', 'x'].forEach((axis) => {
        const baseLine = axis === 'x' ? xBaseLine : yBaseLine;
        const baseOffset = axis === 'x' ? xBaseLineOffset : yBaseLineOffset;
        const sizeProp = axis === 'x' ? height : width;

        let preBaseLine = baseLine;
        let nextBaseLine = baseLine;

        let preOffset = baseOffset - 1;
        let nextOffset = baseOffset + 1;

        const setFn = (i, line) => {
            if (axis === 'x') {
                xBaseLine = line;
                xBaseLineOffset = i;
            } else {
                yBaseLine = line;
                yBaseLineOffset = i;
            }
        };
        while (preOffset >= 0 || nextOffset < sizeProp) {
            if (preOffset >= 0) {
                const line = getImageDataLine(imgData, axis, preOffset);
                if (isSimilarColorLine(line, preBaseLine)) {
                    setFn(preOffset, preBaseLine);
                    break;
                }
                preBaseLine = line;
            }
            preOffset--;

            if (nextOffset < sizeProp) {
                const line = getImageDataLine(imgData, axis, nextOffset);
                if (isSimilarColorLine(line, nextBaseLine)) {
                    setFn(nextOffset, nextBaseLine);
                    break;
                }
                nextBaseLine = line;
            }
            nextOffset++;
        }
    });

    return {
        yBaseLineOffset,
        xBaseLineOffset,
        xBaseLine,
        yBaseLine,
    };
};

async function auto9PatchImage(urlOrImage, options = {}) {
    let img = urlOrImage;
    if (typeof urlOrImage === 'string') {
        img = await loadImage(urlOrImage);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = img;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const { xBaseLineOffset, yBaseLineOffset, xBaseLine, yBaseLine } =
        getStretchOffsetPoint(imgData);

    // remove duplicate areas
    const offsetData = {
        bottom: xBaseLineOffset + 1,
        right: yBaseLineOffset + 1,
        left: yBaseLineOffset,
        top: xBaseLineOffset,
    };

    Object.keys(offsetData).forEach(async (dir) => {
        const axes = dir === 'left' || dir === 'right' ? 'y' : 'x';
        const baseLine = axes === 'x' ? xBaseLine : yBaseLine;
        const isLowDir = dir === 'left' || dir === 'top';
        const end = isLowDir ? 0 : dir === 'right' ? width : height;
        const offset = isLowDir ? -1 : 1;

        for (let line, i = offsetData[dir] + offset; ; i += offset) {
            if (isLowDir && i < end) {
                break;
            } else if (!isLowDir && i > end) {
                break;
            }

            line = getImageDataLine(imgData, axes, i);

            if (!isSimilarColorLine(line, baseLine)) {
                break;
            }

            offsetData[dir] = i;
        }
    });

    // Create image
    const newCanvas = document.createElement('canvas');
    const newCtx = newCanvas.getContext('2d');

    const { left: oLeft, top: oTop, right: oRight, bottom: oBottom } = offsetData;
    const newHeight = oTop + 1 + (height - oBottom);
    const newWidth = oLeft + 1 + (width - oRight);

    newCanvas.width = newWidth;
    newCanvas.height = newHeight;

    // 缩小到最后，可能会出现 oLeft = 0 || oTop = 0
    const drawFn = (fn) => {
        try {
            fn();
        } catch (e) {}
    };

    // 4 角落
    drawFn(() => newCtx.putImageData(ctx.getImageData(0, 0, oLeft, oTop), 0, 0));
    drawFn(() =>
        newCtx.putImageData(ctx.getImageData(oRight, 0, width - oRight, oTop), oLeft + 1, 0),
    );
    drawFn(() =>
        newCtx.putImageData(
            ctx.getImageData(oRight, oBottom, width - oRight, height - oBottom),
            oLeft + 1,
            oTop + 1,
        ),
    );
    drawFn(() =>
        newCtx.putImageData(ctx.getImageData(0, oBottom, oLeft, height - oBottom), 0, oTop + 1),
    );

    // 4 Middle
    drawFn(() => newCtx.putImageData(ctx.getImageData(oLeft, 0, 1, oTop), oLeft, 0));
    drawFn(() =>
        newCtx.putImageData(ctx.getImageData(oRight, oTop, width - oRight, 1), oLeft + 1, oTop),
    );
    drawFn(() =>
        newCtx.putImageData(ctx.getImageData(oLeft, oBottom, 1, height - oBottom), oLeft, oTop + 1),
    );
    drawFn(() => newCtx.putImageData(ctx.getImageData(0, oTop, oLeft, 1), 0, oTop));

    // Center
    newCtx.putImageData(ctx.getImageData(oLeft, oTop, 1, 1), oLeft, oTop);

    let image;
    if(options.blobUrlEnable) {
        image = await new Promise(resolve => {
            canvas.toBlob((blob) => {
                return resolve(URL.createObjectURL(blob));
            });
        });
    }
    else {
        image = newCanvas.toDataURL();
    }

    return {
        image,
        height: newHeight,
        width: newWidth,
        offset: {
            bottom: oTop + 1,
            right: oLeft + 1,
            left: oLeft,
            top: oTop,
        },
    };
}

export default auto9PatchImage;
