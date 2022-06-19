import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';

import template from './watermark.html';
import { isBase64 } from '@gaoding/editor-utils/string';

export default inherit(BaseElement, {
    name: 'watermark-element',
    template,
    props: ['global', 'model', 'options', 'editor'],
    data() {
        return {
            initDfd: false,
            loadDfd: null,
            componentLoaded: false,
            backgroundModel: null,
            parentLayout: null,
        };
    },
    computed: {
        cssStyle() {
            const { rect } = this;
            const { padding } = rect;

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
            };
        },
        watermarkImageStyle() {
            const { zoom } = this.global;
            const { width, height, left, top } = this.model;
            return {
                width: `${width * zoom}px`,
                height: `${height * zoom}px`,
                left: `${left * zoom}px`,
                top: `${top * zoom}px`,
            };
        },
        watermarkStyle() {
            const { model, global } = this;
            const { zoom } = global;
            const {
                fullScreenInfo,
                width,
                height,
                $repeatImageUrl,
                $repeatImageWidth,
                $repeatImageHeight,
            } = model;

            const offsetLeft = fullScreenInfo.left * zoom;
            const offsetTop = fullScreenInfo.top * zoom;
            return {
                width: `${width * zoom}px`,
                height: `${height * zoom}px`,
                backgroundImage: `url(${$repeatImageUrl})`,
                backgroundSize: `${$repeatImageWidth * zoom}px ${$repeatImageHeight * zoom}px`,
                backgroundRepeat: 'repeat',
                backgroundPosition: `${offsetLeft}px ${offsetTop}px`,
            };
        },
        waterType() {
            return this.model.waterType;
        },
        editing() {
            return this.model.$editing;
        },
        renderInCanvas() {
            return this.model.$renderInCanvas;
        },
    },
    watch: {
        'model.template'() {
            if (this.isDesignMode) {
                this.templateInit();
                this.checkLoad();
            }
        },
        'model.$renderVersion'() {
            if (this.isDesignMode) {
                this.$nextTick(() => {
                    this.lazyRenderFullScreen(true);
                });
            }
        },
        'model.waterType'() {
            if (this.isDesignMode) {
                this.onWaterTypeChange();
            }
        },
        'model.fullScreenInfo': {
            deep: true,
            handler() {
                if (this.isDesignMode && !this.editing) {
                    this.lazyRenderFullScreen(false, true);
                }
            },
        },
        'model.template.transform': {
            deep: true,
            handler() {
                if (this.isDesignMode && !this.editing) {
                    this.lazyRenderFullScreen(false, true);
                }
            },
        },

        'parentLayout.width'(width) {
            if (this.isDesignMode && this.waterType === 1) {
                this.model.width = width;
            }
        },
        'parentLayout.height'(height) {
            if (this.isDesignMode && this.waterType === 1) {
                this.model.height = height;
            }
        },
    },
    created() {
        // this.lazyRenderToCanvas = throttle(() => {
        //     this.renderToCanvas();
        // }, 80);

        this.lazyRenderFullScreen = throttle(
            (reRenderCell, reRenderRepeat) => {
                if (this.model.waterType === 1) {
                    this.renderFullScreen(reRenderCell, reRenderRepeat);
                }
            },
            80,
            { trailing: true },
        );

        this.lazyExportImage = debounce(() => this.exportImage(), 400, { leading: false });
        this.templateInit();
    },
    mounted() {
        this.model.$getResizeLimit = () => ({
            maxWidth: Infinity,
            minWidth: 20,
            maxHeight: Infinity,
            minHeight: 20,
        });
        this.parentLayout = this.editor.getLayoutByElement(this.model);
        this.$watch(
            () => {
                const { left, top } = this.model.fullScreenInfo;
                return [left, top];
            },
            () => {
                if (this.isDesignMode && !this.editing) {
                    this.lazyRenderFullScreen();
                }
            },
        );

        this.$watch(
            () => {
                const { width, height } = this.model;
                return [width, height];
            },
            () => {
                if (this.isDesignMode) {
                    this.updateSize();
                }
            },
        );

        this.$watch(
            () => {
                const { left, top } = this.model;
                return [left, top];
            },
            () => {
                if (this.isDesignMode) {
                    this.updatePosition();
                }
            },
        );
    },
    methods: {
        load() {
            return this.loadDfd.promise;
        },
        initLoadDfd() {
            const loadDfd = {};
            loadDfd.promise = new Promise((resolve, reject) => {
                loadDfd.resolve = resolve;
                loadDfd.reject = reject;
            }).then(async () => {
                const { waterType, imageUrl } = this.model;
                if (waterType === 1 && (!imageUrl || isBase64(imageUrl))) {
                    await this.$nextTick();
                    return this.renderFullScreen(true);
                }
            });

            this.loadDfd = loadDfd;
            this.initDfd = false;
            this.$nextTick(() => {
                this.initDfd = true;
            });
        },
        // 记录水印模板中需要用到的数据与 cache
        templateInit() {
            this.initLoadDfd();
        },

        /**
         * 普通水印在元素宽高变化时，需要同步到内部的 group
         */
        updateSize() {
            const { model, parentLayout } = this;
            const { waterType, width, height, template } = model;
            if (waterType === 0) {
                template.width = width;
                template.height = height;

                model.resizeCell(width, height);
            } else {
                // 全屏水印限制元素尺寸为画布尺寸
                model.width = parentLayout.width;
                model.height = parentLayout.height;
                this.lazyRenderFullScreen();
            }
        },

        /**
         * 普通水印在位置发生变化时，需要同步到 cellLeft, cellTop
         */
        updatePosition() {
            const { waterType, left, top } = this.model;
            if (waterType === 0) {
                this.model.cellLeft = left;
                this.model.cellTop = top;
            } else {
                this.model.left = 0;
                this.model.top = 0;
            }
        },

        /**
         * 水印类型变化时，需要设置水印的尺寸与位置
         */
        onWaterTypeChange() {
            const { model } = this;
            const { waterType } = model;
            if (waterType === 1) {
                this.renderFullScreen(true);
            }
        },

        async renderFullScreen(reRenderCell = false, reRenderRepeat = false) {
            const { model, editor } = this;
            if (!this.isInEditor && !this.isDesignMode) return;
            if (reRenderCell) {
                await model.renderCell(editor);
            }
            if (reRenderRepeat) {
                await model.renderRepeat(editor);
            }

            this.exportRepeatCanvas();
        },

        async exportRepeatCanvas() {
            if (!this.model.$repeatCanvas) {
                await this.model.renderRepeat(this.editor);
            }

            const { $repeatCanvas } = this.model;
            this.model.$repeatImageUrl = $repeatCanvas.toDataURL('image/png');
            this.model.$repeatImageWidth = $repeatCanvas.width;
            this.model.$repeatImageHeight = $repeatCanvas.height;
            this.model.$renderInCanvas = true;
            this.lazyExportFullCanvas();
        },

        async lazyExportFullCanvas() {
            if (!this._lazyExportFullCanvas) {
                this._lazyExportFullCanvas = debounce(
                    async () => {
                        await this.model.renderFullScreen(this.editor);
                        const { $fullScreenCanvas } = this.model;

                        let url;
                        if (this.options.resource.blobUrlEnable) {
                            url = await new Promise((resolve) => {
                                $fullScreenCanvas.toBlob(
                                    (blob) => {
                                        resolve(URL.createObjectURL(blob));
                                    },
                                    'image/png',
                                    1,
                                );
                            });
                        } else {
                            url = $fullScreenCanvas.toDataURL('image/png', 1);
                        }

                        this.model.imageUrl = url;
                        this.model.imageWidth = $fullScreenCanvas.width;
                        this.model.imageHeight = $fullScreenCanvas.height;
                    },
                    200,
                    { leading: false, trailing: true },
                );
            }
            return this._lazyExportFullCanvas();
        },
    },
    events: {
        'element.loaded'(model) {
            if (model === this.model.template) {
                this.loadDfd.resolve();
            }
        },
        'element.transformStart'(model, data) {
            if (model === this.model && model.waterType === 0) {
                this.$events.$emit('element.transformStart', model.template, data);
            }
        },
        'element.transformEnd'(model, drag, data) {
            if (model === this.model && model.waterType === 0) {
                this.$events.$emit('element.transformEnd', model.template, drag, data);
                // 缩放结束后对其水印元素的宽高
                this.$nextTick(() => {
                    const { cellWidth, cellHeight, waterType } = this.model;
                    if (waterType === 0) {
                        this.model.template.width = cellWidth;
                        this.model.template.height = cellHeight;
                    }
                });
            }
        },
        'element.watermarkUpdated'(element, reRenderCell, reRenderRepeat) {
            if (element === this.model) {
                this.lazyRenderFullScreen(reRenderCell, reRenderRepeat);
            }
        },
    },
});
