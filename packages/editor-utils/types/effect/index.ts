import { IBaseShadow } from '../shadow/base-shadow';
import { IEffectExpand } from './effect-expand';
import { IEffectFilling } from './effect-filling';
import { IEffectMask } from './effect-mask';
import { IEffectOffset } from './effect-offset';
import { IEffectSkew } from './effect-skew';
import { IEffectStroke } from './effect-stroke';

/**
 * 基础特效
 */
export interface IBaseEffect {
    /**
     * 是否启用
     */
    enable: boolean;

    /**
     * 填充
     */
    filling: IEffectFilling | null;

    /**
     * 描边
     */
    stroke: IEffectStroke | null;

    /**
     * 偏移
     */
    offset: IEffectOffset | null;
}

/**
 * 文字特效
 */
export interface ITextEffect extends IBaseEffect {
    /**
     * 参数调节时忽略的字段名
     */
    excludeScale: ('stroke' | 'shadow' | 'filling')[];

    /**
     * 投影
     * @deprecated 使用 TextElement 下的 shadows
     */
    shadow: IBaseShadow | null;

    /**
     * 斜切
     */
    skew: IEffectSkew | null;
}

/**
 * 图片特效
 */
export interface IImageEffect extends IBaseEffect {
    /**
     * 参数调节时忽略的字段名
     */
    excludeScale: ('stroke' | 'shadow' | 'filling')[];

    /**
     * 投影
     * @deprecated 使用 ImageElement 下的 shadows
     */
    shadow: IBaseShadow | null;

    /**
     * 内阴影
     */
    insetShadow: IBaseShadow | null;

    /**
     * 蒙版
     */
    mask: IEffectMask | null;

    /**
     * 扩边
     */
    expand: IEffectExpand | null;
}

export type IEffect = ITextEffect | IImageEffect;
