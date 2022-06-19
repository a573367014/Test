export interface ITransition {
    /**
     * 转场类型，当不存在 url 时，使用该字段设置内置转场
     */
    option?: ITransitionOptionType;

    /**
     * 转场素材地址
     */
    url?: string;

    /**
     * 转场相对于元素的开始时间
     */
    delay: number;

    /**
     * 转场持续时间
     */
    duration: number;
}

export type ITransitionOptionType =
    | 'none'
    | 'fade'
    | 'diffusion'
    | 'musselOpen'
    | 'musselClose'
    | 'pushUp'
    | 'pushDown'
    | 'pushLeft'
    | 'pushRight'
    | 'slideUp'
    | 'slideDown'
    | 'slideLeft'
    | 'slideRight'
    | 'sweepUp'
    | 'sweepDown'
    | 'sweepLeft'
    | 'sweepRight'
    | 'zoomIn'
    | 'zoomOut'
    | 'colorBlack'
    | 'colorWhite';

export interface ITransitionInfo {
    type: number;
    inOffset: number;
    inDuration: number;
    outOffset: number;
    outDuration: number;
    elementInDelay: number;
    elementInDuration: number;
    elementOutDelay: number;
    elementOutDuration: number;
    isOverlayer: boolean;
}
