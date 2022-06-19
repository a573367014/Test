import Promise from 'bluebird';
import { BaseRender } from './base';
import { createCanvas, newDrawImageToCanvas } from '@gaoding/editor-utils/canvas';
import autoStretchImage from '@gaoding/editor-utils/auto-stretch-image';
import loader from '@gaoding/editor-utils/loader';
import tinycolor from 'tinycolor2';
import { get as lodashGet, cloneDeep } from 'lodash';
import LayoutModel from '../../base/layout-model';
import ImageRenderer from './image';

const { abs, PI, sin, cos } = Math;
function getPoint(angle, width, height) {
    const ang = (90 - angle) * (PI / 180);
    // 渐变线长度
    const gradientLineLength = abs(width * sin(ang)) + abs(height * cos(ang));
    const center = {
        x: width / 2,
        y: height / 2,
    };
    const yDiff = (sin(ang - PI / 2) * gradientLineLength) / 2;
    const xDiff = (cos(ang - PI / 2) * gradientLineLength) / 2;
    return [center.x - xDiff, center.y - yDiff, center.x + xDiff, center.y + yDiff];
}
export default class BackgroundRender extends BaseRender {
    constructor({ editor, layout, element, canvas }) {
        super({
            canvas,
        });

        this.editor = editor;
        this.layout =
            layout && layout.backgroundSize ? new LayoutModel(cloneDeep(layout), editor) : layout;
        this.element = element;
        this.options = editor.options;
        this.canvas =
            canvas || createCanvas(Math.round(this.model.width), Math.round(this.model.height));
    }

    get model() {
        return this.element || this.layout;
    }

    get background() {
        return this.model.background;
    }

    get opacity() {
        const opacity =
            lodashGet(this, 'element.backgroundEffect.opacity') || this.backgroundImageInfo.opacity;
        return opacity === undefined ? 1 : opacity;
    }

    get effectImage() {
        if (this.element) {
            return (
                lodashGet(this, 'element.backgroundEffect.type') === 'image' &&
                lodashGet(this, 'element.backgroundEffect.image')
            );
        }

        const image = Object.assign({}, this.background?.image);
        image.url =
            this.layout.backgroundEffectImage ||
            lodashGet(this.layout, 'metaInfo.thirdParty.inpaint.url') ||
            image.url;
        return image;
    }

    get effectGradient() {
        if (this.element) {
            return (
                lodashGet(this, 'element.backgroundEffect.type') === 'gradient' &&
                lodashGet(this, 'element.backgroundEffect.gradient')
            );
        }
        return this.background?.gradient;
    }

    get effectNinePatch() {
        if (this.element) {
            return (
                lodashGet(this, 'element.backgroundEffect.type') === 'ninePatch' &&
                lodashGet(this, 'element.backgroundEffect.ninePatch')
            );
        }

        return undefined;
    }

    get backgroundImage() {
        return this.effectImage.url;
    }

    get backgroundImageInfo() {
        return lodashGet(this.background, 'image', this.model.backgroundImageInfo) || {};
    }

    get backgroundColor() {
        const color = lodashGet(this.background, 'color', this.model.backgroundColor);
        return color ? tinycolor(color) : null;
    }

    load() {
        return loader.loadImage(this.backgroundImage);
    }

    async export() {
        const { editor, model } = this;
        if (editor.getComponentById(model.$id)) {
            const layoutVm = this.editor.getComponentById(model.$id);
            const canvas = layoutVm.$refs.background && layoutVm.$refs.background.$refs.canvas;

            if (canvas && window.getComputedStyle(canvas).display !== 'none') {
                await Promise.delay(10);
                this._promise && (await this._promise);
                return canvas;
            }
        }

        await this.render();
        return this.canvas;
    }

    render() {
        this._promise = Promise.try(async () => {
            if (!this.isNeedRender()) return this.canvas;
            this.setPreData();

            const ctx = this.canvas.getContext('2d');
            const {
                backgroundColor,
                effectImage,
                effectGradient,
                effectNinePatch,
                backgroundImage,
            } = this;
            ctx.save();
            if (backgroundColor) {
                this.renderColor(ctx);
            }
            if (effectGradient) {
                this.renderGradient(ctx);
            }

            if (backgroundImage && effectImage) {
                await this.renderImage(ctx);
            }

            if (effectNinePatch) {
                await this.renderNinePatch(ctx);
            }

            ctx.restore();
            return ctx.canvas;
        });

        return this._promise;
    }

