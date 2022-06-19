import { ITransitionOptionType, ITransitionInfo } from '@gaoding/editor-common/types/transition';

/**
 * 判断转场是否为叠加型转场
 */
export declare function isOverlayerTransition(transitionType: number | string): boolean;
/**
 * 如果传入的底层转场类型是旧数据，则转换为新数据
 */
export declare function fixOldTransitionType(transitionType: number | string): number | string;
/**
 * 将底层转场类型转为上层数据
 * @param { number } transitionType;
 */
export declare function transitionTypeToOption(
    transitionType: number | string,
): ITransitionOptionType;
/**
 * 将上层转场数据转为底层数据
 */
export declare function transitionOptionToType(transitionOption: ITransitionOptionType): number;
/**
 * 根据转场类型获取转场需要的配置
 */
export declare function getTransition(transitionOption?: ITransitionOptionType): ITransitionInfo;
