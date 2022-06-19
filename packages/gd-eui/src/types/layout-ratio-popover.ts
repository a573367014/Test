export const GeLayoutRatioPopoverName = 'GeLayoutRatioPopoverName';

export enum LayoutRatioType {
    /**
     * 默认比例
     */
    TypeDefault = 0,
    /**
     * 9:16
     */
    Type9_16 = 1,
    /**
     * 3:4
     */
    Type3_4,
    /**
     * 1:1
     */
    Type1_1,
    /**
     * 4:3
     */
    Type4_3,
    /**
     * 16:9
     */
    Type16_9,
}

/**
 * 类型对应的标题
 */
export const TypeTitleMap = {
    [LayoutRatioType.TypeDefault]: '默认比例',
    [LayoutRatioType.Type9_16]: '9:16',
    [LayoutRatioType.Type3_4]: '3:4',
    [LayoutRatioType.Type1_1]: '1:1',
    [LayoutRatioType.Type4_3]: '4:3',
    [LayoutRatioType.Type16_9]: '16:9',
};
