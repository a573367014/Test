import template from './template.html';
import VideoControls from './video-controls';
import { ceil } from 'lodash';

export default {
    name: 'video-controller',
    template,
    components: {
        VideoControls,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        model: {
            type: Object,
            required: true,
        },
    },
    computed: {
        transformStyle() {
            const parents = this.editor.getParentGroups(this.model);
            const rotate = parents.concat(this.model).reduce((a, b) => {
                return a + b.rotate;
            }, 0);

            if (Math.abs(Math.abs(rotate % 360) - 180) < 1) {
                return {
                    transform: 'rotate(180deg)',
                };
            }
            return null;
        },
        duration() {
            return ceil((this.model.endTime - this.model.startTime) / 1000, 1);
        },
        startTime() {
            const { startTime, endTime, naturalDuration, invertPlay } = this.model;
            if (invertPlay) {
                return naturalDuration - endTime;
            }
            return startTime;
        },
        endTime() {
            const { startTime, endTime, naturalDuration, invertPlay } = this.model;
            if (invertPlay) {
                return naturalDuration - startTime;
            }
            return endTime;
        },
        currentTime() {
            const currentTime = (this.model.$currentTime - this.startTime) / 1000;
            return ceil(currentTime >= 0 ? currentTime : 0, 1);
        },
        sizeMode() {
            const minLen = Math.min(this.model.width, this.model.height) * this.editor.zoom;
            if (minLen >= 96) return 'medium';
            if (minLen >= 48) return 'small';
            return 'smaller';
        },
    },
    watch: {
        'model.volume'(vol) {
            if (!this.video) return;
            this.video.volume = vol;
        },
        'model.muted'(muted) {
            if (!this.video) return;
            this.video.muted = muted;
        },
    },
    mounted() {
        this.$watch(
            'model',
            (v) => {
                // 若只是点击切换 model，此时并不会重新执行生命周期，需 watch 并清理旧 model 状态
                this.destroy();
                v && this.loadVideo();
            },
            {
                immediate: true,
            },
        );
    },
    methods: {
        destroy() {
            if (this.video) {
                this.video.pause();
                this.video.removeEventListener('timeupdate', this.onTimeUpdate);
            }
        },
        onTimeUpdate() {
            const model = this.model;
            const video = this.video;
            const videoCurrentTime = video.currentTime * 1000;
            if (!model || !model.$playing) return;

            if (videoCurrentTime >= this.endTime) {
                model.$playing = false;
            }

            model.$currentTime = Math.min(this.endTime, Math.max(videoCurrentTime, this.startTime));
        },
        async loadVideo() {
            await this.$nextTick();
            const videoC = this.model && this.editor.getComponentById(this.model.$id);
            const video = (this.video = videoC.$refs.video);

            if (video) {
                video.removeEventListener('timeupdate', this.onTimeUpdate);
                video.addEventListener('timeupdate', this.onTimeUpdate);
            }

            // 初始化layout所有视频
            this.editor.walkTemplet(
                (elm) => {
                    if (elm.type === 'video' && elm !== this.model) {
                        elm.$playing = false;
                    }
                },
                true,
                this.editor.layouts,
            );
        },
        handleSeek(time) {
            this.model.$currentTime = this.startTime + time * 1000;
        },
        handlePlayClick(paused) {
            this.model.$playing = !paused;
        },
        handleVolumeChange(vol) {
            this.model.volume = vol;
        },
        handleMute(muted) {
            this.model.muted = muted;
        },
    },
    beforeDestroy() {
        this.destroy();
    },
};
