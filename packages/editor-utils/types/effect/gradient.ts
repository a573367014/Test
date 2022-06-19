/**
 * 渐变内容
 */
export interface IGradientStop {
    /**
     * 颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     */
    color: string;

    /**
     * 偏移位置 [0-1]
     */
    offset: number;
}

/**
 * 渐变填充
 */
export interface IGradient {
    /**
     * 渐变类型，暂时只支持 linear
     */
    type: 'linear';

    /**
     * 渐变角度
     */
    angle: number;

    /**
     * 渐变内容
     */
    stops: IGradientStop[];
}
