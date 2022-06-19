export interface ISliderItem {
    /**
     * 滑杆功能描述字段
     */
    label?: string;
    /**
     * 唯一标识符
     */
    key: string;
    /**
     * 滑杆当前值
     */
    value: number;
    /**
     * 最大值
     */
    max: number;
    /**
     * 最小值
     */
    min?: number;
    /**
     * 步值，滑动一次的大小
     */
    step?: number;
}
