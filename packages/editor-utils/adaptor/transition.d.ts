import { ITransition, ITransitionOptionType } from '@gaoding/editor-common/types/transition';
import { IElement } from '../../editor-common/types';

/**
 * 获取进场效果
 */
export declare function getTransitionIn(element: IElement): ITransition;
/**
 * 设置进场效果
 */
export declare function setTransitionIn(
    transitionOption: ITransitionOptionType,
    element: IElement,
): void;
/**
 * 获取出场动画
 */
export declare function getTransitionOut(element: IElement): ITransition;
/**
 * 设置出场效果
 */
export declare function setTransitionOut(
    transitionOption: ITransitionOptionType,
    element: IElement,
): void;
