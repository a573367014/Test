import Promise from 'bluebird';
import { isEqual, uniq } from 'lodash';
import {
    createCanvas,
    newDrawImageToCanvas,
    cleanupCanvasMemory,
} from '@gaoding/editor-utils/canvas';
import { isMobile } from '@gaoding/editor-utils/ua';
import { sendMessage } from '@gaoding/editor-utils/post-message';
import Worker from '@gaoding/editor-utils/export/gif-apng.worker-vite';
import editorDefaults from '../base/editor-defaults';
import loader from '@gaoding/editor-utils/loader';

const _isMobile = isMobile();
/**
 * 获取当前尺寸最大帧数限制
 * @param {Number} w 宽度
 * @param {Number} h 高度
 */
export const getMaxFramesLength = (w, h) => {
    if (w > 1600 || h > 1600) {
        return _isMobile ? 15 : 30;
    } else if (w > 1000 || h > 1000) {
        return _isMobile ? 20 : 40;
    } else if (w > 700 || h > 700) {
        return _isMobile ? 40 : 70;
    } else {
        return _isMobile ? 40 : 100;
    }
};

/**
 * 获取指定时间的集合帧
 * @param {Array<Array|Object>} listData 包含各帧元素数组的集合
 * @param {currentTime} currentTime 制定时间(ms)
 * @return {Array<Object} 帧元素数组
 */
export function seekFrame(listData, currentTime) {
    const result = [];
    listData.forEach((data) => {
        if (!Array.isArray(data)) {
            result.push(data);
            return;
        }

        let curFrame;
        data.some((frame) => {
            const startTime = frame.startTime;

            if (startTime > currentTime) {
                return true;
            } else if (startTime <= currentTime) {
                curFrame = frame;
                return false;
            }

            return false;
        });

        result.push({ ...curFrame });
    });

    return result;
}

/**
 * 裁剪帧
 * @param {element>} element 当前元素
 * @param {HTMLCanvasElement} frameCanvas gif 元素的某一帧
 * @return {HTMLCanvasElement} 裁剪后的画布
 */
export async function clipFrame(element, frameCanvas) {
    const {
        width,
        height,
        imageTransform,
        naturalWidth,
        naturalHeight,
        $imageWidth,
        $imageHeight,
    } = element;
    if (
        element.width === $imageWidth &&
        element.height === $imageHeight &&
        isEqual(element.imageTransform.toJSON(), editorDefaults.element.transform)
    ) {
        return frameCanvas;
    }

    const mask = element.mask ? await loader.loadImage(element.mask) : null;

    return newDrawImageToCanvas({
        canvas: createCanvas(width, height),
        image: frameCanvas,
        mask,
        width,
        height,
        naturalWidth,
        naturalHeight,
        imageTransformArray: imageTransform.toArray(),
        blendMode: mask ? 'source-in' : 'source-over',
        imageSmoothingEnabled: false,
    });
}

/**
 * 合并帧
 * @param {Array<Array|element>} elementCanvasList 元素集合
 * @param {Object} options - 参数对象
 * @param {Number} options.canvasWidth layout宽度
 * @param {Number} options.canvasHeight layout高度
 * @return {Array} 新的帧数组
 */
