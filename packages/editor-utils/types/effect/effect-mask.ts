/**
 * 蒙版特效
 */
export interface IEffectMask {
    /**
     * 特效开关
     */
    enable: boolean;

    /**
     * 蒙版类型
     * - ellipse: 自带图形
     * - rectRounded: 自带图形
     * - rectRoundedTopLeftAndRightBottom: 自带图形
     * - parallelogram: 自带图形
     * - star: 自带图形
     * - diamond: 自带图形
     * - image: 自定义图形，取 [[Mask.image]]
     * - custom: 和图片大小相同的矩形，目前主要用于圆角
     */
    type:
        | 'ellipse'
        | 'rectRounded'
        | 'rectRoundedTopLeftAndRightBottom'
        | 'parallelogram'
        | 'star'
        | 'diamond'
        | 'image'
        | 'custom'
        | 'circle'
        | 'heart';

    /**
     * mask 图片地址
     */
    image: string;

    /**
     * mask 宽度
     */
    width: number;

    /**
     * mask 高度
     */
    height: number;

    /**
     * 圆角，只对 [[Mask.type]] 为 custom 有效
     */
    radius: number;

    /**
     * 填充方式
     */
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

    star: {
        ratio: number;
        number: number;
        angle: number;
        rounded: number;
    };
}
