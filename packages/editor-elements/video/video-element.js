import $ from '@gaoding/editor-utils/zepto';
import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import ImageElement from '../image/image-element';
import template from './video-element.html';
import { createProxy } from '@gaoding/editor-utils/create-proxy';
import { throttle } from 'lodash';

export default inherit(ImageElement, {
    name: 'video-element',
    template,
    data() {
        return {
            video: null,
        };
    },
    computed: {
        cssStyle() {
            const { rect } = this;
            const { padding } = rect;

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
                /**
                 * 加 translateZ 是为了分离渲染 layer
                 * 规避 chrome 的 video 元素在有 rotate 的时候，有些角度的情况下
                 * 会跟其他渲染 layer 合并, 导致 video 元素的层级错误
                 */
                transform: this.transform.toString() + ' translateZ(0)',
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: this.opacity,
            };
        },
        mainStyle() {
            const { padding, borderRadius } = this;

            return {
                padding: padding,
                borderRadius: borderRadius,
                overflow: 'hidden',
                ...this.maskStyle,
            };
        },
        imageRenderer() {
            if (!this._imageRendererProxy) {
                this._imageRendererProxy = createProxy({});
            }

            return this._imageRendererProxy;
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
    },
    watch: {
        'model.$currentTime'(time) {
            const { model, video } = this;

            if (!video) return;
            // 说明视频逐秒播放没必要设置 video.currentTime，会引起卡顿
            const currentTime = video.currentTime * 1000;
            if (model.$playing && Math.abs(currentTime - time) < 500) return;

            this.videoUpdateTime(time / 1000);
            model.$currentTime = Math.min(this.endTime, Math.max(time, this.startTime));
        },
        'model.volume'(vol) {
            if (!this.video || this.isPreviewMode) return;
            this.video.volume = vol;
        },
        'model.muted'(muted) {
            if (!this.video || this.isPreviewMode) return;
            this.video.muted = muted;
        },
        'model.$playing'(playing) {
            if (!this.video || this.isPreviewMode) return;

            if (playing) {
                if (this.model.$currentTime >= this.endTime) {
                    this.videoUpdateTime(0);
                }
                this.video.play();
            } else {
                this.video.pause();
            }
        },
        // 同步预览模式下视频帧
        'element.updateTime': throttle(
            function (model, time) {
                if (model !== this.model || !this.isPreviewMode || !this.video) return;

                this.video.currentTime = time;
            },
            1000,
            {
                trailing: true,
            },
        ),
    },
    methods: {
        load() {
            const { originUrl, model, options } = this;
            return utils
                .loadVideo(originUrl, model.$currentTime / 1000, options.fitCrossOrigin)
                .then((originalVideo) => {
                    originalVideo && this.initDataByImg(originalVideo);
                    this.$nextTick();
                })
                .then(() => {
                    if (!this.isPreviewMode) {
                        model.$currentTime = Math.max(model.$currentTime, this.startTime);

                        // 自动播放, 延迟触发 watch 更新
                        if (model.$playing) {
                            model.$playing = false;
                            return this.$nextTick().then(() => {
                                model.$playing = true;
                            });
                        }
                    }

                    if (this.video) {
                        this.videoUpdateTime(model.$currentTime / 1000);
                    }
                })
                .timeout(15000, `video [${originUrl}] load timeout(${15000}ms)`)
                .catch((e) => {
                    throw e;
                });
        },
        videoUpdateTime(time) {
            this.video.currentTime = time;
            this.$events.$emit('element.updateTime', this.model, time);
        },
    },
    events: {},
    mounted() {
        const video = (this.video = this.$refs.video);
        video.volume = this.model.volume;
        video.muted = this.model.muted;

        $(video)
            .on(
                'pause',
                (this._onpause = () => {
                    this.model.$playing = false;
                    this.videoUpdateTime(video.currentTime);
                }),
            )
            .on(
                'paly',
                (this._onplay = () => {
                    this.model.$playing = true;
                    this.videoUpdateTime(video.currentTime);
                }),
            );

        // 若存在 startTime，拆分组、成组时可以有效避免跳帧
        this.videoUpdateTime(this.model.$currentTime / 1000);
    },
    beforeDestroy() {
        const video = this.video;

        $(video).off('pause', this._onpause);
        $(video).off('paly', this._onplay);
    },
});
