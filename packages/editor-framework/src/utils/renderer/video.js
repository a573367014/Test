import ImageRenderer from './image';
import utils from '../utils';

/**
 * 视频渲染引擎
 * 加载模板 -> 裁剪 -> 滤镜 -> 视频样式
 */
export default class VideoRenderer extends ImageRenderer {
    constructor({ model, editor, canvas, hooks }) {
        super({ model, editor, canvas, hooks });
    }

    load() {
        const { model, options } = this;

        const startTime = model.invertPlay
            ? model.naturalDuration - model.endTime
            : model.startTime;
        return Promise.all([
            model.url
                ? utils.loadVideo(model.url, (startTime || 0) / 1000, options.fitCrossOrigin)
                : null,
            model.mask ? utils.loadImage(model.mask, options.fitCrossOrigin) : null,
        ]);
    }
}
