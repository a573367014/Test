import UPNG from './upng';
import UGIF from './ugif';

const ctx = self;
ctx.onmessage = function (magicRequest) {
    const { asyncId, type, data } = magicRequest.data;
    if (!asyncId) return;

    // 解码 Gif Apng
    if (type === 'decodeGifOrApng') {
        const { buffer, type, needBuffer } = data;
        const isGif = type === 'gif';

        const parser = isGif ? UGIF : UPNG;
        const result = parser.decode(buffer);

        if (needBuffer) {
            const buffers = parser.toRGBA8(result);
            result.frames.forEach((item, i) => {
                delete item.d;
                item.index = i;
                item.buffer = buffers[i];
            });
        }

        // 避免 unit8Array 传输进行数据克隆，导致溢出
        delete result.data;
        result.frames.forEach((item) => {
            delete item.d;
        });

        const framesLength = result.frames.length;
        // 避免内容过大导致内存异常(当尺寸大于 1500 * 1500 或者超过 100帧)
        if (needBuffer && (result.width > 1500 || result.height > 1500 || framesLength > 100)) {
            result.frames.forEach((item, i) => {
                ctx.postMessage({
                    payload: {
                        ...result,
                        index: i,
                        frames: [item],
                        framesLength,
                    },
                    asyncId,
                });
            });
        } else {
            ctx.postMessage({ payload: result, asyncId });
        }
    }

    // 压缩 Gif
    if (type === 'compressGif') {
        const { params } = data;
        const payload = UPNG.encode.compress(...params);

        // uint8Array 需 clone 这里用 ArrayBuffer 传递
        payload.frames.forEach((frame) => {
            frame.img = frame.img.buffer;
        });

        ctx.postMessage({ payload, asyncId });
    }
};
