import { IElement } from './types/element';
import { IGroupElement } from './types/group';
import { IImageElement } from './types/image';
import { IMaskElement } from './types/mask';
import { IMediaElement } from './types/media';
import { ITextElement } from './types/text';
import { IVideoElement } from './types/video';

/**
 * 判断一个元素是否为组元素
 * @param { element } element - 元素
 */
export declare function isGroup(element: IElement): element is IGroupElement;

/**
 * 判断一个元素（或元素数据）是否为动态贴纸元素（元素数据）
 */
export declare function isAnimationImage(element: IElement): boolean;

/**
 * 判断一个元素数据是否为视频资源
 */
export declare function isVideoResource(element: IElement): boolean;

/**
 * 判断一个元素是否为文字元素
 */
export declare function isTextElement(element: IElement): element is ITextElement;

/**
 * 判断一个元素是否含有 gif 资源
 */
export declare function isGifElement(element: IElement): element is IImageElement;

/**
 * 判断一个元素是否含有 apng 资源
 */
export declare function isApngElement(element: IElement): element is IImageElement;

/**
 * 判断是否为纯文字组
 */
export declare function isPureTextGroup(element: IElement): element is ITextElement;

export declare function isDynamicElement(
    element: IElement,
): element is IImageElement | IVideoElement;

/**
 * 是否是媒体元素(有 startTime, endTime 的元素)
 */
export declare function isMediaElement(element: IElement): element is IMediaElement;

/**
 * 是否是字幕元素
 */
export declare function isAutoSubtitle(element: IElement): element is ITextElement;

/**
 * 是否是有范围限制的元素
 */
export declare function isRangeElement(element: IElement): element is ITextElement | IMediaElement;

/**
 * 判断是否为占位元素
 */
export declare function isPlaceholderElement(element: IElement): boolean;

/**
 * 清理元素
 */
export declare function clearElement<T>(elements: T): T;

/**
 * 判断是否支持特效的元素
 */
export function isSupportEffectElement(
    element: IElement,
): element is ITextElement | IImageElement | IMaskElement;

/**
 * 判断是否是蒙版元素
 */
export function isMaskElement(element: IElement): element is IMaskElement;
