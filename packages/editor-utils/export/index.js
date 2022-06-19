/* eslint-disable */
import { exportGif as _exportGif } from './gif';
import { isFunction } from 'lodash';
import Promise from 'bluebird';
import { cleanupCanvasMemory } from '../canvas';

export async function exportGif({
    frames,
    delays,
    width,
    height,
    quality,
    disabledTransparent,
    needCleanupCanvasMemory,
}) {
    height = Math.round(height);
    width = Math.round(width);
    quality = Math.min(quality, 1); // 0 - 1

    const datas = await Promise.mapSeries(frames, (canvas, i) => {
        return Promise.try(() => {
            return isFunction(canvas) ? canvas() : canvas;
        }).then((canvas) => {
            if (width !== Math.round(canvas.width) || height !== Math.round(canvas.height)) {
                const newCanvas = document.createElement('canvas');
                // 手动处理宽高，否则 canvas 将向下取整
                newCanvas.height = height;
                newCanvas.width = width;

                const ctx = newCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0, width, height);
                needCleanupCanvasMemory && cleanupCanvasMemory(canvas);
                canvas = newCanvas;
            }

            const result = [
                new Uint8Array(
                    canvas.getContext('2d').getImageData(0, 0, width, height).data.buffer,
                ),
                delays[i],
            ];

            needCleanupCanvasMemory && cleanupCanvasMemory(canvas);
            return Promise.delay(10).then(() => result);
        });
    });

    const buffer = await _exportGif(datas, width, height, [
        quality * 100,
        0,
        0,
        disabledTransparent,
    ]);
    return new Blob([buffer], {
        type: 'image/gif',
    });
}
