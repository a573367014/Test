import { IElement } from '../../editor-common/types';

interface ITimeRange {
    delay: number;
    duration: number;
}

/**
 * 获取元素的时间信息
 * @param { element } element - 元素 或 layout
 * @returns { { delay: number, duration: number }}
 */
export declare function getTimeRange(element): ITimeRange;

/**
 * 设置元素的时间信息
 * @param delay
 * @param duration
 * @param element 元素或者元素模型数据
 */
export declare function setTimeRange(
    delay: number,
    duration: number,
    element: IElement | Record<string, any>,
): void;
