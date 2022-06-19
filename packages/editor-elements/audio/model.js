import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';

class AudioModel extends BaseModel {
    constructor(data) {
        if (typeof data.duration !== 'number' && typeof data.naturalDuration !== 'number') {
            throw new Error('Audio 元素缺少 duration 或 naturalDuration 属性');
        }

        super(data);

        if (!this.naturalDuration && this.duration) {
            this.naturalDuration = Math.round(this.duration * 1000);
        }

        this.endTime = Math.min(this.endTime || this.naturalDuration, this.naturalDuration);

        delete this.duration;
    }
}

export default AudioModel;