export function combineFrames(elementCanvasList, { canvasWidth, canvasHeight } = {}) {
    // 获取 gif 的结束时长
    const framesList = elementCanvasList.filter(Array.isArray);
    if (!framesList.length) return elementCanvasList;

    const endTimes = framesList.map((frames) => {
        let i = 0;
        const totalTime = frames.reduce((time, frame) => {
            frame.i = i;
            i++;
            return time + frame.delay;
        }, 0);
        return totalTime;
    });

    // 最大时长
    const maxEndTime = Math.max(...endTimes);

    // gif 不满足最大时长取头部帧进行填补
    endTimes.forEach((time, index) => {
        const frames = framesList[index].slice();
        const ratio = Math.ceil(maxEndTime / time);
        for (let i = 1; i < ratio; i++) {
            const copyFrames = frames.map((item) => ({ ...item }));
            framesList[index].push(...copyFrames);
        }
    });
    // 每帧开始时间，也说明需合成多少帧
    let startTimes = [];

    // 分别记录并提取每帧开始时间
    framesList.forEach((frames) => {
        frames.reduce((time, frame) => {
            // 开始时间不能>=最大时长
            frame.startTime = time;
            if (time >= maxEndTime) return time + frame.delay;
            startTimes.push(time);
            return time + frame.delay;
        }, 0);
    });

    startTimes = uniq(startTimes).sort((a, b) => a - b);

    const newFrames = [];
    // 根据时间段合成每一帧
    startTimes.forEach((time, i) => {
        const nextTime = startTimes[i + 1] === undefined ? maxEndTime : startTimes[i + 1];
        const frameLayers = seekFrame(elementCanvasList, time);
        // chrome 最小为0.02s的帧延迟，低于此值是会默认向上舍入为0.10s。
        const delay = Math.max(30, nextTime - time);
        frameLayers.forEach((item) => {
            if (item.delay !== undefined) {
                item.delay = delay;
            }
        });

        newFrames.push(frameLayers);
    });

    // 大于限制时抽帧
    const maxFramesLength = getMaxFramesLength(canvasWidth, canvasHeight);
    if (maxFramesLength - newFrames.length < 0) {
        return getSampleFrames(newFrames, maxFramesLength - newFrames.length);
    }
    return newFrames;
}

/**
 * 解析获取元素中的 gif 帧数组并绘制成canvas
 * @param {element} element 元素
 * @param {Object} options - 参数对象
 * @param {Number} options.canvasWidth layout宽度
 * @param {Number} options.canvasHeight layout高度
 * @param {lazy} options.lazy canvas是否惰性获取，节省内存等性能
 * @return {Array} 当前元素 gif 帧数组
 */
export function getFrames(element, { decode, canvasWidth, canvasHeight, lazy = false } = {}) {
    if (element.type === 'video') {
        return getVideoFrames(element, { canvasWidth, canvasHeight });
    }

    const maxFramesLength = getMaxFramesLength(canvasWidth, canvasHeight);
    return Promise.try(() => {
        return decode ? decode(element) : decodeGifOrApng(element, { needBuffer: true });
    }).then(async (result) => {
        if (maxFramesLength - result.frames.length < 0) {
            result.frames = getSampleFrames(result.frames, maxFramesLength - result.frames.length);
        }

        return Promise.map(result.frames, async (item, i) => {
            const lazyFn = async () => {
                const canvas = createCanvas(result.width, result.height);
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(result.width, result.height);

                if (item.buffer) {
                    const uint8 = new Uint8Array(item.buffer);
                    imageData.data.set(uint8);
                    ctx.putImageData(imageData, 0, 0);
                    if (i !== 0 && item.delay === 0) {
                        item.delay = 10;
                    }
                } else if (item.image) {
                    ctx.drawImage(item.image, 0, 0);
                }

                const clipCanvas = await clipFrame(element, canvas);
                clipCanvas !== canvas && cleanupCanvasMemory(canvas);

                if (
                    clipCanvas.width === Math.round(element.width) &&
                    clipCanvas.height === Math.round(element.height)
                ) {
                    return clipCanvas;
                }

                const newCanvas = createCanvas(element.width, element.height);
                const newCtx = newCanvas.getContext('2d');
                newCtx.drawImage(clipCanvas, 0, 0, element.width, element.height);
                cleanupCanvasMemory(clipCanvas);

                return newCanvas;
            };

            return {
                delay: element.isGif ? item.delay * 10 : item.delay,
                canvas: lazy ? () => lazyFn() : await lazyFn(),
            };
        });
    });
}

