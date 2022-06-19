import template from './video-controls.html';
import RangeSlider from 'vue-slider-component';
import ceil from 'lodash/ceil';
import bemMixin from '../../utils/bem';
import $ from '@gaoding/editor-utils/zepto';

export default {
    name: 'editor-video-controls',
    mixins: [bemMixin],
    template,
    components: {
        RangeSlider,
    },
    props: {
        size: {
            type: String,
            // medium, small, smaller
            default: 'medium',
        },
        currentTime: {
            type: Number,
            default: 0,
        },
        duration: {
            type: Number,
            default: 0,
        },
        volume: {
            type: Number,
            default: 1,
        },
        paused: {
            type: Boolean,
            default: true,
        },
        muted: {
            type: Boolean,
            default: false,
        },
        simple: {
            type: Boolean,
            default: false,
        },
        controls: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            rangeSliderVisible: true,
            isMouseenter: false,
            volumeDraging: false,
            seeking: false,
        };
    },
    computed: {
        railStyle() {
            if (this.simple) {
                return {
                    padding: 0,
                    height: '3px',
                };
            }

            return {
                padding: 0,
                height: '4px',
            };
        },
        ceilDuration() {
            return ceil(this.duration, 1);
        },
        ceilCurrentTime() {
            return ceil(this.currentTime, 1);
        },
    },
    watch: {
        // TODO: vue slider 抛错，不影响操作但会抛警告
        ceilDuration() {
            this.rangeSliderVisible = false;
            this.$nextTick(() => {
                this.rangeSliderVisible = true;
            });
        },
    },
    methods: {
        handleToggleMouseenter(bool) {
            clearTimeout(this._toggleMouseenterTimer);
            if (!bool) {
                this._toggleMouseenterTimer = setTimeout(
                    () => {
                        this.isMouseenter = false;
                    },
                    this.size.includes('small') ? 500 : 0,
                );
            } else {
                this.isMouseenter = true;
            }
        },
        // 格式化播放时间
        formatTime(time, simple = false) {
            time = Math.min(this.duration, time);
            if (simple) return `${ceil(time, 1)}s`;
            time = Math.ceil(time);
            const double = (num) => `${num < 10 ? '0' : ''}${num}`;
            const minutes = Math.floor(time / 60) % 60;
            const seconds = time % 60;
            return `${double(minutes)}:${double(seconds)}`;
        },
        handlePlay() {
            this.$emit('play-click', !this.paused);
        },
        handleTimeDragStart() {
            this.seeking = true;
            this.$emit('time-drag-start');
        },
        handleTimeDragging(v) {
            if (this.seeking) {
                this.$emit('seek', v, { action: 'drag' });
            }
            this.$emit('time-dragging');
        },
        handleTimeDragEnd() {
            this.seeking = false;
            this.$emit('time-drag-end');
        },
        handleTimeChange(v) {
            if (this.seeking) return;
            this.$emit('seek', v, { action: this.seeking ? 'drag' : 'click' });
        },
        handleVolumeClick() {
            this.$emit('mute', !this.muted);
        },
        handleVolumeChange(v) {
            this.$emit('volume-change', v / 100);
        },
        handleVolumeDragStart() {
            this.volumeDraging = true;
        },
        handleVolumeDragEnd() {
            this.volumeDraging = false;
        },
    },
    mounted() {
        $(document).on(
            'keyup',
            (this._onKeyup = (e) => {
                if (e.keyCode === 32) {
                    this.$emit('space', !this.paused);
                }
            }),
        );
    },
    beforeDestroy() {
        $(document).off('keyup', this._onKeyup);
    },
};
