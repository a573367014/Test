import { cloneDeep, merge } from 'lodash';
import { isSupportEffectElement, isTextElement } from '../../element';
import type { ITextElement } from '../../types/text';
import type { IElement } from '../../types/element';
import type { IShadow } from '../../types/shadow';
import type { ITextEffect, IImageEffect } from '../../types/effect';
import type { IImageElement } from '../../types/image';
import type { IBaseShadow } from '../../types/shadow/base-shadow';

export function getEffectedTextEffects(element: ITextElement) {
    let result = element.textEffects.filter((effect) => {
        return effect.enable !== false;
    });

    // 外描边处理
    result = result.reduce((newResult, effect) => {
        const valid =
            effect.enable !== false &&
            effect.stroke &&
            effect.stroke.enable !== false &&
            effect.stroke.type === 'outer';
        effect = cloneDeep(effect);

        if (!valid) {
            newResult.push(effect);
        } else {
            const nextEffect = merge({}, effect, {
                stroke: {
                    enable: true,
                    type: 'center',
                    color: effect.stroke.color,
                    width: effect.stroke.width * 2,
                },
            });

            if (effect.stroke) effect.stroke.enable = false;
            if (effect.shadow) effect.shadow.enable = false;

            newResult.push(effect);
            newResult.push(nextEffect);
        }

        return newResult;
    }, []);

    return result;
}

/**
 * 获取适配视图处理后的特效和投影数据
 */
export function getEffectsAndShadows<T extends IElement>(element: T) {
    if (!isSupportEffectElement(element)) {
        return { shadows: [], effects: [] };
    }
    const shadows = [...(element.shadows || [])].filter(
        (sh) => sh.enable,
    ) as (T extends IImageElement ? IShadow : IBaseShadow)[];
    const effects = (
        isTextElement(element)
            ? getEffectedTextEffects(element)
            : element.imageEffects.filter((ef) => ef.enable)
    ) as (T extends IImageElement ? IImageEffect : ITextEffect)[];

    shadows.reverse();
    effects.reverse();

    return { shadows, effects };
}

interface IShadowInEffect {
    enable: boolean;
    shadow: IShadow;
}

/**
 * 获取特效和投影融合后的列表数据
 */
export function getEffectShadowList(
    element: IElement,
): (IShadowInEffect | (IImageEffect | ITextEffect))[] {
    const { shadows, effects } = getEffectsAndShadows(element);

    return [...shadows.map((shadow) => ({ enable: shadow.enable, shadow })), ...effects];
}
