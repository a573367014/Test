import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import { isVideoResource } from '@gaoding/editor-utils/element';
import ImageBaseElement from '../image-base-element';
import template from './image-element.html';

export default inherit(ImageBaseElement, {
    props: ['isBackground'],
    name: 'image-element',
    template,
    data() {
        return {
            readyToDrop: false,
            imageInsideDropArea: false,
            video: null,
        };
    },
    computed: {
        showOriginImage() {
            return (
                (!this.hasEffects && !this.hasFilters) ||
                !this.effectedImageUrl ||
                this.model.$editing
            );
        },

        originUrl() {
            const { model, options } = this;

            return utils.getComputedUrl(model.url, options.fitCrossOrigin);
        },

        effectedImageUrl() {
            const effectsCondition =
                !this.hasEffects ||
                (this.model.effectedResult.width && this.model.effectedResult.height);
            return this.isBackground || effectsCondition ? this.model.imageUrl : '';
        },
        cssStyle() {
            const { rect, readyToDrop } = this;
            const { padding } = rect;

            let opacity = 1;
            if (typeof this.opacity === 'number') {
                opacity = this.opacity;
            }
            opacity = readyToDrop ? 1 : opacity;

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
                opacity,
            };
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

        visible() {
            const { model, imageUrl, hasEffects, canvasRendered } = this;
            const valid =
                !model.$imageDraging &&
                (model.$editing || imageUrl || (hasEffects && canvasRendered));
            return valid && !this.isGif ? 'visible' : 'hidden';
        },

        /**
         * 判断元素数据是否为视频资源
         */
        isVideoResource() {
            return isVideoResource(this.model);
        },
    },
    methods: {
        load() {
            this.usePlaceholder = false;

            const { originUrl, effectedImageUrl, hasEffects, hasFilters, options } = this;
            let promise = null;

            if (!originUrl) {
                this.usePlaceholder = true;
                promise = Promise.resolve();
            }

            if (!effectedImageUrl && (hasEffects || hasFilters)) {
                promise = utils.loadImage(originUrl, options.fitCrossOrigin).then(this.baseLoad);
            } else {
                this.isFirstRendered = true;
                promise = Promise.all([
                    !this.isPreviewMode || !effectedImageUrl
                        ? utils.loadImage(originUrl, this.options.fitCrossOrigin)
                        : null,
                    effectedImageUrl
                        ? utils.loadImage(effectedImageUrl, options.fitCrossOrigin)
                        : null,
                ]).then(([originalImg]) => {
                    originalImg && this.initDataByImg(originalImg);
                });
            }

            return promise.then(this.loadGifOrApng).catch((e) => {
                this.usePlaceholder = true;
                throw e;
            });
        },
    },
    events: {
        'element.readyToDrop'(model) {
            if (
                model !== this.model ||
                !model.editable ||
                !this.editor.options.dragImageToMaskEnable
            )
                return;

            this.model.$guider.show = false;
            this.model.$guider.marginShow = false;
            this.readyToDrop = true;
        },
        'element.resetReadyToDrop'(model) {
            if (model && model !== this.model) return;

            this.model.$guider.show = true;
            this.model.$guider.marginShow = true;
            this.readyToDrop = false;
        },
        'element.imageInsideDropArea'(model) {
            if (model !== this.model || !this.readyToDrop) return;

            this.imageInsideDropArea = true;
        },
        'element.imageOutsideDropArea'(model) {
            if (model !== this.model || !this.readyToDrop) return;

            this.imageInsideDropArea = false;
        },
    },
    watch: {
        'model.$currentTime'(time) {
            if (this.isVideoResource && this.video) {
                const { naturalDuration } = this.model;
                this.video.currentTime = (time % naturalDuration) / 1000 || 0;
            }
        },
    },
    mounted() {
        // 参数变更时触发重绘
        this.$watch(
            () => {
                const {
                    url,
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                    imageTransform,
                } = this.model;

                const result = [
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                ].map((v) => Math.round(v));

                result.push(imageTransform.rotation, url);

                return result.join(' ');
            },
            () => {
                if (!this.isDesignMode) return;

                if (this.editor.$binding.config.applyingYActions) {
                    this.lazyRender();
                } else if (!this.editor.global.$draging && !this.model.$imageDraging) {
                    this.lazyRender();
                    if (this.isNeedRenderAnimatioFrame) {
                        this.renderAnimationImage();
                    }
                }
            },
        );

        if (this.isVideoResource) {
            this.video = this.$refs.video;
            const { $currentTime, naturalDuration } = this.model;
            this.video.currentTime = ($currentTime % naturalDuration) / 1000;
        }
    },
});
