import Promise from 'bluebird';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import { drawPath, toRadian } from './index';
import utils from '@gaoding/editor-framework/src/utils/utils';
import { createPromiseQueue } from '@gaoding/editor-framework/src/utils/three-text/utils/promise-queue';
import { getEffectsAndShadows } from '@gaoding/editor-utils/effect/browser/adaptor';

const canvas1 = createCanvas();
const canvas2 = createCanvas();
const canvas3 = createCanvas();

const timeOut = 20000;
const promiseQueue = createPromiseQueue({
    timeout: timeOut,
});

export default class FontEffect {
    constructor({
        inputCtx,
        outputCtx,
        paths,
        pathOffset,
        model,
        mode = 'design',
        devicePixelRatio = window.devicePixelRatio,
    }) {
        this.paths = paths;
        this.pathOffset = pathOffset;

        this.inputCtx = inputCtx;
        this.inputCanvas = inputCtx.canvas;
        this.outputCtx = outputCtx;
        this.outputCanvas = outputCtx.canvas;

        this.offCanvas = canvas1;
        this.effectCanvas = canvas2;
        this.temCanvas = canvas3;
        this.model = model;
        // 设计渲染队列的请求发起方识别,如果不加 mode 会导致，会导致多模式下同一元素的渲染请求只会保留一个
        this.id = model.$id + mode;
        this.devicePixelRatio = devicePixelRatio;

        // 渲染过程 inputCanvas -> temCanvas -> effectCanvas -> offCanvas -> outputCanvas
        this.offCtx = this.offCanvas.getContext('2d');
        this.effectCtx = this.effectCanvas.getContext('2d');
        this.temCtx = this.temCanvas.getContext('2d');
    }

    init() {
        this.width = this.inputCanvas.width;
        this.height = this.inputCanvas.height;

        this.outputCanvas.width =
            this.temCanvas.width =
            this.offCanvas.width =
            this.effectCanvas.width =
                this.width;
        this.outputCanvas.height =
            this.temCanvas.height =
            this.offCanvas.height =
            this.effectCanvas.height =
                this.height;
    }

    load() {
        const urls = [];
        this._imgsMap = {};
        // 加载图案填充的图
        this.model.textEffects.forEach((effect) => {
            const url =
                effect.filling &&
                effect.filling.enable &&
                [1, 'image'].includes(effect.filling.type) &&
                effect.filling.imageContent.image;
            url && urls.push(url);
        });

        return Promise.map(urls, utils.loadImage).then((imgs) => {
            imgs.forEach((img, i) => {
                this._imgsMap[urls[i]] = img;
            });
        });
    }

    async draw() {
        await this.load();
        this.init();

        const { shadows, effects } = getEffectsAndShadows(this.model);

        shadows.forEach((sh) => {
            // 存在 type 字段，且不是基础投影的不渲染
            if (sh.type && sh.type !== 'base') {
                return;
            }
            this.shadow(sh);
            this.offCtx.drawImage(this.effectCanvas, 0, 0); // effectCanvas(单个特效) -> offsetCanvas(单层特效)
            this._clearRect(this.effectCtx);
            this.transform();
            this._clearRect(this.offCtx);
        });
        if (effects.length > 0) {
            effects.forEach((effect) => {
                ['filling', 'stroke'].forEach((key) => {
                    const item = effect[key];
                    if (item && item.enable && this[key]) {
                        this[key](item); // inputCanvas -> tempCanvas ->effectCanvas
                        this.offCtx.drawImage(this.effectCanvas, 0, 0); // effectCanvas(单个特效) -> offsetCanvas(单层特效)
                        this._clearRect(this.effectCtx);
                    }
                    // 没有填充色的话用原本颜色
                    if (item && key === 'filling' && !item.enable) {
                        this.offCtx.drawImage(this.inputCanvas, 0, 0);
                    }
                });
                this.transform(effect); // offectCanvas(单层特效) -> ouputCanvas(总体效果)
                this._clearRect(this.offCtx);
            });
        } else {
            this.offCtx.drawImage(this.inputCanvas, 0, 0);
            this.transform();
            this._clearRect(this.offCtx);
        }
    }

