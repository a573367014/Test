import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import ImageBaseElement from '../image-base-element';
import template from './mask-element.html';
import { i18n } from '../i18n';

export default inherit(ImageBaseElement, {
    name: 'mask-element',
    template,
    data() {
        return {
            readyForDrop: false,
            insideDropArea: false,
        };
    },
    computed: {
        mainStyle() {
            const { padding, borderRadius } = this;

            return {
                padding,
                borderRadius,
            };
        },

        maskDropAreaDimension() {
            const dimensions = [
                {
                    width: 120,
                    height: 50,
                    size: 'big',
                    breakpoint: 300,
                },
                {
                    width: 80,
                    height: 42,
                    size: 'medium',
                    breakpoint: 170,
                },
                {
                    width: 40,
                    height: 40,
                    size: 'small',
                    breakpoint: 80,
                },
            ];
            const width = this.model.width * this.global.zoom;
            return (
                dimensions.find((dimension) => {
                    return dimension.breakpoint < width;
                }) || { size: 'small', width: width * 0.4, height: width * 0.4 }
            );
        },

        maskDropAreaStyle() {
            const zoom = this.global.zoom;
            const { width, height } = this.maskDropAreaDimension;
            return {
                width: `${width}px`,
                height: `${height}px`,
                left: `${(this.model.width * zoom - width) / 2}px`,
                top: `${(this.model.height * zoom - height) / 2}px`,
            };
        },

        dropAreaText() {
            let text = '';
            if (this.maskDropAreaDimension.size === 'medium') {
                text = this.insideDropArea ? i18n.$tsl('释放') : i18n.$tsl('拖入');
            } else {
                text = this.insideDropArea ? i18n.$tsl('释放图片') : i18n.$tsl('拖入图片');
            }
            return text;
        },
    },
    methods: {
        load() {
            if (!this.model.url) {
                return this.imageRenderer.renderBackground({
                    force: true,
                });
            }

            if (this.imageUrl && !this.isGif && !this.model.isVideo) {
                this.isFirstRendered = true;

                return Promise.all([
                    !this.isPreviewMode
                        ? utils.loadImage(this.model.url, this.options.fitCrossOrigin, true)
                        : null,
                    utils.loadImage(this.imageUrl, this.options.fitCrossOrigin),
                ]).then(([originalImg]) => {
                    originalImg && this.initDataByImg(originalImg);
                });
            }

            return this.baseLoad().then(this.loadGifOrApng);
        },
        lazyRender(...rest) {
            if (!this.isDesignMode || this.isGif || this.isVideo) return;

            if (this.hasFilters || this.hasEffects) {
                return this.imageRenderer.lazyRender(...rest);
            }
            return this.render(...rest);
        },
    },
    events: {
        'element.readyForDrop'(model, imageElement, mousePos) {
            if (model !== this.model || !imageElement || !model.editable || !this.isDesignMode)
                return;
            if (
                (imageElement && !imageElement.editable) ||
                !this.editor.options.dragImageToMaskEnable
            )
                return;
            if (model !== this.model || !imageElement) return;

            if (!imageElement.enableDragToMask) {
                return;
            }

            this.readyForDrop = true;
            const url = imageElement.imageUrl || imageElement.url;

            const zoom = this.global.zoom;
            const currentLayout = this.editor.getLayoutByPoint(mousePos);
            const { width, height, left, top } = this.model;
            const calcPosition = (vm) => {
                const groups = this.editor.getParentGroups(vm.model, currentLayout);
                groups.forEach((group) => {
                    mousePos.x -= group.left;
                    mousePos.y -= group.top;
                    mousePos = utils.getPointPosition(
                        mousePos,
                        {
                            x: group.width / 2,
                            y: group.height / 2,
                        },
                        -group.rotate,
                        -group.skewX,
                        -group.skewY,
                    );
                });
            };

            // 支持组嵌套
            calcPosition(this);

            const {
                width: areaWidth,
                height: areaHeight,
                size: areaSize,
            } = this.maskDropAreaDimension;
            const dropWidthDiff = ((1 - zoom) * areaWidth) / zoom;
            const dropHeightDiff = ((1 - zoom) * areaHeight) / zoom;
            const dropAreaLeft = left + (width - areaWidth) / 2 - dropWidthDiff / 2;
            const dropAreaTop = top + (height - areaHeight) / 2 - dropHeightDiff / 2;
            const dropAreaRight = dropAreaLeft + areaWidth + dropWidthDiff;
            const dropAreaBottom = dropAreaTop + areaHeight + dropHeightDiff;

            // 大的放置区域的响应区域外扩自身的 1/8
            const expandWidth = areaSize === 'big' ? areaWidth / 8 : 0;

            const rect = utils.getElementRect(
                {
                    left: dropAreaLeft - expandWidth,
                    top: dropAreaTop - expandWidth,
                    width: dropAreaRight - dropAreaLeft + 2 * expandWidth,
                    height: dropAreaBottom - dropAreaTop + 2 * expandWidth,
                    rotate: this.model.rotate,
                },
                1,
            );
            const insideDropArea = utils.pointInRect(
                mousePos.x,
                mousePos.y - currentLayout.top,
                rect,
            );
            if (insideDropArea) {
                let imgWidth = imageElement.naturalWidth;
                let imgHeight = imageElement.naturalHeight;

                // 短边放大，cover
                const ratio = Math.max(this.model.width / imgWidth, this.model.height / imgHeight);
                imgWidth *= ratio;
                imgHeight *= ratio;

                // 临时绘制拖拽进入的图片不要滤镜，渲染太慢了
                this.insideDropArea !== insideDropArea &&
                    this.render({
                        resizeByPica: false,
                        renderFilter: false,
                        renderEffect: false,
                        imgWidth,
                        imgHeight,
                        img: url,
                        force: true,
                    });

                imageElement.$insideDropArea = true;
                this.$events.$emit('element.imageInsideDropArea', imageElement);
            } else {
                if (this.model.url && this.insideDropArea !== insideDropArea) {
                    this.render({ img: model.url, force: true });
                } else if (this.insideDropArea !== insideDropArea) {
                    this.imageRenderer.renderBackground({ force: true });
                }
                this.$events.$emit('element.imageOutsideDropArea', imageElement);
                imageElement.$insideDropArea = false;
            }
            this.insideDropArea = insideDropArea;
        },
        'element.resetReadyForDrop'(model) {
            if (model && !model.editable && !this.editor.options.dragImageToMaskEnable) return;
            if (!this.isDesignMode) return;
            if (model === this.model && this.readyForDrop) {
                this.readyForDrop = false;
                this.insideDropArea = false;
            }
        },
        'element.applyImageDrop'(model, imageElement) {
            if (
                model === this.model &&
                imageElement &&
                this.insideDropArea &&
                imageElement.enableDragToMask
            ) {
                const url = imageElement.imageUrl || imageElement.url;
                utils.loadImage(url, this.options.fitCrossOrigin, true).then((img) => {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;

                    this.editor.removeElement(imageElement, null, true);
                    this.editor.changeElement(
                        {
                            resourceType: imageElement.resourceType,
                        },
                        model,
                    );

                    this.editor.replaceImage(
                        url,
                        {
                            forwardEdit: false,
                            width,
                            height,
                        },
                        model,
                    );

                    this.editor.options?.changeMetaInfoHook({
                        oldElement: imageElement,
                        newElement: model,
                        type: 'replace',
                    });

                    this.editor.focusElement(model);
                    this.$events.$emit('element.applyImageDrop.success', model, imageElement);
                });
            }

            this.readyForDrop = false;
            this.insideDropArea = false;
        },
    },
    mounted() {
        // 参数变更时触发重绘
        this.$watch(
            () => {
                const {
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                    imageTransform,
                    resourceType,
                } = this.model;

                const { rotation } = imageTransform;

                const result = [
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                ].map((v) => Math.round(v));

                // 取整、避免 naturalWidth 重置导致的误算
                result.push(rotation, resourceType);
                return result.join(' ');
            },
            () => {
                if (!this.isDesignMode) return;

                if (this.editor.$binding.config.applyingYActions) {
                    this.lazyRender();
                } else if (
                    this.model.$imageDraging ||
                    this.options.supportAdaptiveElements.includes(this.model.type)
                ) {
                    this.render({
                        resizeByPica: false,
                        renderFilter: false,
                        renderEffect: false,
                        force: true,
                    });
                }
                // 存在特效时是按原图绘制，拖拽时没必要实时更新
                else if (!this.editor.global.$draging && !this.hasEffects) {
                    this.lazyRender({
                        force: true,
                    });

                    if (this.isNeedRenderAnimatioFrame) {
                        this.renderAnimationImage();
                    }
                }
            },
        );
    },
});
