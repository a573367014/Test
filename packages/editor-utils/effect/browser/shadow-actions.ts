import Vue from 'vue';
import { cloneDeep, merge } from 'lodash';
import { isSupportEffectElement, isTextElement } from '../../element';
import type { ITextElement } from '../../types/text';
import type { IImageElement } from '../../types/image';
import type { IShadow } from '../../types/shadow';
import type { IBaseShadow } from '../../types/shadow/base-shadow';
import { DEFAULT_SHADOW } from './constant';

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
 * 创建一条投影数据
 */
export function createShadow(type = 'base') {
    return cloneDeep(DEFAULT_SHADOW[type] || DEFAULT_SHADOW.base) as IShadow;
}

/**
 * 添加投影
 * @param element - 待添加投影的元素
 * @param options - 投影参数
 */
export function addShadow(element: ITextElement | IImageElement, options: Partial<IShadow> = {}) {
    if (!element || !element.shadows || !isSupportEffectElement(element)) {
        return;
    }
    const shadow = createShadow(options.type) as IShadow | IBaseShadow;

    mergeData(shadow, options);
    if (isTextElement(element)) {
        element.shadows.unshift(shadow as IBaseShadow);
    } else {
        element.shadows.unshift(shadow);
    }
}

/**
 * 复制一份投影
 * @param element - 待处理的元素
 * @param shadow - 被复制的投影
 * @returns
 */
export function copyShadow(element: ITextElement | IImageElement, shadow: IShadow) {
    if (!element || !element.shadows || !isSupportEffectElement(element)) {
        return;
    }
    const newShadow = createShadow(shadow.type);

    mergeData(newShadow, shadow);
    const index = element.shadows.findIndex((s) => s === shadow);

    element.shadows.splice(index + 1, 0, newShadow);
}

/**
 * 更新投影
 * @param shadow - 待变更投影的引用
 * @param options - 新投影参数
 */
export function updateShadow(shadow: IShadow, options: Partial<IShadow> = {}) {
    // 有传 type，且不等于原来的 type，且支持的类型
    if (options.type && options.type !== shadow.type && DEFAULT_SHADOW[options.type]) {
        // 删除所有数据
        for (const key in shadow) {
            delete shadow[key];
        }
        mergeData(shadow, { ...DEFAULT_SHADOW[options.type], ...options });
    } else {
        mergeData(shadow, options);
    }
}

/**
 * 移动投影层级
 * @param element - 待移动投影的元素
 * @param shadow - 待投影的特效引用
 * @param newIndex - 投影新的位置
 */
export function moveShadow(
    element: ITextElement | IImageElement,
    shadow: IShadow,
    newIndex: number,
) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    const shadows = element.shadows || [];
    const index = shadows.findIndex((s) => s === shadow);

    // 位置不变不处理
    if (index === newIndex) {
        return;
    }
    // 是否是往后移动
    const isMoveAfter = newIndex > index;

    shadows.splice(newIndex + (isMoveAfter ? 1 : 0), 0, shadow);
    shadows.splice(index + (isMoveAfter ? 0 : 1), 1);
}

/**
 * 删除一条投影
 * @param element
 * @param shadow
 */
export function removeShadow(element: ITextElement | IImageElement, shadow: IShadow) {
    if (!element || !element.shadows || !isSupportEffectElement(element)) {
        return;
    }
    const index = element.shadows.findIndex((s) => s === shadow);

    element.shadows.splice(index, 1);
}

/**
 * 移除所有投影
 * @param {element} element - 待移除投影的元素
 * @returns
 */
export function clearShadows(element: ITextElement | IImageElement) {
    if (!element || !isSupportEffectElement(element)) {
        return;
    }
    element.shadows = [];
}
