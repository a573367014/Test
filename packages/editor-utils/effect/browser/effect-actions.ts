import Vue from 'vue';
import { cloneDeep, merge } from 'lodash';
import { isSupportEffectElement, isTextElement } from '../../element';
import { getEffects } from '../utils';
import { DEFAULT_EFFECT } from './constant';
import type { ITextElement } from '../../types/text';
import type { IImageEffect, ITextEffect } from '../../types/effect';
import type { IImageElement } from '../../types/image';

type GetEffectType<T extends ITextElement | IImageElement> = T extends ITextElement
    ? ITextEffect
    : IImageEffect;

/**
 * 合并数据或响应式数据
 */
export function mergeData(target: object, options: object) {
    const data = merge({}, target, options);
    for (const key in data) {
        Vue.set(target, key, data[key]);
    }
}

/**
 * 创建一条特效数据
 */
export function createEffect() {
    return cloneDeep(DEFAULT_EFFECT) as ITextEffect | IImageEffect;
}

/**
 * 添加特效
 * @param element - 待添加特效的元素
 * @param options - 特效参数
 */
export function addEffect<T extends ITextElement | IImageElement>(
    element: T,
    options: Partial<GetEffectType<T>> = {},
) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    const effects = getEffects(element);
    const newEffect = createEffect();

    mergeData(newEffect, options);
    effects.unshift(newEffect);
}

/**
 * 复制一份特效
 * @param element - 待处理的元素
 * @param effect - 被复制的特效
 * @returns
 */
export function copyEffect<T extends ITextElement | IImageElement>(
    element: T,
    effect: GetEffectType<T>,
) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    const effects = getEffects(element);
    const newEffect = createEffect();

    mergeData(newEffect, effect);
    const index = effects.findIndex((ef: ITextEffect | IImageEffect) => ef === effect);

    effects.splice(index + 1, 0, newEffect);
}

/**
 * 更新特效
 * @param effect - 待更新的特效
 * @param options - 新特效数据参数
 */
export function updateEffect<T extends ITextElement | IImageElement>(
    effect: GetEffectType<T>,
    options: Partial<GetEffectType<T>> = {},
) {
    mergeData(effect, options);
}

/**
 * 移动特效层级
 * @param element - 待移动特效的元素
 * @param effect - 待移动的特效引用
 * @param newIndex - 特效新的位置
 */
export function moveEffect<T extends ITextElement | IImageElement>(
    element: T,
    effect: GetEffectType<T>,
    newIndex: number,
) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    const effects = getEffects(element);
    const index = effects.findIndex((ef: ITextEffect | IImageEffect) => ef === effect);

    // 位置不变不处理
    if (index === newIndex) {
        return;
    }
    // 是否是往后移动
    const isMoveAfter = newIndex > index;

    effects.splice(newIndex + (isMoveAfter ? 1 : 0), 0, effect);
    effects.splice(index + (isMoveAfter ? 0 : 1), 1);
}

/**
 * 删除一条特效
 * @param {element} element - 待添加特效的元素
 * @param {Object} effect - 待删除的特效引用
 */
export function removeEffect<T extends ITextElement | IImageElement>(
    element: T,
    effect: GetEffectType<T>,
) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    const effects = getEffects(element);
    const index = effects.findIndex((ef) => ef === effect);

    effects.splice(index, 1);
}

/**
 * 移除全部特效
 * @param {element} element - 待移除特效的元素
 */
export function clearEffects(element: ITextElement | IImageElement) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    if (isTextElement(element)) {
        element.textEffects = [];
    } else {
        element.imageEffects = [];
    }
}
