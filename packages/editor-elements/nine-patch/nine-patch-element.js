import Promise from 'bluebird';
import { debounce, get } from 'lodash';
import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './nine-patch-element.html';
import autoStretchImage from '@gaoding/editor-utils/auto-stretch-image';

// TODK: QQ 浏览器对 borderImageSlice、borderImageRepeat 支持有些问题
// 需用 canvas 绘制
const isQQBrowser = navigator.userAgent.includes('QQBrowser');

export default inherit(BaseElement, {
    name: 'nine-patch-element',
    template,
    data() {
        return {
            // TODO：统一先用 canvas，css borderimage 在缩放状态下会出现异常
            // https://jira.huanleguang.com/browse/PRODBUG-8
            canvasRendered: true,
        };
    },
    computed: {
        canvasRender() {
            return (
                this.canvasRendered ||
                isQQBrowser ||
                this.model.width < this.model.originWidth ||
                this.model.height < this.model.originHeight
            );
        },

        mainStyle() {
            const {
                model,
                global: { zoom },
            } = this;
            const { url, imageSlice } = model;

            // ['top', 'right', 'bottom', 'left']
            const offsets = [imageSlice.top, imageSlice.right, imageSlice.bottom, imageSlice.left];

            const unitStr = offsets.map((v) => v * 1 * zoom * model.effectScale + 'px').join(' ');
            return {
                borderImageSource: `url(${url})`,
                borderImageSlice: offsets.join(' ') + ' fill',
                borderImageWidth: unitStr,
                borderImageRepeat: 'repeat',
                borderStyle: 'solid',
            };
        },
    },
    methods: {
        // loader
        load() {
            const { url } = this.model;
            if (!url) return Promise.resolve();

            return utils.loadImage(url, this.options.fitCrossOrigin).then((img) => {
                this.$img = img;
                this.model.originWidth = img.naturalWidth;
                this.model.originHeight = img.naturalHeight;
                return this.render();
            });
        },

        autoStretchImage(url) {
            const { width, height, imageSlice, effectScale } = this.model;
            return autoStretchImage(url, {
                targetWidth: Math.round(width),
                targetHeight: Math.round(height),
                imageSlice,
                targetImageSlice: {
                    left: imageSlice.left * effectScale,
                    top: imageSlice.top * effectScale,
                    right: imageSlice.right * effectScale,
                    bottom: imageSlice.bottom * effectScale,
                },
                canvas: this.$refs.canvas,
            });
        },
        render() {
            if (!this.$refs.canvas || !this.canvasRender) return;
            const { url, $img } = this.model;
            this.canvasRendered = true;
            return this.autoStretchImage($img || url);
        },
        exportImage() {
            const { url } = this.model;

            // 协同模式时其他用户可能无法展示 blob url
            if (get(this, 'options.collabOptions.enable')) {
                return Promise.resolve().then(() => {
                    this.model.imageUrl = null;
                });
            }

            return this.autoStretchImage(url)
                .then((canvas) => {
                    const imageType = 'image/png';

                    if (this.options.resource.blobUrlEnable) {
                        return new Promise((resolve) => {
                            canvas.toBlob(
                                (blob) => {
                                    resolve(URL.createObjectURL(blob));
                                },
                                imageType,
                                1,
                            );
                        });
                    }

                    return canvas.toDataURL(imageType, 1);
                })
                .then((url) => {
                    this.model.imageUrl = url || null;
                });
        },
    },
    watch: {
        canvasRender() {
            this.render();
        },
        'model.url'() {
            this.checkLoad();
        },
    },
    events: {
        'element.transformEnd'(model, drag, { action }) {
            const parents = this.editor.getParentGroups(this.model);
            const isInclude = parents
                .map((item) => item.$id)
                .concat(this.model.$id)
                .includes(this.model.$id);

            if (action !== 'resize' || !isInclude) return;
            this.lazyExportImage();
        },
    },
    mounted() {
        this.lazyExportImage = debounce(() => {
            this.exportImage();
        }, 350);

        // 裁切参数变更时重绘
        this.$watch(
            () => {
                const { width, height, url } = this.model;
                return [width, height, url];
            },
            () => {
                if (!this.editor.global.$draging && !this.isDesignMode) {
                    this.lazyExportImage();
                } else {
                    this.render();
                }
            },
        );

        if (!this.model.imageUrl) {
            this.lazyExportImage();
        }
    },
});
