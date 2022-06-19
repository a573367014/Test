import type { ITextEffect } from '../../types/effect';
import type { IBaseShadow } from '../../types/shadow/base-shadow';
import type { ITextElement } from '../../types/text';
import { getEffectsAndShadows } from './adaptor';
import { getEffects } from '../utils';

export interface TextEffectEngineOptions {
    ratio: number;
}

/**
 * 文字特效（含阴影）绘制
 */
export class TextEffectEngine {
    /** 特效强度比例 */
    ratio = 1;

    constructor(options?: TextEffectEngineOptions) {
        this.ratio = options?.ratio ?? 1;
    }

    /** 绘制简写方法 */
    static draw(element: ITextElement, ratio?: number): Partial<CSSStyleDeclaration>[] {
        const textEffectEngine = new TextEffectEngine({ ratio });

        return textEffectEngine.draw(element);
    }

    /**
     * 绘制特效投影，返回对应的样式列表
     */
    draw(element: ITextElement): Partial<CSSStyleDeclaration>[] {
        const { shadows, effects } = getEffectsAndShadows(element);
        const shadowStyles = shadows.map((shadow) => this.drawShadow(shadow, element));
        const effectStyles = effects.map((effect) => this.drawEffect(effect, element));

        return [...shadowStyles, ...effectStyles];
    }

    /**
     * 绘制投影
     */
    drawShadow(shadow: IBaseShadow, element: ITextElement): Partial<CSSStyleDeclaration> {
        // 目前文字只支持基础投影
        if (shadow.type && shadow.type !== 'base') {
            return {};
        }
        const style: Partial<CSSStyleDeclaration> = {};
        const effects = getEffects(element);
        const enabledEffects = effects.filter((ef) => ef.enable);
        const enabledShadows = element.shadows.filter((sh) => sh.enable);
        const x = shadow.offsetX * this.ratio;
        const y = shadow.offsetY * this.ratio;
        const blur = shadow.blur * this.ratio;
        const color = shadow.color;

        style.textShadow = `${x}px ${y}px ${blur}px ${color}`;

        // 存在特效或者最上层的投影
        if (enabledEffects.length || enabledShadows[0] !== shadow) {
            style.webkitTextFillColor = 'transparent';
        }

        return style;
    }

    /**
     * 绘制
     */
    drawEffect(effect: ITextEffect, element: ITextElement): Partial<CSSStyleDeclaration> {
        const style: Partial<CSSStyleDeclaration> = {};

        if (effect.filling?.enable) {
            Object.assign(style, this.drawFill(effect, element));
        }
        if (effect.stroke?.enable) {
            Object.assign(style, this.drawStroke(effect));
        }
        if (effect.skew?.enable) {
            Object.assign(style, this.drawSkew(effect));
        }
        if (effect.offset?.enable) {
            Object.assign(style, this.drawOffset(effect));
        }

        return style;
    }

    /**
     * 绘制偏移
     */
    drawOffset(effect: ITextEffect) {
        const { x, y } = effect.offset;
        const left = `${(x ?? 0) * this.ratio}px`;
        const top = `${(y ?? 0) * this.ratio}px`;

        return { left, top };
    }

    /**
     * 绘制描边
     */
    drawStroke(effect: ITextEffect): Partial<CSSStyleDeclaration> {
        const { type, color, width } = effect.stroke;
        const strokeWidth = width;

        if (type === 'center') {
            const textStroke = `${strokeWidth * this.ratio}px ${color}`;

            return { webkitTextStroke: textStroke };
        }
        return {};
    }

    /**
     * 绘制倾斜，目前功能已关闭，只对旧数据有效
     */
    drawSkew(effect: ITextEffect): Partial<CSSStyleDeclaration> {
        const { x, y } = effect.skew;

        if (x || y) {
            return { transform: `skew(${x * this.ratio}deg, ${y * this.ratio}deg)` };
        }
        return {};
    }

    /**
     * 绘制填充
     */
    drawFill(effect: ITextEffect, element: ITextElement): Partial<CSSStyleDeclaration> {
        const { type, color, imageContent, gradient } = effect.filling;

        // Pure color
        if (['color', 0].includes(type)) {
            return { webkitTextFillColor: color };
        }

        // Filling image
        if (['image', 1].includes(type) && imageContent && imageContent.image) {
            const style: Partial<CSSStyleDeclaration> = {};
            const type = imageContent.type ?? 'tiled';

            style.backgroundImage = `url(${imageContent.image})`;
            style.backgroundClip = 'text';
            style.webkitBackgroundClip = 'text';
            style.webkitTextFillColor = 'transparent';

            if (imageContent.width && imageContent.height && element.width && element.height) {
                let size = 'auto auto';
                let repeat = 'repeat';
                let position = 'center';

                switch (type) {
                    // 充满图框
                    case 'fill':
                        size = 'cover';
                        repeat = 'no-repeat';
                        break;

                    // 适应图框
                    case 'fit':
                        size = 'contain';
                        repeat = 'no-repeat';
                        break;

                    // 贴合图框
                    case 'crop':
                        size = '100% 100%';
                        repeat = 'no-repeat';
                        break;

                    // 平铺图案
                    case 'tiled':
                    default:
                        size = `${imageContent.width * imageContent.scaleX * this.ratio}px ${
                            imageContent.height * imageContent.scaleY * this.ratio
                        }px`;
                        position = '0 0';
                }
                style.backgroundSize = size;
                style.backgroundRepeat = repeat;
                style.backgroundPosition = position;
            } else {
                style.backgroundSize = 'contain';
                style.backgroundRepeat = imageContent.repeat ?? 'no-repeat';
            }
            return style;
        }

        // Filling gradient
        if (['gradient', 2].includes(type)) {
            const { stops, angle } = gradient;
            const stopStyles = stops.map((stop) => `${stop.color} ${stop.offset * 100}%`);
            const angleStyle = 90 - angle + 'deg';

            return {
                backgroundImage: `linear-gradient(${angleStyle}, ${stopStyles.join(',')})`,
                backgroundClip: 'text',
                webkitBackgroundClip: 'text',
                webkitTextFillColor: 'transparent',
            };
        }

        return {};
    }
}
