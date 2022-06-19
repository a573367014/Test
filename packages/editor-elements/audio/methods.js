/**
 * @class EditorAudioElementMixin
 * @description 元素的专属方法
 */
import { assign } from 'lodash';

export default {
    /**
     * 添加音频元素
     * @memberof EditorAudioElementMixin
     * @param {String} url - 音频路径
     * @param {Object} options - 音频其他参数，查看{@link module:EditorDefaults.element|element}
     */
    addAudio(url, options) {
        const data = assign(
            {
                type: 'audio',
                volume: 1,
                width: 0,
                height: 0,
                top: -10,
                left: -10,
                url,
            },
            options,
        );

        return this.addElement(data);
    },

    /**
     * 播放指定时间的音频
     * @memberof EditorAudioElementMixin
     * @param {Object} element - 音频元素
     * @param {Number} time - 要 seek 的时间
     */
    seekAudio(element, time) {
        if (element && element.type === 'audio') {
            element.$currentTime = time;
        }
    },

    /**
     * 播放音频
     * @memberof EditorAudioElementMixin
     * @param {Object} element - 音频元素
     * @param {Number} time - 开始播放的时间点
     */
    async playAudio(element, time) {
        if (!element || element.type !== 'audio') return;

        await this.$nextTick();
        time && this.seekAudio(element, time);
        this.$set(element, '$playing', true);
    },

    /**
     * 暂停音频
     * @memberof EditorAudioElementMixin
     * @param {Object} element - 音频元素
     * @param {Number} time - 暂停的时间点 - 用来纠正播放可能出现偏移的情况
     */
    pauseAudio(element, time) {
        if (!element || element.type !== 'audio') return;

        this.$set(element, '$playing', false);
        time && this.seekAudio(element, time);
    },

    /**
     * 停止播放音频, 并把 currentTime 设为 0
     * @memberof EditorAudioElementMixin
     * @param {Object} element - 音频元素
     */
    stopAudio(element) {
        this.pauseAudio(element, 0);
    },
};
