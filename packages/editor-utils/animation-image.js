import { createCanvas } from './canvas';
import upng from './export/upng';

/**
 * @typedef Frame 帧信息
 * @property { Number } delay 帧开始时间
 * @property { Number } duration 帧持续时间
 * @property { HTMLCanvasElement } canvas 帧画布
 */

const cachedAnimeImgData = new Map();

/**
 * 加载动态贴纸数据并缓存
 * @param { String } url - apng 图片地址
 * @returns { Promise<{ frames: Array<Frame>, width: Number, height: Number, duration: Number }> }
 */
export function loadAnimeImgData(url) {
    if (cachedAnimeImgData.has(url)) {
        const data = cachedAnimeImgData.get(url);
        return Promise.resolve(data);
    } else {
        return decodeAPNG(url).then((data) => {
            cachedAnimeImgData.set(url, data);
            return data;
        });
    }
}

/**
 * 获取帧序列中的当前时间的对应帧
 * @param { Frame[] } frames 帧序列
 * @param { Number } currentTime 当前时间
 * @param { Number } duration 帧动画总时长
 * @param { Boolean | Number } loop 动画是否循环
 * @return { Frame | null }
 */
export function getCurrentFrame(frames, currentTime, duration, loop) {
    if (typeof loop === 'boolean') {
        loop = loop ? 0 : 1;
    }

    // TODO: 支持循环次数
    const seekTime = loop !== 1 ? currentTime % duration : currentTime;
    let currentFrame;

    if (seekTime >= duration) {
        currentFrame = frames[frames.length - 1];
    } else {
        currentFrame = frames.find((frame) => {
            const { delay, duration } = frame;
            return delay <= seekTime && delay + duration >= seekTime;
        });
    }

    return currentFrame || null;
}

/**
 * 解析 apng
 * @param { String } url - apng 图片地址
 * @returns { Promise<{ frames: Array<Frame>, width: Number, height: Number, duration: Number }> }
 */
export async function decodeAPNG(url) {
    const buffer = await fetch(url).then((res) => res.arrayBuffer());
    const apng = upng.decode(buffer);
    // 像素数据
    const rgbaList = upng.toRGBA8(apng);
    const { width, height } = apng;

    const frames = [];
    // 总时长
    let totalDuration = 0;
    const len = rgbaList.length;
    for (let i = 0; i < len; i++) {
        const rgba = rgbaList[i];
        const originFrame = apng.frames[i];
        // 一帧的时长
        const duration = originFrame.delay;
        const buffer = new Uint8ClampedArray(rgba);
        const imageData = new ImageData(buffer, width, height);
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0);
        const frame = {
            canvas,
            duration,
            delay: totalDuration,
        };
        frames.push(frame);
        totalDuration += duration;
    }
    return {
        width,
        height,
        duration: totalDuration,
        frames,
    };
}
