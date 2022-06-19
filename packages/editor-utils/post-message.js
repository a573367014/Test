import { uuid } from './string';

/**
 * @description: Send Message For Worker
 * @param {String} type 操作类型
 * @param {Object} data 发送的数据
 * @param {Object} worker Worker 实例
 * @return {*} 异步返回执行结果
 */
export function sendMessage(type, data, worker) {
    const promiseMap = {};
    const payloadMap = {};
    const asyncId = uuid();
    const message = {
        type,
        data,
        asyncId,
    };

    worker.onmessage = function (event) {
        let { asyncId, payload } = event.data;

        // 避免内容过大导致内存异常
        if (payload.framesLength && asyncId) {
            if (!payloadMap[asyncId]) {
                payloadMap[asyncId] = payload;
            } else {
                payloadMap[asyncId].frames = payloadMap[asyncId].frames.concat(payload.frames);
            }

            payload = payloadMap[asyncId];
            payload.frames.sort((a, b) => a.index - b.index);
        }

        // 异步 promise
        if (
            asyncId &&
            promiseMap[asyncId] &&
            (payload.frames.length === payload.framesLength || !payload.framesLength)
        ) {
            promiseMap[asyncId][0](payload);
            delete promiseMap[asyncId];
        }
    };

    worker.onerror = function (event) {
        const { message } = event;

        if (asyncId && promiseMap[asyncId]) {
            promiseMap[asyncId][1](message);
            delete promiseMap[asyncId];
        }
        console.error(message);
    };

    return new Promise((resolve, reject) => {
        promiseMap[message.asyncId] = [resolve, reject];
        worker.postMessage(message);
    });
}
