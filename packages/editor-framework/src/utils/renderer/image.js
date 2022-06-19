import { defaults, cloneDeep, debounce, throttle } from 'lodash';
import Promise from 'bluebird';
import {
    createCanvas,
    resizeImageByCanvas,
    newDrawImageToCanvas,
    imageHasOpacity,
} from '@gaoding/editor-utils/canvas';
import { ImageEffectEngine } from '@gaoding/editor-utils/effect/browser/image-effect-engine';
import maskBackgroundSvg from '../../styles/assets/mask-background.svg';
import { BaseRender } from './base';
import FilterRenderer from '../filter-renderer/render';
import utils from '../utils';
import { uuid } from '@gaoding/editor-utils/string';

const IMAGE_OPTION = {
    resizeByPica: true,
    renderFilter: true,
    renderEffect: true,
    force: false,

    img: null,
    imgWidth: null,
    imgHeight: null,
};

/**
 * 图片渲染引擎
 * 加载模板 -> 裁剪 -> 滤镜 -> 图片样式
 */
export default class ImageRenderer extends BaseRender {
    constructor({ model, editor, canvas, byNaturalSize, hooks, emitEventEnable = true } = {}) {
        super({
            renderProvide: null,
            renderDiffKeys: [
                'url',
                'checkProps',
                'filter',
                'filterInfo',
                'imageEffects',
                'shadows',
            ],
        });

        this.renderProvide = {
            url: () => {
                return this.model.url + this.model.mask;
            },
            checkProps: () => {
                const {
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                    imageTransform,
                } = this.model;
                const { rotation } = imageTransform;

                // 取整、避免 naturalWidth 重置导致的误算
                const result = [
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                    width,
                    height,
                ].map((v) => Math.round(v));
                result.push(rotation);

                return result.join(' ');
            },
            filter: () => {
                return Object.assign({}, this.model.filter);
            },
            filterInfo: () => {
                return Object.assign({}, this.model.filterInfo);
            },
            imageEffects: () => {
                return cloneDeep(this.model.imageEffects);
            },
            shadows: () => {
                return cloneDeep(this.model.shadows);
            },
        };

        this.model = model;
        this.editor = editor;
        this.options = editor.options;
        this.hooks = hooks || {};
        this.emitEventEnable = emitEventEnable !== false;
        this.byNaturalSize = byNaturalSize;

        this.canvas = canvas || createCanvas();
        this.offCanvas = createCanvas();
        this.filterRenderer = new FilterRenderer({ model, editor, canvas });
        this.imageEffectEngine = new ImageEffectEngine();
    }

    get promise() {
        return this._promise;
    }

    get hasEffects() {
        return this.model.hasEffects;
    }

    get hasFilters() {
        return this.model.hasFilters;
    }

    updateModel(model) {
        this.model = model;
        this.filterRenderer.model = model;
    }

    load() {
        const { model, options } = this;
        return Promise.all([
            model.url ? utils.loadImage(model.url, options.fitCrossOrigin, true) : null,
            model.mask ? utils.loadImage(model.mask, options.fitCrossOrigin) : null,
        ]);
    }

    async render(imgOption = {}) {
        if (!imgOption.img && !this.model.url) {
            return this.model.type === 'mask' && this.renderBackground();
        }

        imgOption = defaults(imgOption, IMAGE_OPTION);

        if (!imgOption.force && !this.isNeedRender()) {
            return this._promise;
        }

        this.hooks.renderBefore && this.hooks.renderBefore(imgOption);
        this.emitEventEnable &&
            this.editor.$events.$emit('imageRenderer.renderBefore', this.model, imgOption);

        this.setPreData();
        this._taskId = uuid();
        this._promise = Promise.try(() =>
            this.byNaturalSize ? this._renderNatural(imgOption) : this._render(imgOption),
        );

        return this._promise
            .catch((e) => {
                console.error(e);
                throw e;
            })
            .finally(() => {
                this.hooks.renderAfter && this.hooks.renderAfter(imgOption);
                this.emitEventEnable &&
                    this.editor.$events.$emit('imageRenderer.renderAfter', this.model, imgOption);
            });
    }