    async renderImage(ctx) {
        if (this.element) {
            return this.renderElementImage(ctx);
        }

        const { effectImage } = this;
        const bgImageModel = this.editor.createElement({ ...effectImage, type: 'image' });

        // 有滤镜等需 canvas 绘制的都会在组件渲染时缓存一个渲染器至 editor，所以这里不需要对滤镜做处理
        let imageRenderer = this.layout.hasFilters && this.editor.$renderers.get(this.layout.$id);

        if (
            this.layout.hasFilters &&
            !this.layout.backgroundEffectImage &&
            (!imageRenderer || !imageRenderer.promise)
        ) {
            imageRenderer = new ImageRenderer({
                model: bgImageModel,
                byNaturalSize: true,
                emitEventEnable: false,
                editor: this.editor,
            });
        }

        const image = imageRenderer ? await imageRenderer.export() : await this.load();
        const tempCanvas = createCanvas(bgImageModel.width, bgImageModel.height);

        ctx.save();
        ctx.globalAlpha = effectImage.opacity;
        newDrawImageToCanvas({
            canvas: tempCanvas,
            width: bgImageModel.width,
            height: bgImageModel.height,
            naturalWidth: bgImageModel.naturalWidth,
            naturalHeight: bgImageModel.naturalHeight,
            imageTransformArray: bgImageModel.imageTransform.toArray(),
            blendMode: 'source-over',
            image,
        });

        this.editor.applyElementPropsToCanvas(bgImageModel, tempCanvas, ctx.canvas);
        tempCanvas.width = 0;
        tempCanvas.height = 0;
        ctx.restore();
        return ctx.canvas;
    }

    async renderElementImage(ctx) {
        const { model, effectImage, opacity } = this;
        const transform = effectImage.imageTransform || effectImage.transform;
        const image = await this.load();

        ctx.save();
        ctx.globalAlpha = opacity;
        newDrawImageToCanvas({
            canvas: ctx.canvas,
            image,
            width: model.width,
            height: model.height,
            naturalWidth: effectImage.naturalWidth,
            naturalHeight: effectImage.naturalHeight,
            imageTransformArray: transform.toArray ? transform.toArray() : Object.values(transform),
            blendMode: 'source-over',
        });
        ctx.restore();

        return ctx.canvas;
    }

    renderColor(ctx) {
        const { model } = this;
        const bgColor = this.backgroundColor;

        ctx.save();
        ctx.globalAlpha = bgColor.getAlpha();
        ctx.fillStyle = bgColor.toHexString();
        ctx.fillRect(0, 0, model.width, model.height);
        ctx.restore();
    }

    // tslint:disable-next-line:max-line-length
    // https://stackoverflow.com/questions/45034238/css-convert-gradient-to-the-canvas-version/45034749
    renderGradient(ctx) {
        const { model, effectGradient } = this;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        const { angle, stops } = effectGradient;
        const [topX, topY, botX, botY] = getPoint(angle, model.width, model.height);
        const gradientFill = ctx.createLinearGradient(topX, topY, botX, botY);

        stops.forEach((stop) => {
            gradientFill.addColorStop(stop.offset, tinycolor(stop.color).toRgbString());
        });

        ctx.fillStyle = gradientFill;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    async renderNinePatch(ctx) {
        const { width, height } = this.model;
        const { url, imageSlice, effectScale } = this.effectNinePatch;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        const _canvas = await autoStretchImage(url, {
            targetWidth: Math.round(width),
            targetHeight: Math.round(height),
            imageSlice,
            targetImageSlice: {
                left: imageSlice.left * effectScale,
                top: imageSlice.top * effectScale,
                right: imageSlice.right * effectScale,
                bottom: imageSlice.bottom * effectScale,
            },
        });

        ctx.drawImage(_canvas, 0, 0, width, height);
        ctx.restore();
    }
}
