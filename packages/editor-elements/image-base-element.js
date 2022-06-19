import Promise from 'bluebird';
import { get, throttle } from 'lodash';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';

import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import { adaptationImageTransform } from '@gaoding/editor-framework/src/utils/model-adaptation';
import { uuid } from '@gaoding/editor-utils/string';
import { decodeGifOrApng } from '@gaoding/editor-framework/src/utils/gif-utils';
import ImageRenderer from '@gaoding/editor-framework/src/utils/renderer/image';
import {
    initMaskInfo,
    debounceUpdateMaskInfo,
} from '@gaoding/editor-framework/src/static/mask-wrap/utils';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import { getCurrentFrame } from '@gaoding/editor-utils/animation-image';

const isEqId = (a, b) => {
    return get(a, '$id') === get(b, '$id');
};
// 缓存解析好的动图帧数据
const cacheAnimationImgData = new Map();

export default inherit(BaseElement, {
    props: ['global', 'model', 'options', 'editor'],
    data() {
        return {
            canvasRendered: false,
            lazyRendering: false,

            isFirstRendered: false,
            imageUrlCache: '',
            usePlaceholder: false,
            // rendering: false,
        };
    },
    computed: {
        zoom() {
            return this.global.zoom;
        },

        isGif() {
            return this.model.url && (this.model.isGif || this.model.isApng);
        },

        imageUrl() {
            const { model, options } = this;
            return utils.getComputedUrl(model.imageUrl, options.fitCrossOrigin);
        },

        mainStyle() {
            const { padding, borderRadius, readyToDrop, visible, imageInsideDropArea } = this;

            return {
                padding,
                borderRadius,
                overflow: visible,
                opacity: readyToDrop ? (imageInsideDropArea ? 0 : 0.3) : 1,
            };
        },

        maskStyle() {
            if ((this.isGif && this.isMask) || (this.isVideo && this.model.mask)) {
                return {
                    maskImage: `url(${this.model.mask})`,
                    maskSize: '100% 100%',
                };
            }

            return null;
        },

        cssStyle() {
            const rect = this.rect;
            const padding = rect.padding;
            const maskStyle = {};

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
                transform: this.transform.toString(),
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: this.opacity,
                ...maskStyle,
            };
        },

        effectedImageRect() {
            const { model, global } = this;

            return this.hasEffects && !this.isNeedRenderAnimatioFrame
                ? {
                      width: model.effectedResult.width * global.zoom,
                      height: model.effectedResult.height * global.zoom,
                      left: model.effectedResult.left * global.zoom,
                      top: model.effectedResult.top * global.zoom,
                  }
                : {
                      width: model.width * global.zoom,
                      height: model.height * global.zoom,
                      left: 0,
                      top: 0,
                  };
        },

        effectedImageStyle() {
            const { model, effectedImageRect, rect } = this;
            const { top, left, width, height } = effectedImageRect;

            const style = {
                position: 'absolute',
                width: width + 'px',
                height: height + 'px',
                left: left + 'px',
                top: top + 'px',
            };

            if (model.$imageDraging && this.isMask) {
                Object.assign(style, {
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                    left: 0,
                    top: 0,
                });
            }

            return style;
        },

        hasEffects() {
            return this.model.hasEffects && this.model.url;
        },

        hasFilters() {
            return this.model.hasFilters;
        },

        linkSelected() {
            const element = this.editor.currentSubElement || this.editor.currentElement || {};
            return this.isLinkWith(element);
        },

        enableImageRenderer() {
            return this.model.$enableImageRenderer;
        },

        imageRenderer() {
            if (!this._imageRenderer) {
                this._imageRenderer = this.createRenderer();
            }
            return this._imageRenderer;
        },

        imageWrapStyle() {
            const { naturalWidth, naturalHeight, width, height } = this.model;

            return {
                position: 'absolute',
                left: (-(naturalWidth - width) / 2) * this.zoom + 'px',
                top: (-(naturalHeight - height) / 2) * this.zoom + 'px',
            };
        },

        imageStyle() {
            const { imageTransform, naturalWidth, naturalHeight } = this.model;
            const { a, b, c, d, tx, ty } = imageTransform.toJSON();

            return {
                position: 'absolute',
                width: Math.max(1, naturalWidth * this.zoom) + 'px',
                height: Math.max(1, naturalHeight * this.zoom) + 'px',
                transform: `matrix(${a},${b},${c},${d},${tx * this.zoom},${ty * this.zoom})`,
            };
        },

        /**
         * 是否需要渲染帧画面(平面编辑器直接渲染整个动图，剪辑编辑器需要手动渲染帧画面)
         */
        isNeedRenderAnimatioFrame() {
            return this.isGif && this.model.$needRenderFrame;
        },
    },
    watch: {
        model() {
            this.imageRenderer && this.imageRenderer.updateModel(this.model);
        },
        isGif(v) {
            if (v) {
                this.canvasRendered = false;
            }
        },
        'model.imageEffects': {
            deep: true,
            handler() {
                if (this.editor.global.$draging) return;
                this.lazyRender();
            },
        },
        'model.shadows': {
            deep: true,
            handler() {
                if (this.editor.global.$draging) return;
                this.lazyRender();
            },
        },
        'model.filter': {
            deep: true,
            handler() {
                if (this.editor.global.$draging) return;
                this.lazyRender();
            },
        },
        'model.filterInfo': {
            deep: true,
            handler() {
                if (this.editor.global.$draging) return;
                this.lazyRender();
            },
        },
        'model.$currentTime'() {
            if (this.canvasRendered && this.isNeedRenderAnimatioFrame) {
                this.renderAnimationImage();
            }
        },
        isGif(v) {
            if (v) {
                // 拖拽gif到蒙版内，gif变成禁止状态
                this.canvasRendered = false;
            }
        },
    },
    methods: {
        loadGifOrApng() {
            const model = this.model;
            if (this.isNeedRenderAnimatioFrame) {
                this.canvasRendered = true;
                return this.loadAnimationImgData(this.model.url).then((result) => {
                    this.model.naturalDuration = result.duration;
                    this.model.$frames = result.frames;

                    // 如果不存在 startTime 与 endTime，则重新设置
                    if (
                        typeof this.model.startTime !== 'number' ||
                        typeof this.model.endTime !== 'number'
                    ) {
                        this.model.startTime = 0;
                        this.model.endTime = result.duration;
                    }

                    this.renderAnimationImage();
                });
            }

            return Promise.try(() => {
                if (!this.isPreviewMode && (model.isGif || model.isApng)) {
                    return decodeGifOrApng(this.model).then((result) => {
                        this.model.naturalDuration = result.duration;
                        if (!result.duration) {
                            this.model.resourceType = 'image';
                        }
                    });
                }
            }).catch(console.warn);
        },

        async baseLoad() {
            const [originalImg] = await this.imageRenderer.load();
            originalImg && this.initDataByImg(originalImg);

            const res = await this.render({ force: true });
            await initMaskInfo(this.model, this.editor);
            return res;
        },

        render(imageOptions = {}) {
            if (this.isGif || this.isVideo) return;
            return this.imageRenderer.render({
                resizeByPica: this.options.picaResizeEnable,
                ...imageOptions,
            });
        },
        lazyRender(imageOptions = {}) {
            if (this.isGif || this.isVideo) return;

            const needCanvasRender = this.hasEffects || this.hasFilters || this.canvasRendered;
            if (
                !this.isDesignMode ||
                (this.isImage && !needCanvasRender) ||
                !this.enableImageRenderer
            ) {
                return;
            }

            if (this.hasFilters || this.hasEffects) {
                return this.imageRenderer.lazyRender({
                    resizeByPica: this.options.picaResizeEnable,
                    ...imageOptions,
                });
            }

            return this.render(imageOptions);
        },
        lazyRenderByCanvas(canvas, inputCanvas, zoom) {
            if (!this._lazyRenderByCanvas) {
                this._lazyRenderByCanvas = throttle(
                    (...rest) => {
                        this.imageRenderer.renderByCanvas(...rest);
                    },
                    1000,
                    { trailing: true },
                );
            }

            this._lazyRenderByCanvas(canvas, inputCanvas, zoom);
        },
        createRenderer() {
            const editor = this.editor;
            let imageRenderer = editor.$renderers.get(this.model.$id);

            if (imageRenderer && this.isPreviewMode) {
                editor.$renderers.count(this.model.$id);
                return imageRenderer;
            }

            if (imageRenderer) {
                editor.$renderers.count(this.model.$id);
                imageRenderer.updateModel(this.model);
            } else {
                imageRenderer = editor.$renderers.create(
                    this.model.$id,
                    new ImageRenderer({
                        model: this.model,
                        byNaturalSize: !!this.isBackground,
                        editor,
                    }),
                );
            }

            return imageRenderer;
        },
        initDataByImg(originalImg) {
            if (this.isBackground) return;
            adaptationImageTransform(this.model, originalImg);
            this.model.naturalWidth = originalImg.naturalWidth;
            this.model.naturalHeight = originalImg.naturalHeight;
            this.model.setClipCache();
        },

        /**
         * 加载动态贴纸数据并缓存
         * @param { String } url - apng | gif图片地址
         * @returns { Promise<{ frames: Array<Frame>, width: Number, height: Number, duration: Number }> }
         */
        loadAnimationImgData(url) {
            if (cacheAnimationImgData.has(url)) {
                const data = cacheAnimationImgData.get(url);
                return Promise.resolve(data);
            } else {
                return decodeGifOrApng(this.model, { needBuffer: true }).then((result) => {
                    const { width, height, duration, frames } = result;
                    const imageFrames = [];

                    // 帧延迟时间
                    let frameDelay = 0;
                    for (const frame of frames) {
                        // 一帧的时长
                        const duration = this.model.isGif ? frame.delay * 10 : frame.delay;
                        const buffer = new Uint8ClampedArray(frame.buffer);
                        const imageData = new ImageData(buffer, width, height);
                        const canvas = createCanvas(width, height);
                        const context = canvas.getContext('2d');
                        context.putImageData(imageData, 0, 0);

                        const frameData = {
                            canvas,
                            duration,
                            delay: frameDelay,
                        };
                        imageFrames.push(frameData);
                        frameDelay += duration;
                    }

                    const data = { width, height, duration, frames: imageFrames };
                    cacheAnimationImgData.set(url, data);
                    return data;
                });
            }
        },

        /**
         * 渲染动态贴纸当前帧
         */
        renderAnimationImage() {
            const {
                $frames,
                $currentTime,
                naturalDuration,
                loop,
                $imageTop,
                $imageLeft,
                width,
                height,
                imageTransform,
            } = this.model;
            const frame = getCurrentFrame($frames, $currentTime, naturalDuration, loop);
            if (frame) {
                const canvas = this.$refs.canvas;
                if (canvas) {
                    const w = Math.round(width);
                    const h = Math.round(height);
                    canvas.width = w;
                    canvas.height = h;
                    const context = canvas.getContext('2d');
                    context.clearRect(0, 0, w, h);
                    // 支持裁剪
                    const { x: scaleX, y: scaleY } = imageTransform.scale;
                    const sx = Math.abs(Math.round($imageLeft)) / scaleX;
                    const sy = Math.abs(Math.round($imageTop)) / scaleY;
                    const sWidth = Math.round(w / scaleX);
                    const sHeight = Math.round(h / scaleY);
                    context.drawImage(frame.canvas, sx, sy, sWidth, sHeight, 0, 0, w, h);
                }
            }
        },
    },
    mounted() {
        // 最小尺存限制
        this.model.$resizeLimit = true;
        this.model.$getResizeLimit = () => ({
            maxWidth: Infinity,
            minWidth: 10,
            maxHeight: Infinity,
            minHeight: 10,
        });

        // 数据源变更时重绘
        this.$watch(
            () => this.model.url + this.model.mask,
            () => {
                if (!this.isDesignMode) {
                    this.usePlaceholder && this.checkLoad();
                    return;
                }
                this.$nextTick(() => {
                    this.model.imageUrl = '';
                    this.imageRenderer.lazyRenderCancel();
                    this.checkLoad();
                });
            },
        );

        // 参数变更时触发重绘
        this.$watch(
            () => {
                const {
                    width,
                    height,
                    imageTransform: { scale },
                } = this.model;

                return [width, height, scale.x, scale.y].join(' ');
            },
            () => {
                if (!this.isDesignMode || this.editor.global.$draging) return;
                this.model.setClipCache();
            },
        );
        this.$watch(
            () => this.model.$renderProps,
            () => {
                if (this.isGif || this.isVideo) return;
                const needCanvasRender = this.hasEffects || this.hasFilters || this.canvasRendered;
                if (
                    !this.isDesignMode ||
                    (this.isImage && !needCanvasRender) ||
                    !this.enableImageRenderer
                ) {
                    return;
                }
                debounceUpdateMaskInfo(this.model, this.editor);
            },
            { deep: true },
        );
    },
    events: {
        'element.editApply'(model) {
            if (
                model.$id !== this.model.$id ||
                (this.isMask && model.type !== '$masker') ||
                (this.isImage && model.type !== '$croper') ||
                (!this.hasEffects && !this.hasFilters)
            ) {
                return;
            }

            this.$nextTick(() => {
                this.lazyRender();
            });
        },

        'element.dragStart'(model) {
            if (model !== this.model) return;
            this.lazyRendering = false;
        },
        'element.transformStart'(model) {
            if (model !== this.model) return;
            this.lazyRendering = false;
        },
        'element.transformEnd'(model, drag, { action }) {
            // const isNotRerender = this.isImage && !this.hasEffects && this.hasFilters;
            if (model !== this.model || action !== 'resize') return;
            this.lazyRender({
                force: this.options.supportAdaptiveElements.includes(model.type),
            });
        },
        'element.imageTransformStart'(model) {
            if (model !== this.model || !this.isDesignMode || !this.isMask) return;

            this.lazyRendering = false;
            this.render({
                resizeByPica: false,
                renderFilter: false,
                renderEffect: false,
            });
        },
        'element.imageTransformEnd'(model) {
            if (model !== this.model) return;
            this.lazyRender({
                force: true,
            });
        },

        'element.change'(model, propName) {
            if (propName === 'url' && this.isLinkWith(model) && this.model.url !== model.url) {
                // this._eventChange = true;
                const url = model.url;
                utils.loadImage(url, this.options.fitCrossOrigin, true).then((image) => {
                    const { width, height } = image;
                    const { width: elementWidth, height: elementHeight } = this.model;
                    const ratio = Math.max(elementWidth / width, elementHeight / height);
                    const clipSize = [width * ratio, height * ratio];

                    const props = {
                        url: model.url,
                        imageUrl: '',
                        $imageWidth: clipSize[0],
                        $imageHeight: clipSize[1],
                        $imageLeft: (elementWidth - clipSize[0]) / 2,
                        $imageTop: (elementHeight - clipSize[1]) / 2,
                    };

                    this.editor.changeElement(props, this.model, false);
                    this.editor.options?.changeMetaInfoHook({
                        oldElement: model,
                        newElement: this.model,
                        type: 'replace',
                    });
                });
            }
        },

        'imageRenderer.renderBefore'(model) {
            if (!this.isDesignMode || !isEqId(model, this.model) || this.isVideo) return;

            this.imageUrlCache = this.canvasRendered ? '' : this.model.imageUrl;
            this.editor.changeElement(
                {
                    imageUrl: '',
                },
                this.model,
            );

            if (this.isFirstRendered || !this.$renderId) {
                this.model.$renderId = uuid();
            }
            this.isFirstRendered = true;

            // 延迟 400 毫秒在出现 loading
            clearTimeout(this._renderingTimer);
            this._renderingTimer = setTimeout(() => {
                this.lazyRendering = true;
            }, 400);
        },
        'imageRenderer.renderEffectAfter'(model, effectModel) {
            if (!isEqId(model, this.model)) return;
            // Object.assign(this.model, effectModel);
            this.editor.changeElement(effectModel, this.model);
        },
        'imageRenderer.renderAfter'(model) {
            if (!isEqId(model, this.model)) return;
            this.canvasRendered = true;
            this.lazyRendering = false;
            this.imageUrlCache = '';
            clearTimeout(this._renderingTimer);

            let zoom = 1;
            if (this.isPreviewMode) {
                const ratio =
                    Math.min(
                        1,
                        model.naturalWidth / model.$imageWidth,
                        model.naturalHeight / model.$imageHeight,
                    ) / window.devicePixelRatio;

                zoom = Math.min(1, this.zoom / ratio);
            }

            this.$nextTick(() => {
                if (this.isPreviewMode) {
                    this.lazyRenderByCanvas(this.$refs.canvas, this.imageRenderer.canvas, zoom);
                } else {
                    this.imageRenderer.renderByCanvas(this.$refs.canvas, this.imageRenderer.canvas);
                }
            });
        },
    },
    beforeDestroy() {
        this._lazyRenderByCanvas && this._lazyRenderByCanvas.cancel();
        this.editor.$renderers.destory(this.model.$id);
    },
});
