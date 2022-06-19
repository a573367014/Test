/**
 * 关键点，用来不透明度渐变控制等
 */
export interface IKeyPoint {
    /**
     * 关键点位置, 范围 0~1
     */
    offset: number;

    /**
     * 关键点值, 范围 0~1
     */
    value: number;
}

export interface IAdvancedBlur {
    /**
     * 模糊度：[模糊度-始，模糊度-终]
     */
    blurs: [IKeyPoint, IKeyPoint];

    /**
     * 不透明度：[不透明度-始，不透明度-终]
     */
    opacities: [IKeyPoint, IKeyPoint];
}

export interface IAdvancedShadow {
    /**
     * 是否开启此阴影
     */
    enable: boolean;

    /**
     * 投影类型
     */
    type: string;

    /**
     * 蒙板 url，目前因为交互方案比较复杂，没有做相关交互，但保留了相关功能，目前不用此字段
     */
    mask?: string;

    /**
     * 阴影横向偏移
     */
    offsetX: number;

    /**
     * 阴影纵向偏移
     */
    offsetY: number;

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
    advancedBlur: IAdvancedBlur;
}
