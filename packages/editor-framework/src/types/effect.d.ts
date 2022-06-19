/**
 * 渐变 stop 单位
 */
export interface GradientStop {
    /**
     * 颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     **/
    color: string;

    /**
     * 偏移位置 [0-1]
     * @description [[number]]
     **/
    offset: number;
}

/**
 * 渐变填充配置
 */
export interface GradientFilling {
    /**
     * 渐变类型，暂时只支持 linear
     **/
    type: 'linear';

    /**
     * 渐变角度
     * @description [[number]]
     **/
    angle: number;

    /**
     * 渐变内容
     **/
    stops: GradientStop[];
}

/**
 * 图像填充配置
 */
export interface ImageContent {
    /**
     * 填充图案平铺方式，文字特效中的 repeat 是数值类型
     * 后续应迁移到 [[`EffectFillingImageContent.tileMode`]]
     */
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' | 0 | 1 | 2 | 3;

    /**
     * 填充图案平铺方式
     */
    tileMode: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

    /**
     * x 轴缩放比例, [0,1] 对应 0%~100% 范围
     * @description [[number]]
     */
    scaleX: number;

    /**
     * y 轴缩放比例, [0,1]  对应 0%~100% 范围
     * @description [[number]]
     */
    scaleY: number;

    /**
     *  图片像素尺寸
     * @description [[number]]
     */
    width: number;

    /**
     * 图片像素尺寸
     * @description [[number]]
     */
    height: number;

    /**
     * 填充图案 URL
     */
    image: string;
}

/**
 * 填充特效
 */
export interface EffectFilling {
    /**
     * 是否开启填充特效
     **/
    enable: boolean;

    /**
     * 填充方式
     * 在文字元素中，type 可能为 number，需要进行兼容
     * - `'color'` 颜色填充
     * - `'image'` 图片填充
     * - `'gradient'` 渐变填充
     * - `0` 颜色填充
     * - `1` 图片填充
     * - `2` 渐变填充
     * 后续将迁移到 [[`EffectFilling.style`]] 中
     */
    type: 'color' | 'image' | 'gradient' | 0 | 1 | 2;

    /**
     * 填充方式
     * 在文字元素中，type 可能为 number，需要进行兼容
     * * color: 颜色填充
     * * image: 图片填充
     * * gradient: 渐变填充
     */
    style?: 'color' | 'image' | 'gradient';

    /**
     * 纯色填充时的填充颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     */
    color?: string;

    /**
     * 填充图案配置
     */
    imageContent?: ImageContent | null;

    /**
     * 渐变填充
     */
    gradient?: GradientFilling;
}

interface KeyPoint {
    offset: number;
    value: number;
}

export interface AdvancedBlur {
    blurs: [KeyPoint, KeyPoint];
    opacities: [KeyPoint, KeyPoint];
}

/**
 * 偏移特效
 */
export interface EffectOffset {
    /**
     * 特效开关
     **/
    enable: boolean;

    /**
     * 横向偏移
     * @description [[number]]
     **/
    x: number;

    /**
     * 纵向偏移
     * @description [[number]]
     **/
    y: number;
}

/**
 * 阴影特效
 */
export interface EffectShadow {
    /**
     * 特效开关
     **/
    enable: boolean;

    /**
     * 阴影类型
     * * shadow: 阴影
     * * glow: 外发光
     * @default 'shadow''
     **/
    type: 'base';

    /**
     * 阴影颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     **/
    color: string;

    /**
     * 阴影横向偏移，当偏移量为（0，0）时，则显示出来的就是外发光的效果
     * @default 0
     * @description [[number]]
     **/
    offsetX: number;

    /**
     * 阴影纵向偏移，当偏移量为（0，0）时，则显示出来的就是外发光的效果
     * @default 0
     * @description [[number]]
     **/
    offsetY: number;

    /**
     * 模糊半径（>=0）
     * @description [[number]]
     **/
    blur: number;

    /**
     * @deprecated
     * 是否启用内阴影
     */
    inset?: boolean;

    /**
     * 不透明度
     */
    opacity: number;

    /**
     * 模糊类型
     */
    blurType: 'base' | 'advanced';

    /**
     * 高级模糊设置
     */
    advancedBlur: null | AdvancedBlur;
}

/**
 * 倾斜投影
 */
export interface SkewShadow extends EffectShadow {
    /**
     * X轴缩放，用来调节阴影宽度
     */
    scaleX: number;
    /**
     * Y轴缩放，用来调节阴影长度
     */
    scaleY: number;
}

/**
 * 接触投影
 */
export interface ContactShadow extends EffectShadow {
    /**
     * 扇形模糊的主方向，默认朝下，也就是 90 度
     */
    angle: number;
    /**
     * 接触范围
     */
    range: number;
    /**
     * 投影溶度
     */
    density: number;
}

/**
 * 倒影
 */
export interface ReflectShadow extends EffectShadow {
    /**
     * 倒影方向
     */
    direction: 'left' | 'right' | 'bottom' | 'auto';
}

/**
 * 描边特效
 * @category Demo
 */
export interface EffectStroke {
    /**
     * 特效开关
     **/
    enable: boolean;

    /**
     * 描边类型, 图片暂时只支持外描边
     * * inner: 内描边
     * * center: 居中描边
     * * outer: 外描边
     * @default 'center'
     **/
    type: 'inner' | 'center' | 'outer';

    /**
     * 描边颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     **/
    color: string;

    /**
     * 描边宽度
     * @description [[number]]
     **/
    width: number;

    /**
     * 描边连接处样式
     **/
    join: 'miter' | 'round' | 'bevel';
}

/**
 * 元素特效，目前仅对 [[`ImageElement`]] / [[`MaskElement`]] / [[`TextElement`]] 生效
 */
export interface Effect {
    /**
     * 是否启用
     */
    enable: boolean;

    /**
     * 参数调节时忽略的字段名
     */
    excludeScale?: ('stroke' | 'shadow' | 'filling')[];

    /**
     * 偏移
     */
    offset: EffectOffset | null;

    /**
     * 描边
     */
    stroke: EffectStroke | null;

    /**
     * 填充
     */
    filling: EffectFilling | null;

    /**
     * 蒙版，仅对 [[`ImageElement`]] / [[`MaskElement`]] 生效
     */
    mask?: EffectMask | null;

    /**
     * 扩边，仅对 [[`ImageElement`]] / [[`MaskElement`]] 生效
     */
    expand?: EffectExpand | null;

    /**
     * 斜切，仅对 [[`TextElement`]] 生效
     */
    skew?: EffectSkew | null;
}
