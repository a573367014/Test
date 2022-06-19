/**
 * 此文件已废弃，移至 ./effect/utils/expand.ts
 * 文件已还原到最初的样子，保留文件考虑到被一些未知文件引用到
 */
import { get } from 'lodash';
import rectUtils from './rect';
import transformMathUtils from './transform-math';
import { parseTransform } from './transform';

const { max, round } = Math;

export function handlerImageEffectedResult(element, image) {
    const { width, height, hasEffects, effectedResult, resourceType } = element;
    const isEffectImage =
        hasEffects && (!resourceType || ['image', 'jpeg', 'jpg', 'png'].includes(resourceType));

    return {
        canvas: image,
        offsetX: isEffectImage ? -effectedResult.left : 0,
        offsetY: isEffectImage ? -effectedResult.top : 0,
        elementRealWidth: isEffectImage ? effectedResult.width : width,
        elementRealHeight: isEffectImage ? effectedResult.height : height,
    };
}

/**
 * 合并多个扩展数据
 */
export function getExpandByExpands(expands) {
    const finalExpand = { left: 0, right: 0, top: 0, bottom: 0 };
    expands.forEach((expand) => {
        for (const key in finalExpand) {
            finalExpand[key] = Math.max(finalExpand[key], Math.ceil(expand[key]), 0);
        }
    });
    return finalExpand;
}

/**
 * 计算特效引起的扩展
 */
export function calculateEffectExpand(element) {
    const effects = element.imageEffects || element.textEffects || [];
    const expands = effects
        .filter((ef) => ef.enable)
        .map((effect) => {
            const expand = { left: 0, right: 0, top: 0, bottom: 0 };
            const { offset, stroke } = effect;

            if (offset && offset.enable) {
                expand.right += offset.x;
                expand.left -= offset.x;
                expand.bottom += offset.y;
                expand.top -= offset.y;
            }
            if (stroke && stroke.enable && stroke.width > 0) {
                const safeThreshold = 6;
                const ratio = stroke.type === 'outer' ? 2 : 1;
                // 6 是阈值，计算公式不一定准确
                expand.right += stroke.width * ratio + safeThreshold;
                expand.left += stroke.width * ratio + safeThreshold;
                expand.bottom += stroke.width * ratio + safeThreshold;
                expand.top += stroke.width * ratio + safeThreshold;
            }

            return expand;
        });

    return getExpandByExpands(expands);
}

/**
 * 计算投影引起的扩展
 */
export function calculateShadowExpand(element) {
    const expands = (element.shadows || [])
        .filter((shadow) => shadow.enable)
        .reduce((result, shadow) => {
            const expand = { left: 0, right: 0, top: 0, bottom: 0 };

            expand.right += Math.max(shadow.offsetX, 0);
            expand.left -= Math.min(shadow.offsetX, 0);
            expand.bottom += Math.max(shadow.offsetY, 0);
            expand.top -= Math.min(shadow.offsetY, 0);

            expand.right += shadow.blur;
            expand.left += shadow.blur;
            expand.bottom += shadow.blur;
            expand.top += shadow.blur;

            return result.concat(expand);
        }, []);
    return getExpandByExpands(expands);
}

export function calculateExpand(element, cacheKey) {
    const effectExpand = calculateEffectExpand(element);
    const shadowExpand = calculateShadowExpand(element, cacheKey);

    return getExpandByExpands([effectExpand, shadowExpand]);
}

export function getGroupExpandRect(element) {
    let rects = element.elements.map((child) => {
        const childRect = getElementExpandRect(child);
        const pivot = { x: child.left + child.width / 2, y: child.top + child.height / 2 };
        const transform = get(child, 'transform.toJSON')
            ? child.transform
            : parseTransform(child.transform);
        const points = rectUtils.newGetRectPoints(
            {
                left: child.left + childRect.left,
                top: child.top + childRect.top,
                width: childRect.width,
                height: childRect.height,
                rotate: transform.rotate,
                scaleX: transform.scale.x,
                scaleY: transform.scale.y,
            },
            pivot,
        );

        const rect = rectUtils.getRectByPoints(points);
        return rect;
    });

    // 保证最小宽高为组本身的大小
    rects = rects.concat([
        {
            width: element.width,
            height: element.height,
            left: 0,
            top: 0,
            rotate: 0,
        },
    ]);

    return rectUtils.getBBoxByBBoxs(rects);
}

export function getImageExpandRect(element) {
    const expand = calculateExpand(element);

    return {
        left: -expand.left,
        top: -expand.top,
        width: element.width + expand.left + expand.right,
        height: element.height + expand.top + expand.bottom,
    };
}

function _getTextBBoxRect(element) {
    const rect = {
        width: element.width,
        height: element.height,
        left: 0,
        top: 0,
        rotate: 0,
    };

    const skewEffects = element.textEffects.filter((ef) => ef.enable && ef.skew && ef.skew.enable);
    if (!skewEffects.length) return rect;

    const points = skewEffects.reduce((r, ef) => {
        const point = rectUtils.newGetRectPoints(
            {
                ...rect,
                skewX: transformMathUtils.degToRad(ef.skew.x),
                skewY: transformMathUtils.degToRad(ef.skew.y),
            },
            {
                x: 0,
                y: 0,
            },
        );
        r.push(point.nw, point.ne, point.sw, point.se);
        return r;
    }, []);

    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    points.forEach((point) => {
        if (point.x < left) {
            left = point.x;
        }
        if (point.x > right) {
            right = point.x;
        }
        if (point.y < top) {
            top = point.y;
        }

        if (point.y > bottom) {
            bottom = point.y;
        }
    });

    return {
        width: right - left,
        height: bottom - top,
        left: left,
        top: top,
    };
}

export function getTextExpandRect(element) {
    if (element.autoAdaptive === 0) {
        return {
            left: 0,
            top: 0,
            width: round(element.width),
            height: round(element.height),
        };
    }

    const rect = _getTextBBoxRect(element);
    const expand = calculateExpand(element);
    const contents = element.contents || [element];
    const safeThreshold = max(...contents.map((item) => item.fontSize || element.fontSize)) / 2;

    return {
        width: round(rect.width + expand.left + expand.right + safeThreshold),
        height: round(rect.height + expand.top + expand.bottom + safeThreshold),
        left: round(rect.left - expand.left - safeThreshold / 2),
        top: round(rect.top - expand.top - safeThreshold / 2),
    };
}

export function getElementExpandRect(element) {
    switch (element.type) {
        // layout
        case undefined:
            return getGroupExpandRect(element);
        case 'group':
            return getGroupExpandRect(element);
        case 'flex':
            return getGroupExpandRect(element);
        case 'image':
            return getImageExpandRect(element);
        case 'mask':
            return getImageExpandRect(element);
        case 'text':
            return getTextExpandRect(element);
    }

    if (element.imageUrl && element.effectedResult) {
        return element.effectedResult;
    }

    return {
        left: 0,
        top: 0,
        width: element.width,
        height: element.height,
    };
}
