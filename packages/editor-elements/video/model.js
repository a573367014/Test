import ImageBaseModel from '../image-base-model';

class VideoModel extends ImageBaseModel {
    constructor(data) {
        if (typeof data.duration !== 'number' && typeof data.naturalDuration !== 'number') {
            throw new Error('Video 元素缺少 duration 或 naturalDuration 属性');
        }

        super(data);

        if (!this.naturalDuration && this.duration) {
            this.naturalDuration = Math.round(this.duration * 1000);
        }

        // 兼容 loop
        if (typeof data.loop === 'boolean') {
            this.loop = data.loop ? 0 : 1;
        }

        this.endTime = Math.min(this.endTime || this.naturalDuration, this.naturalDuration);

        delete this.duration;
    }
}

export default VideoModel;
