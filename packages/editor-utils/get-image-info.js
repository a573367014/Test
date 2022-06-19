import { isEqual } from 'lodash';
import loader from './loader';

// TODO: Support more types
export function getArrayBufferType(arrayBuffer) {
    const buf = new Uint8Array(arrayBuffer);

    if (buf.length < 1) {
        return null;
    }

    const imageHeaderMap = {
        jpg: [0xff, 0xd8, 0xff],
        png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        gif: [0x47, 0x49, 0x46],
    };

    for (const type in imageHeaderMap) {
        const header = imageHeaderMap[type];
        const bufHeader = Array.from(buf.slice(0, header.length));
        if (isEqual(header, bufHeader)) {
            return type;
        }
    }
}

export function getArrayBufferByURL(url) {
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

export function getBlob(arrayBuffer) {
    return new Blob([new Uint8Array(arrayBuffer)]);
}

/**
 * 判断图片元素中是否有透明色
 * @param { ImageData } imageData - 图片元素
 * @param { number } convolution - 卷积大小，只能为奇数
 * @param { number } sx - 开始检查的 x 坐标
 * @param { number } sy - 开始检查的 y 坐标
 * @param { number } dx - 结束检查的 x 坐标
 * @param { number } dy - 结束检查的 y 坐标
 */
export function getImageHasAlpha(
    imageData,
    convolution = 1,
    sx = 0,
    sy = 0,
    dx = imageData.width,
    dy = imageData.height,
) {
    const { data, width, height } = imageData;

    if (convolution % 2 === 0) {
        throw new Error('convolution must be a odd number');
    }
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    dx = Math.floor(dx);
    dy = Math.floor(dy);
    const radius = Math.min(
        Math.floor(convolution / 2),
        Math.floor(width / 2),
        Math.floor(height / 2),
    );
    const step = Math.min(Math.max(radius * 2, 1));

    for (let y = sy + radius; y < dy; y += step) {
        for (let x = sx + radius; x < dx; x += step) {
            const index = y * width + x;
            const alpha = data[index * 4 + 3];
            // 上下左右第一个像素不做判断, 允许1个像素的误差
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

/**
 * 判断图片元素是否是单一颜色
 * @param { ImageData } imageData - 图片元素
 * @param { number } convolution - 卷积大小，只能为奇数
 * @param { number } sx - 开始检查的 x 坐标
 * @param { number } sy - 开始检查的 y 坐标
 * @param { number } dx - 结束检查的 x 坐标
 * @param { number } dy - 结束检查的 y 坐标
 */
export function getImageIsSolidColor(
    imageData,
    convolution = 1,
    sx = 0,
    sy = 0,
    dx = imageData.width,
    dy = imageData.height,
) {
    const { data, width, height } = imageData;
    let rgba = [];
    if (convolution % 2 === 0) {
        throw new Error('convolution must be a odd number');
    }
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    dx = Math.floor(dx);
    dy = Math.floor(dy);
    const radius = Math.min(
        Math.floor(convolution / 2),
        Math.floor(width / 2),
        Math.floor(height / 2),
    );
    const step = Math.min(Math.max(radius * 2, 1));

    for (let y = sy + radius; y < dy; y += step) {
        for (let x = sx + radius; x < dx; x += step) {
            const index = y * width + x;
            const r = data[index * 4 + 0];
            const g = data[index * 4 + 1];
            const b = data[index * 4 + 2];
            const a = data[index * 4 + 3];
            // 上下左右第一个像素不做判断, 允许1个像素的误差
            const isAllowed = y !== height - 1 && y !== 0 && x !== 0 && x !== width - 1;
            if (!rgba.length) {
                rgba = [r, g, b, a];
            } else if (
                (rgba[0] !== r || rgba[1] !== g || rgba[2] !== b || rgba[3] !== a) &&
                isAllowed
            ) {
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

export default function getImageInfo(url) {
    return getArrayBufferByURL(url).then((arrayBuffer) => {
        const blob = getBlob(arrayBuffer);
        const blobURL = URL.createObjectURL(blob);

        return loader
            .loadImage(blobURL)
            .then((img) => ({
                width: img.width,
                height: img.height,
            }))
            .then((pixelSize) => {
                URL.revokeObjectURL(blobURL);

                return {
                    ...pixelSize,
                    size: blob.size,
                    type: getArrayBufferType(arrayBuffer),
                };
            });
    });
}
