import { ISliderItem } from './slider-list';

/**
 * 独立item
 */
export interface IStyleSelectItem {
    /**
     * 样式图src
     */
    src: string;
    /**
     * 唯一id 默认使用index索引
     */
    id?: string;
    /**
     * 属性名称
     */
    title?: string;
    /**
     * 右下角标图url
     */
    bottomRightUrl?: string;
    /**
     * 是否展示版权
     */
    showCopyRight?: boolean;
    /**
     * 选中
     */
    checked?: boolean;
    /**
     * 属性强度值
     */
    styleSliderList?: ISliderItem[];
}

/**
 * 分段列表item
 */
export interface ISegmentItem {
    /**
     * 副标题
     */
    title: string;
    /**
     * 唯一的key 默认使用index索引
     */
    key?: string;
    /**
     * 分段内的列表
     */
    segment?: IStyleSelectItem[];
}
