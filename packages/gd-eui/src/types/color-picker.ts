/**
 * 单色
 */
export interface IColor {
    /**
     * hvsa中的h，范围0 ~ 360
     */
    h: number;
    /**
     * hvsa中的v，范围 0 ~ 1
     */
    v: number;
    /**
     * hvsa中的s，范围 0 ~ 1
     */
    s: number;
    /**
     * hvsa中的a，范围 0 ~ 1
     */
    a: number;
    /**
     * 格式，当前只支持hvsa
     */
    format: string;
}

export interface IColorOffset {
    color: String;
    offset: number;
}

export enum Direction {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
}

/**
 * 渐变色
 */
export interface IGradientColor {
    /**
     * 颜色
     * string，支持hex，rgba 等css表现形式
     */
    color: IColor | string;
    /**
     * 所在位置偏移比例
     */
    offset: number; // 0 ~ 1
}

/**
 * 颜色类型
 */
export enum ColorPickerType {
    /**
     * 纯色类型
     */
    SINGLE = 0,
    /**
     * 渐变色类型
     */
    GRADIENT,
    /**
     * 图案类型
     */
    MAP,
}

export interface IColorPickerComponent {
    show(types: ColorPickerType[], showType: ColorPickerType): void;
    getColor(): IColor;
    getGradientColor(): ColorPickerType[];
    getDegree(): number;
    useColor(color: IColor): void;
    useDegree(deg: number): void;
    useGradient(gl: Array<IGradientColor>): void;
}
