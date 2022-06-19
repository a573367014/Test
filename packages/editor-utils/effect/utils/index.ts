import tinycolor from 'tinycolor2';
import { isSupportEffectElement, isTextElement } from '../../element';
import type { IEffect, IImageEffect, ITextEffect } from '../../types/effect';
import type { IElement } from '../../types/element';
import type { IImageElement } from '../../types/image';
import type { ITextElement } from '../../types/text';
import type { IShadow } from '../../types/shadow';
import type { IReflectShadow } from '../../types/shadow/reflect-shadow';

/**
 * 获取特效数据
 */
export function getEffects<T extends IElement>(element: T): IEffect[] {
    if (!isSupportEffectElement(element)) {
        return [];
    }
    if (isTextElement(element)) {
        return element.textEffects || [];
    }
    return element.imageEffects || [];
}

/**
 * 特效强度调节
 * @param element 目标元素
 * @param ratio 缩放比例
 * @param isPreviewScale 是否是用于预览的缩放
 */
export function scaleEffect(element: ITextElement | IImageElement, ratio: number) {
    if (!element) {
        return;
    }
    const effects = getEffects(element);

    effects.forEach((effect: IImageEffect | ITextEffect) => {
        const { offset, stroke, filling } = effect;
        const { insetShadow } = effect as IImageEffect;

        if (offset) {
            offset.x *= ratio;
            offset.y *= ratio;
        }

        if (stroke) {
            stroke.width *= ratio;
        }

        if (insetShadow) {
            insetShadow.offsetX *= ratio;
            insetShadow.offsetY *= ratio;
        }

        if (filling && [1, 'image'].includes(filling.type) && filling.imageContent) {
            const { scaleX, scaleY } = filling.imageContent;
            filling.imageContent.scaleX = Math.max(1e-2, scaleX * ratio);
            filling.imageContent.scaleY = Math.max(1e-2, scaleY * ratio);
        }
    });

    if (element.shadows) {
        (element.shadows as IShadow[]).forEach((shadow) => {
            if (shadow.type === 'base') {
                shadow.offsetX *= ratio;
                shadow.offsetY *= ratio;
            } else {
                shadow.opacity *= ratio;
                if (shadow.opacity > 1) {
                    shadow.opacity = 1;
                }
                if (shadow.type !== 'reflect') {
                    const colorObj = tinycolor(shadow.color);
                    colorObj.setAlpha(shadow.opacity);
                    (shadow as Exclude<IShadow, IReflectShadow>).color = colorObj.toString('rgb');
                }
            }
        });
    }
}