export function seekVideoCanvas({ time, video, width, height } = {}) {
    video.currentTime = time;
    return new Promise((resolve) => {
        video.ontimeupdate = resolve;
    }).then(() => {
        width = width || video.videoWidth;
        height = height || video.videoHeight;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        return canvas;
    });
}
export async function getVideoFrames(element, { canvasWidth, canvasHeight } = {}) {
    const maxFramesLength = getMaxFramesLength(canvasWidth, canvasHeight);
    const { naturalDuration, url } = element;
    const delay = 100;

    let frames = [];
    let currentTime = 0;

    for (let i = 0; i < naturalDuration / delay; i++) {
        frames.push({
            delay: (i + 1) * delay > naturalDuration ? naturalDuration % 100 : delay,
            currentTime,
        });
        currentTime += delay;
    }

    if (maxFramesLength - frames.length < 0) {
        frames = getSampleFrames(frames, maxFramesLength - frames.length);
    }

    const video = await loader._loadVideo(url);
    const useVideoSize =
        video.videoWidth * video.videoHeight < element.$imageWidth * element.$imageHeight;

    frames = await Promise.mapSeries(frames, (frame) => {
        return seekVideoCanvas({
            time: frame.currentTime / 1000,
            video,
            width: useVideoSize ? video.videoWidth : element.$imageWidth,
            height: useVideoSize ? video.videoHeight : element.$imageHeight,
        })
            .then((canvas) => {
                return clipFrame(element, canvas);
            })
            .then((canvas) => {
                frame.canvas = canvas;
                return frame;
            });
    });

    return frames;
}

/**
 * 转为 buffer
 *
 * @export
 * @param {String} url
 * @returns {Buffer}
 */
export async function toArrayBuffer(url) {
    const fetchedSourceImage = await fetch(url);
    const arrayBuffer = await fetchedSourceImage.arrayBuffer();

    return new Uint8Array(arrayBuffer);
}

/**
 * 抽帧、补帧
 * @export
 * @param {Array} frames 帧数组
 * @param {Number} diffLength 小于 0 为抽帧，大于 0 为补帧
 * @returns {Array} 新的帧数组
 */
export function getSampleFrames(frames, diffLength) {
    frames = frames.slice();
    // 排除头尾两帧
    const frameLength = frames.length - 2;
    const absDiffLength = Math.abs(diffLength);
    const indexs = [];

    for (let i = 0; i < absDiffLength; i++) {
        const index = Math.round(((i + 1) * frameLength) / absDiffLength);
        indexs.push(index);
    }

    if (diffLength < 0) {
        // 抽帧
        let totalDelay = 0;
        indexs.reverse().forEach((index) => {
            const frame = frames[index];
            totalDelay += frame.delay !== undefined ? frame.delay : frames[index][0].delay;
            frames.splice(index, 1);
        });

        // 将时间分摊给剩下的帧
        const addDelay = Math.round(totalDelay / frames.length);
        frames.forEach((layers) => {
            if (!Array.isArray(layers) && layers.delay !== undefined) {
                layers.delay += addDelay;
            } else if (Array.isArray(layers)) {
                layers.forEach((item) => {
                    if (item.delay !== undefined) {
                        item.delay += addDelay;
                    }
                });
            }
        });
    } else if (diffLength > 0) {
        // 补帧
        indexs.reverse().forEach((index) => {
            frames.splice(index, 0, frames[index]);
        });
    }

    return frames;
}

/**
 * 解析获取元素中的 gif 帧数组并绘制成canvas
 * @param {element} element 元素
 * @param {Object} options - 参数对象
 * @param {Boolean} options.toRGBA8 buffers是否转成rgba8
 * @return {Object} 解析结果对象
 */
export async function decodeGifOrApng(element, { needBuffer } = {}) {
    const buffer = await toArrayBuffer(element.url);
    let result = {};
    const worker = new Worker();
    const data = {
        type: element.isGif ? 'gif' : 'apng',
        buffer,
        needBuffer,
    };

    result = await sendMessage('decodeGifOrApng', data, worker);
    worker.terminate();

    // 计算总时长单位 ms
    let totalDuration = 0;
    const defaultDelahy = element.isApng ? 100 : 10;
    result.frames.forEach((frame) => {
        // delay 可能为 0 的情况
        frame.delay = frame.delay || defaultDelahy;
        totalDuration += frame.delay;
    });

    result.duration = element.isGif ? totalDuration * 10 : totalDuration;

    return result;
}
