export type ColorType = 'color' | 'gradient' | 'map';

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

export interface MapContent {
    repeat: 'no-repeat' | 'repeat';

    scale: number;

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

    /**
     * 填充类型
     */
    type: 'fill' | 'fit' | 'crop' | 'tiled';
}

export type ColorChangeEvent =
    | { type: 'color'; data: string }
    | { type: 'gradient'; data: GradientFilling }
    | { type: 'map'; data: MapContent };
