import { getCacheBBoxData, getBBox2 } from '@gaoding/shadow';
import { isTextElement } from '../../element';
import { newDrawImageToCanvas } from '../../canvas';
import {
    calculateEffectExpand,
    getExpandByExpands,
    calculateShadowExpand,
    getTextExpandRect,
    getGroupExpandRect,
} from '../utils/expand';
import { IImageElement } from '../../types/image';
import { ITextElement } from '../../types/text';
import { IElement } from '../../types/element';
import { loadImage } from '../../loader';

export * from '../utils/expand';

/**
 * 计算图片投影引起的扩展
 * @param element
 * @param cacheKey 缓存使用的 key，优化拟真投影计算速度
 */
export async function calculateImageShadowExpand(
    element: IImageElement,
    cacheKey = String(Date.now()),
) {
    const img = await loadImage(element.url);
    const canvas = document.createElement('canvas');
    canvas.width = element.width;
    canvas.height = element.height;

    newDrawImageToCanvas({
        canvas,
        image: img,
        width: element.width,
        height: element.height,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        imageTransformArray: (element.imageTransform as any).toArray(),
        blendMode: 'source-over',
        mask: null,
    });
    const { bbox, points } = getCacheBBoxData(canvas, cacheKey);
    const baseBBox2 = getBBox2(bbox, element.shadows || [], points);

    return {
        left: -baseBBox2.xMin,
        top: -baseBBox2.yMin,
        right: baseBBox2.xMax - element.width,
        bottom: baseBBox2.yMax - element.height,
    };
}

export function calculateExpand(element: IImageElement | ITextElement, cacheKey?: string) {
    const effectExpand = calculateEffectExpand(element);

    // 文字同步获取
    if (isTextElement(element)) {
        const shadowExpand = calculateShadowExpand(element);
        return getExpandByExpands([effectExpand, shadowExpand]);
    }
    // 图片异步
    return calculateImageShadowExpand(element, cacheKey).then((shadowExpand) => {
        return getExpandByExpands([effectExpand, shadowExpand]);
    });
}

export async function getImageExpandRect(element: IImageElement, cacheKey?: string) {
    const expand = await calculateExpand(element, cacheKey);

    return {
        left: -expand.left,
        top: -expand.top,
        width: element.width + expand.left + expand.right,
        height: element.height + expand.top + expand.bottom,
    };
}

/**
 * 获取元素包围盒数据，当元素是 image、mask 时属于异步，返回 Promise；其他类型都是同步的
 */
export function getElementExpandRect(element: IElement, cacheKey?: string) {
    switch (element.type) {
        case 'text':
            return getTextExpandRect(element as ITextElement);
        case 'image':
        case 'mask':
            return getImageExpandRect(element as IImageElement, cacheKey);
        case 'flex':
        case 'group':
            return getGroupExpandRect(element);
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
