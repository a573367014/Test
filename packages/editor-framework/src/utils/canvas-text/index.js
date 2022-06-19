import { createCanvas } from '@gaoding/editor-utils/canvas';
import utils from '../../utils/utils';
import { getLines, getWords } from '@gaoding/editor-utils/get-lines';
import { createFontStyle, getFontMetrics } from './text-utils';
import FontEffects from './effects';
import { getTextExpandRect } from '@gaoding/editor-utils/effect/browser/expand';
import $ from '@gaoding/editor-utils/zepto';
import { getEffectShadowList } from '@gaoding/editor-utils/effect/browser/adaptor';

const isFox = utils.isFox();
const supportMiniFontSize = isFox || window.safari;

const { round } = Math;

/**
 * canvas 文字实现
 *
 * 竖排文字 -> 文字顺时针旋转 90 度，高度变 宽度 + 字间距 宽度变高度
 * @export
 * @class CanvasText
 */
export default class CanvasText {
    constructor(model, editor, node) {
        this.node = node;
        this.model = model;
        this.editor = editor;
        this.options = editor.options;
        this.canvas = createCanvas();
    }

    get isVisible() {
        return this.model.autoAdaptive !== 0;
    }

    get effectShadowList() {
        return getEffectShadowList(this.model);
    }

    get fontSizeScale() {
        // safari 原生支持字号小于12像素
        const minFontSize = supportMiniFontSize ? 1 : this.model.$miniFontSize;
        return Math.min(1, this.model.fontSize / minFontSize);
    }

    get transformOrigin() {
        const origin = { x: 0, y: 0 };
        const align = this.model.verticalAlign;

        // Horizontal
        origin.y = { top: 0, middle: 0.5, bottom: 1 }[align];

        return origin;
    }

    getNodeContentBox() {
        const boxs = [];

        $(this.node)
            .children()
            .each((i, el) => {
                boxs.push({
                    left: el.offsetLeft,
                    top: el.offsetTop,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                });
            });

        const box = {
            left: Math.min(...boxs.map((item) => item.left)),
            top: Math.min(...boxs.map((item) => item.top)),
            right: Math.max(...boxs.map((item) => item.left + item.width)),
            bottom: Math.max(...boxs.map((item) => item.top + item.height)),
        };

        box.width = Math.max(this.node.offsetWidth, box.right - box.left, 0);
        box.height = Math.max(this.node.offsetHeight, box.bottom - box.top, 0);

        return box;
    }

    getSizeOffset() {
        const rect = getTextExpandRect(this.model);

        let dw = 0;
        let dh = 0;
        let dx = 0;
        let dy = 0;

        if (this.model.autoAdaptive !== 0) {
            const contentBox = this.getNodeContentBox();

            dw = Math.max(0, contentBox.width - this.model.width);
            dh = Math.max(0, contentBox.height - this.model.height);

            dx = Math.min(0, contentBox.left);
            dy = Math.min(0, contentBox.top);
        }

        return {
            ...rect,
            width: rect.width + dw,
            height: rect.height + dh,
            offsetX: (rect.left + dx) * -1,
            offsetY: (rect.top + dy) * -1,
        };
    }

    getWords() {
        const { options } = this;
        const lines = getLines(this.node, this.node.parentNode);
        const words = getWords(lines, this.model);

        words.forEach((item) => {
            item.fontSize = Math.max(12, item.fontSize);

            const font = options.fontsMap[item.fontFamily];
            const { ascent } = getFontMetrics(font);
            const ascentHeight = round(ascent * item.fontSize);

            item.fontStyle = createFontStyle(item, font, options);
            item.ascentHeight = ascentHeight;
        });

        return words;
    }

    drawWordsBefore(ctx, sizeOffset) {
        const { fontSizeScale, transformOrigin, model } = this;
        if (fontSizeScale >= 1) return;

        const translateX = model.width * transformOrigin.x + sizeOffset.offsetX;
        const translateY = model.height * transformOrigin.y + sizeOffset.offsetY;

        ctx.translate(translateX, translateY);
        ctx.scale(fontSizeScale, fontSizeScale);
        ctx.translate(-translateX, -translateY);
    }

    drawNormal(options = { color: null, newCanvas: null }) {
        let { canvas } = this;
        const words = this.getWords();
        const sizeOffset = this.getSizeOffset(words);

        canvas = options.newCanvas || canvas;
        canvas.width = sizeOffset.width;
        canvas.height = sizeOffset.height;

        const ctx = canvas.getContext('2d');
        this.drawWordsBefore(ctx, sizeOffset);
        words.forEach((item) => {
            ctx.font = item.fontStyle;
            ctx.fillStyle = options.color || item.color;

            ctx.fillText(
                item.content,
                item.left + sizeOffset.offsetX,
                item.top + item.ascentHeight + sizeOffset.offsetY,
            );
        });

        return {
            ctx,
            words,
            canvas,
            sizeOffset,
        };
    }

    drawEffects(options) {
        let normalData;
        const fe = new FontEffects({
            model: this.model,
            words: options.words,
            sizeOffset: options.sizeOffset,
            hooks: {
                drawWordsBefore: this.drawWordsBefore.bind(this),
                getNomarlCanvas: (effectType) => {
                    if (effectType !== 'shadow' && effectType !== 'filling') {
                        return options.ctx.canvas;
                    } else {
                        // css fill-color 或 color 透明时，也具有阴影效果
                        // 画布相反全透明后阴影消失，这里需动态获取
                        normalData =
                            normalData ||
                            this.drawNormal({ color: '#000', newCanvas: createCanvas() });
                        return normalData.ctx.canvas;
                    }
                },
            },
        });
        return fe.draw();
    }

    /**
     * 绘制文字
     *
     * @returns
     */
    async drawText() {
        try {
            const normalData = this.drawNormal();

            if (this.effectShadowList.length) {
                const ctx = await this.drawEffects(normalData);

                return {
                    offsetX: normalData.sizeOffset.offsetX,
                    offsetY: normalData.sizeOffset.offsetY,
                    canvas: ctx.canvas,
                };
            }

            return {
                offsetX: normalData.sizeOffset.offsetX,
                offsetY: normalData.sizeOffset.offsetY,
                canvas: normalData.canvas,
            };
        } catch (e) {
            console.warn(e);
            this.canvas.width = this.model.width;
            this.canvas.height = this.model.height;
            return {
                canvas: this.canvas,
                offsetX: 0,
                offsetY: 0,
            };
        }
    }
}