    async render() {
        return promiseQueue.run(this.id, this.draw.bind(this));
    }

    transform(effect = {}) {
        const ctx = this.outputCtx;
        const { skew = { x: 0, y: 0 }, offset = { x: 0, y: 0 } } = effect;

        ctx.save();
        ctx.setTransform(
            1,
            Math.tan(toRadian(skew.y)),
            Math.tan(toRadian(skew.x)),
            1,
            offset.x * this.devicePixelRatio,
            offset.y * this.devicePixelRatio,
        );
        ctx.drawImage(this.offCanvas, 0, 0);
        ctx.restore();
    }

    stroke({ width, color }) {
        const ctx = this.temCtx;
        this._clearRect(ctx);

        ctx.save();
        ctx.translate(this.pathOffset.x, this.pathOffset.y);
        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        ctx.miterLimit = 4 * this.devicePixelRatio;
        this.paths.forEach((path) => {
            drawPath(ctx, path.commands, {
                strokeWidth: Math.round(width),
                strokeStyle: color,
                isOnlyStorke: true,
                offset: this.pathOffset,
            });
        });
        ctx.restore();

        // tempCanvas -> effectCanvas
        this.effectCtx.drawImage(this.temCanvas, 0, 0);
    }

    shadow(option) {
        const ctx = this.temCtx;
        this._clearRect(ctx);

        ctx.save();
        ctx.shadowColor = option.color;
        ctx.shadowBlur = option.blur;
        ctx.shadowOffsetX = option.offsetX * this.devicePixelRatio + 10000;
        ctx.shadowOffsetY = option.offsetY * this.devicePixelRatio;
        ctx.drawImage(this.inputCanvas, -10000, 0);
        ctx.restore();
        // tempCanvas -> effectCanvas
        this.effectCtx.drawImage(this.temCanvas, 0, 0);
    }

    filling(option) {
        const ctx = this.temCtx;
        this._clearRect(ctx);
        ctx.drawImage(this.inputCanvas, 0, 0);

        ctx.save();
        ctx.globalCompositeOperation = 'source-in';
        if ([0, 'color'].includes(option.type)) {
            this.fillingColor(ctx, option);
        } else if ([1, 'image'].includes(option.type)) {
            this.fillingImage(ctx, option);
        } else if ([2, 'gradient'].includes(option.type)) {
            this.fillingGradient(ctx, option);
        }
        ctx.restore();

        // tempCanvas -> effectCanvas
        this.effectCtx.drawImage(this.temCanvas, 0, 0);
    }

    fillingColor(ctx, option) {
        ctx.fillStyle = option.color;
        this._fillRect(ctx);
    }

    fillingGradient(ctx, option) {
        const w = this.width / 2;
        const h = this.height / 2;

        const radian = -toRadian(option.gradient.angle);
        const r = Math.abs(w * Math.sin(radian)) + Math.abs(h * Math.cos(radian));
        const linegrad = ctx.createLinearGradient(
            w - r * Math.cos(radian),
            h - r * Math.sin(radian),
            w + r * Math.cos(radian),
            h + r * Math.sin(radian),
        );
        for (const colorSet of option.gradient.stops) {
            linegrad.addColorStop(colorSet.offset, colorSet.color);
        }

        ctx.fillStyle = linegrad;
        this._fillRect(ctx);
    }

    fillingImage(ctx, option) {
        if (!option.imageContent.image) {
            return Promise.resolve();
        }

        const ptrn = ctx.createPattern(this._imgsMap[option.imageContent.image], 'repeat');
        ctx.fillStyle = ptrn;
        const { scaleX, scaleY } = option.imageContent;
        ctx.scale(scaleX, scaleY);
        this._fillRect(ctx, scaleX, scaleY);
    }

    _fillRect(ctx, scaleX = 1, scaleY = 1) {
        ctx.fillRect(0, 0, ctx.canvas.width / scaleX, ctx.canvas.height / scaleY);
    }

    _clearRect(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
