export interface ISwatches {
    /**
     * 预设标题
     */
    title: string;
    /**
     * 颜色值list
     */
    list?: Array<String>;
    /**
     * 子list
     */
    swatches?: Array<ISwatches>;
}