    async _renderNatural(imgOption = {}) {
        const curTaskId = this._taskId;
        const needCancelTask = () => curTaskId !== this._taskId;

        const { model, offCanvas: canvas, options } = this;
        const ctx = canvas.getContext('2d');
        let [img] = await this.load();

        if (imgOption.img && typeof imgOption.img === 'string') {
            img = await utils.loadImage(imgOption.img, options.fitCrossOrigin, true);
        } else if (imgOption.img) {
            img = imgOption.img;
        }

        if (!img || needCancelTask()) return Promise.resolve();

        const { naturalWidth, naturalHeight } = model;

        const ratioX = 1;
        const ratioY = 1;

        // 手动处理宽高，否则 canvas 将向下取整
        const canvasWidth = Math.max(1, Math.round(naturalWidth * ratioX));
        const canvasHeight = Math.max(1, Math.round(naturalHeight * ratioY));

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.scale(ratioX, ratioY);

        return Promise.try(() => {
            if (needCancelTask()) return;
            if (this.hasFilters && imgOption.renderFilter) {
                return this.filterRenderer
                    .applyFilters()
                    .then((img) => {
                        // 滤镜应用出错时，回退为原始图
                        this.editor.$events.$emit('imageRenderer.renderFilterAfter', img);
                        return img;
                    })
                    .catch(() => {
                        return img;
                    });
            }

            return img;
        }).then((offCanvas) => {
            if (needCancelTask()) return;

            this.canvas.width = offCanvas.width;
            this.canvas.height = offCanvas.height;

            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
            ctx.drawImage(offCanvas, 0, 0);
        });
    }

    async _render(imgOption = {}) {
        const curTaskId = this._taskId;
        const needCancelTask = () => curTaskId !== this._taskId;

        const { model, offCanvas: canvas, options } = this;
        const ctx = canvas.getContext('2d');
        let [img, mask] = await this.load();

        if (imgOption.img && typeof imgOption.img === 'string') {
            img = await utils.loadImage(imgOption.img, options.fitCrossOrigin, true);
        } else if (imgOption.img) {
            img = imgOption.img;
        }

        if (!img || needCancelTask()) return Promise.resolve();

        let { imageTransform, naturalWidth, naturalHeight, width, height } = model;

        let imageTransformArray = imageTransform.toArray();

        // 图片拖拽替换时，自定义绘制信息
        if (imgOption.imgWidth && imgOption.imgHeight) {
            const { imgWidth, imgHeight } = imgOption;

            if (typeof imgWidth === 'number' && typeof imgHeight === 'number') {
                naturalWidth = imgWidth;
                naturalHeight = imgHeight;
                imageTransformArray = [1, 0, 0, 1, 0, 0];
            }
        }

        const ratioX = 1;
        const ratioY = 1;

        // 手动处理宽高，否则 canvas 将向下取整
        const canvasWidth = Math.max(1, Math.round(width * ratioX));
        const canvasHeight = Math.max(1, Math.round(height * ratioY));

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        mask && ctx.drawImage(mask, 0, 0, canvasWidth, canvasHeight);
        ctx.scale(ratioX, ratioY);

        // Reset globalCompositeOperation.
        ctx.globalCompositeOperation = 'source-over';

        if (imgOption.resizeByPica && canUsePica(this.editor.options, model)) {
            img = await resizeImageByCanvas(
                img,
                model.$imageWidth,
                model.$imageHeight,
                this.editor.options.picaResizeOptions,
                true,
            );
        }

        return Promise.try(() => {
            if (needCancelTask()) return;
            if (this.hasFilters && imgOption.renderFilter) {
                return this.filterRenderer.applyFilters().catch(() => {
                    // 滤镜应用出错时，回退为原始图
                    return img;
                });
            }

            return img;
        })
            .then((image) => {
                if (needCancelTask()) return;

                newDrawImageToCanvas({
                    canvas,
                    width,
                    height,
                    naturalWidth,
                    naturalHeight,
                    imageTransformArray,
                    blendMode: mask ? 'source-in' : 'source-over',
                    image,
                });

                if (this.hasEffects && imgOption.renderEffect) {
                    // 不加蒙板的效果图层，用于特效填充
                    // const exMaskCanvas = document.createElement('canvas');
                    // exMaskCanvas.width = canvasWidth;
                    // exMaskCanvas.height = canvasHeight;
                    // newDrawImageToCanvas({
                    //     canvas: exMaskCanvas,
                    //     width,
                    //     height,
                    //     naturalWidth,
                    //     naturalHeight,
                    //     imageTransformArray,
                    //     blendMode: 'source-over',
                    //     image,
                    // });
                    this.emitEventEnable &&
                        this.editor.$events.$emit(
                            'imageRenderer.renderEffectBefore',
                            this.model,
                            // exMaskCanvas,
                        );
                    return this.renderEffect(canvas, curTaskId);
                } else {
                    return canvas;
                }
            })
            .then((offCanvas) => {
                if (needCancelTask()) return;

                this.canvas.width = offCanvas.width;
                this.canvas.height = offCanvas.height;

                const ctx = this.canvas.getContext('2d');
                ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                ctx.drawImage(offCanvas, 0, 0);
            });
    }

