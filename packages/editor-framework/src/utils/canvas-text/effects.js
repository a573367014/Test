import Promise from 'bluebird';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import utils from '../../utils/utils';
import { getEffectsAndShadows } from '@gaoding/editor-utils/effect/browser/adaptor';

function toRadian(angle) {
    return (angle / 180) * Math.PI;
}
export default class FontEffect {
    constructor({ hooks, model, words, sizeOffset }) {
        this.words = words;
        this.sizeOffset = sizeOffset;

        this.hooks = hooks;
        this.nomarlCanvas = hooks.getNomarlCanvas();

        this.outputCanvas = createCanvas();
        this.outputCtx = this.outputCanvas.getContext('2d');

        this.offCanvas = createCanvas();
        this.effectCanvas = createCanvas();
        this.temCanvas = createCanvas();
        this.model = model;

        // 渲染过程 nomarlCanvas -> temCanvas -> effectCanvas -> offCanvas -> outputCanvas
        this.offCtx = this.offCanvas.getContext('2d');
        this.effectCtx = this.effectCanvas.getContext('2d');
        this.temCtx = this.temCanvas.getContext('2d');
    }

    init() {
        this.width = this.nomarlCanvas.width;
        this.height = this.nomarlCanvas.height;

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
                        this[key](item); // nomarlCanvas -> tempCanvas ->effectCanvas
                        this.offCtx.drawImage(this.effectCanvas, 0, 0); // effectCanvas(单个特效) -> offsetCanvas(单层特效)
                        this._clearRect(this.effectCtx);
                    }
                    // 没有填充色的话用原本颜色
                    if (key === 'filling' && (!item || !item.enable)) {
                        this.offCtx.drawImage(this.nomarlCanvas, 0, 0);
                    }
                });
                this.transform(effect); // offectCanvas(单层特效) -> ouputCanvas(总体效果)
                this._clearRect(this.offCtx);
            });
        } else {
            this.offCtx.drawImage(this.nomarlCanvas, 0, 0);
            this.transform();
            this._clearRect(this.offCtx);
        }

        return this.outputCtx;
    }

    transform(effect = {}) {
        const ctx = this.outputCtx;
        const { skew = { x: 0, y: 0 }, offset = { x: 0, y: 0 } } = effect;

        ctx.save();
        ctx.translate(this.sizeOffset.offsetX, this.sizeOffset.offsetY);
        ctx.transform(
            1,
            !skew?.enable ? 0 : Math.tan(toRadian(skew.y)),
            !skew?.enable ? 0 : Math.tan(toRadian(skew.x)),
            1,
            offset.x,
            offset.y,
        );
        ctx.translate(-this.sizeOffset.offsetX, -this.sizeOffset.offsetY);
        ctx.drawImage(this.offCanvas, 0, 0);
        ctx.restore();
    }

    stroke({ width, color }) {
        const { words, sizeOffset } = this;
        const ctx = this.temCtx;
        this._clearRect(ctx);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.miterLimit = 4;
        ctx.lineWidth = width;

        this.hooks.drawWordsBefore(ctx, sizeOffset);

        words.forEach((item) => {
            ctx.font = item.fontStyle;
            ctx.strokeText(
                item.content,
                item.left + sizeOffset.offsetX,
                item.top + item.ascentHeight + sizeOffset.offsetY,
            );
        });
        ctx.restore();

        // tempCanvas -> effectCanvas
        this.effectCtx.drawImage(this.temCanvas, 0, 0);
    }

    shadow(option) {
        // css fill-color 或 color 透明时，也具有阴影效果
        // 画布相反全透明后阴影消失，这里需动态获取
        const nomarlCanvas = this.hooks.getNomarlCanvas('shadow');
        const ctx = this.temCtx;
        this._clearRect(ctx);

        ctx.save();
        if (ctx.filter) {
            // 效果更接近 css
            ctx.filter = `drop-shadow(${option.offsetX + 10000}px ${option.offsetY}px ${
                option.blur
            }px ${option.color})`;
        } else {
            ctx.shadowColor = option.color;
            ctx.shadowBlur = option.blur;
            ctx.shadowOffsetX = option.offsetX + 10000;
            ctx.shadowOffsetY = option.offsetY;
        }

        ctx.drawImage(nomarlCanvas, -10000, 0);
        ctx.restore();
        // tempCanvas -> effectCanvas
        this.effectCtx.drawImage(this.temCanvas, 0, 0);
    }

    filling(option) {
        const nomarlCanvas = this.hooks.getNomarlCanvas('filling');
        const ctx = this.temCtx;

        this._clearRect(ctx);
        ctx.drawImage(nomarlCanvas, 0, 0);
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
        const { angle, stops } = option.gradient;
        const width = this.model.width;
        const height = this.model.height;

        const ang = Math.abs(90 - angle) * (Math.PI / 180);
        // 渐变线长度
        const gradientLineLength =
            Math.abs(width * Math.sin(ang)) + Math.abs(height * Math.cos(ang));
        const center = {
            x: width / 2,
            y: height / 2,
        };
        const yDiff = (Math.sin(ang - Math.PI / 2) * gradientLineLength) / 2;
        const xDiff = (Math.cos(ang - Math.PI / 2) * gradientLineLength) / 2;

        const [topX, topY, botX, botY] = [
            center.x - xDiff,
            center.y - yDiff,
            center.x + xDiff,
            center.y + yDiff,
        ];

        const gradientFill = ctx.createLinearGradient(topX, topY, botX, botY);

        stops.forEach((stop) => {
            gradientFill.addColorStop(stop.offset, stop.color);
        });

        ctx.fillStyle = gradientFill;
        const { x, y } = this._getFillingTranslate();
        ctx.translate(x, y);
        this._fillRect(ctx);
    }

    fillingImage(ctx, option) {
        if (!option.imageContent.image) {
            return Promise.resolve();
        }

        const ptrn = ctx.createPattern(this._imgsMap[option.imageContent.image], 'repeat');
        ctx.fillStyle = ptrn;
        const { scaleX, scaleY } = option.imageContent;
        const { x, y } = this._getFillingTranslate();
        ctx.translate(x, y);
        ctx.scale(scaleX, scaleY);
        this._fillRect(ctx, scaleX, scaleY);
    }

    _getFillingTranslate() {
        if (!this.model.$effectPadding) {
            return {
                x: this.sizeOffset.offsetX,
                y: this.sizeOffset.offset,
            };
        }

        return {
            x: this.sizeOffset.offsetX - this.model.$effectPadding[3],
            y: this.sizeOffset.offsetY - this.model.$effectPadding[0],
        };
    }

    _fillRect(ctx, scaleX = 1, scaleY = 1) {
        ctx.fillRect(0, 0, ctx.canvas.width / scaleX, ctx.canvas.height / scaleY);
    }

    _clearRect(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
