import { cloneDeep } from 'lodash';
import rectUtils from './rect';
import { parseTransform } from './transform';

export function walkLayouts(callbak, deep = true, layouts) {
    const promises = [];
    const deepConditionFn = typeof deep === 'function' ? deep : null;

    const walkElements = (elements = [], layout, parents) => {
        elements.some((element, index) => {
            if (!element) return false;

            const result = callbak(element, layout, index, parents);

            // 中断循环
            if (result === false) return true;

            promises.push(result);

            if (deepConditionFn && !deepConditionFn(element)) {
                return null;
            }
            if (deep && (isGroup(element) || element.type === 'collage')) {
                walkElements(element.elements, element, [...parents, element]);
            }

            if (deep && ['watermark'].includes(element.type)) {
                walkElements([element.$groupModel || element.template], element, [
                    ...parents,
                    element,
                ]);
            }

            return false;
        });
    };
    // 暂时先用抛出异常方式解决
    if (!layouts) throw Error('layouts为空');
    layouts.forEach((layout) => {
        layout && layout.elements && walkElements(layout.elements, layout, []);
    });

    return Promise.all(promises);
}

/**
 * 判断一个元素是否为组元素
 * @param { element } element - 元素
 */
export function isGroup(element) {
    return element && (element.type === 'group' || element.type === 'flex');
}

/**
 * 判断一个元素（或元素数据）是否为动态贴纸元素（元素数据）
 * @param { element ｜ elementModel } element - 元素数据
 */
export function isAnimationImage(element) {
    return (
        element &&
        ['image', 'mask'].includes(element.type) &&
        ['apng'].includes(element.resourceType) &&
        element.naturalDuration > 0
    );
}

/**
 * 判断一个元素数据是否为视频资源
 * @param element - 元素数据
 */
export function isVideoResource(element) {
    return (
        element &&
        element.type === 'image' &&
        element.resourceType === 'mp4' &&
        element.naturalDuration > 0
    );
}

/**
 * 判断一个元素是否为文字元素
 * @param { element } element - 元素
 */
export function isTextElement(element) {
    return ['text', 'effectText', 'threeText'].includes(element.type);
}

/**
 * 判断一个元素是否含有 gif 资源
 * @param { element } element - 元素
 */
export function isGifElement(element) {
    return (
        (element.isGif || element.resourceType === 'gif') &&
        (element.type === 'mask' || element.type === 'image')
    );
}

/**
 * 判断一个元素是否含有 apng 资源
 * @param { element } element - 元素
 */
export function isApngElement(element) {
    return (
        element.isApng ||
        (element.resourceType === 'apng' && (element.type === 'mask' || element.type === 'image'))
    );
}

/**
 * 判断是否为纯文字组
 */
export function isPureTextGroup(element) {
    let hasUnText = false;
    walkLayouts(
        (elm) => {
            if (!elm.type.includes('text')) {
                hasUnText = true;
                return false;
            }
        },
        true,
        [{ elements: element.elements || [] }],
    );
    return !hasUnText;
}

export function isDynamicElement(element) {
    return (
        isGifElement(element) ||
        isApngElement(element) ||
        element.type === 'video' ||
        element.animations?.length
    );
}

/**
 * 解组并返回复制的子元素集合
 * @param { options.element } 元素
 * @param { options.deep } 深度遍历
 * @param { options.keepGroup } 保持 group，通常就算解组后也需要绘制水印、背景或边框
 * @param { options.createElement } 深度遍历
 * @param { options.isGroup } 定义组元素校验
 */
export function collapseGroupElement({
    element,
    deep = false,
    keepGroup = false,
    createElement,
    isGroup,
} = {}) {
    const group = element;
    const elements = group && group.elements;

    if (!elements && !elements.length) {
        return [];
    }

    const recursiveFn = (group) => {
        const groupTransform = group.transform.toArray
            ? group.transform
            : parseTransform(group.transform);
        const groupRotate = groupTransform.rotate;
        const elements = group.elements;
        let result = [];

        if ((group.backgroundColor || group.backgroundEffect) && keepGroup) {
            result.push({
                ...group,
                watermarkEnable: false,
                elements: [],
            });
        }

        result = elements.reduce((r, element) => {
            element = createElement({
                ...element,
            });

            // 解锁部分特性
            element.enableEditable && element.enableEditable();

            // groupRotate 修正
            element.transform.rotate += groupRotate;

            if (groupTransform.scale.y < 0) {
                element.transform.scale.y *= groupTransform.scale.y;
                element.top = group.height - element.top - element.height;
            }

            if (groupTransform.scale.x < 0) {
                element.transform.scale.x *= groupTransform.scale.x;
                element.left = group.width - element.left - element.width;
            }

            const prePoint = {
                x: group.left + element.left + element.width / 2,
                y: group.top + element.top + element.height / 2,
            };

            const newPoint = rectUtils.getRectPoints({
                left: prePoint.x,
                top: prePoint.y,
                width: group.width - element.left * 2 - element.width,
                height: group.height - element.top * 2 - element.height,
                rotate: groupRotate,
                skewX: 0,
                skewY: 0,
            });

            element.left += group.left + newPoint.nw.x - prePoint.x;
            element.top += group.top + newPoint.nw.y - prePoint.y;
            element.animation = cloneDeep(group.animation);

            delete element.$parentId;
            if (deep && isGroup(element)) {
                element = recursiveFn(element);
            }
            return r.concat(element);
        }, result);

        if (group.watermarkEnable && keepGroup) {
            result.push({
                ...group,
                backgroundColor: null,
                backgroundEffect: null,
                elements: [],
            });
        }

        return result;
    };

    return recursiveFn(group);
}

/**
 * 是否是媒体元素(有 startTime, endTime 的元素)
 */
export function isMediaElement(element) {
    return (
        ['video', 'audio'].includes(element.type) || isGifElement(element) || isApngElement(element)
    );
}

/**
 * 是否是字幕元素
 */
export function isAutoSubtitle(element) {
    return element.category === 'autoSubTitle';
}

/**
 * 是否是有范围限制的元素
 * @param {} element  元素
 * @returns boolean
 */
export function isRangeElement(element) {
    return isMediaElement(element) || isAutoSubtitle(element);
}

/**
 * 判断是否为占位元素
 * @param element 元素数据
 */
export function isPlaceholderElement(element) {
    return element.type === 'placeholder';
}

/**
 * 对元素做一些清理
 * @memberof EditorElementMixin
 * @param {elements} elements - 元素集合
 */
export function clearElement(elements) {
    const _elements = [].concat(elements);
    walkLayouts(
        (el) => {
            delete el.$id;
            delete el.uuid;
        },
        true,
        [{ elements: _elements }],
    );

    return elements;
}

/**
 * 判断是否支持特效的元素
 */
export function isSupportEffectElement(element) {
    return ['text', 'effectText', 'image', 'mask'].includes(element.type);
}

/**
 * 判断是否是蒙版元素
 */
export function isMaskElement(element) {
    return element.type === 'mask';
}