    async renderEffect(targetCanvas, curTaskId) {
        const needCancelTask = () => curTaskId !== this._taskId;
        const { model } = this;

        // Render effects
        const { canvas, effectModel } = await this.imageEffectEngine.applyEffects(
            targetCanvas,
            model,
            false,
        );

        if (needCancelTask()) return canvas;
        this.hooks.renderEffectAfter && this.hooks.renderEffectAfter(model, effectModel);
        this.emitEventEnable &&
            this.editor.$events.$emit('imageRenderer.renderEffectAfter', this.model, effectModel);

        return canvas;
    }

    async renderBackground(imgOption = {}) {
        if (!imgOption.force && !this.isNeedRender()) {
            return this._promise;
        }
        this.setPreData();

        // 高度不够撑高，宽度不够平铺图片
        const fitCrossOrigin = this.options.fitCrossOrigin;
        const maskBackground = await utils.loadImage(maskBackgroundSvg, fitCrossOrigin);

        const elemWidth = this.model.width;
        const elemHeight = this.model.height;
        let xOffset = 0;
        const yOffset = 0;
        let drawCount = 1;

        const imgRatio = maskBackground.naturalWidth / maskBackground.naturalHeight;
        maskBackground.height = elemHeight;
        maskBackground.width = elemHeight * imgRatio;
        if (elemWidth < maskBackground.width) {
            xOffset = (elemWidth - maskBackground.width) / 2;
        } else {
            drawCount = Math.ceil(elemWidth / maskBackground.width);
        }

        const canvas = createCanvas(elemWidth, elemHeight);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < drawCount; i++) {
            ctx.drawImage(
                maskBackground,
                0,
                0,
                maskBackground.naturalWidth,
                maskBackground.naturalHeight,
                maskBackground.width * i + xOffset,
                yOffset,
                maskBackground.width,
                maskBackground.height,
            );
        }

        return this.render({
            img: canvas,
            imgWidth: elemWidth,
            imgHeight: elemHeight,
            resizeByPica: false,
            force: true,
            renderFilter: false,
            renderEffect: false,
        }).catch(console.error);
    }

    async export(imgOption) {
        if (!this._promise || (imgOption && imgOption.force)) {
            await this.render(imgOption);
        }

        await this._promise;
        return this.canvas;
    }

    async exportBlob(imgOption = {}) {
        const canvas = this.canvas;

        await this.export(imgOption);

        let type = imgOption.exportType;
        if (!type) {
            const hasOpacity = imageHasOpacity(canvas);
            type = hasOpacity ? 'image/png' : 'image/jpeg';
        }

        return new Promise((resolve) => {
            canvas.toBlob(resolve, type);
        });
    }

    async exportImage(imgOption) {
        const blob = this.exportBlob(imgOption);
        return URL.createObjectURL(blob);
    }

    lazyExportImage(imgOption) {
        if (!this._lazyExportImage) {
            this._lazyExportImage = debounce((imgOption) => {
                this.exportImage(imgOption);
            }, 1000);
        }

        this._lazyExportImage(imgOption);
    }

    lazyRender(imgOption) {
        if (!this._lazyRender) {
            this._lazyRender = throttle((imgOption) => {
                this.render(imgOption);
            }, 100);
        }

        this._lazyRender(imgOption);
    }

    lazyRenderCancel() {
        this._lazyRender && this._lazyRender.cancel();
    }
}

export function canUsePica(options, element) {
    return (
        options.picaResizeEnable &&
        Math.max(
            element.naturalWidth / element.$imageWidth,
            element.naturalHeight / element.$imageHeight,
        ) > options.picaResizeOptions?.scaleThreshold
    );
}
