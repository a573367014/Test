export const GeToggleTabsBarName = 'GeToggleTabsBar';

export interface TabDropdownItem {
    /**
     * 文案
     */
    label: string;
    /**
     * 唯一值，不填默认与label一致
     */
    value?: string;
}

export interface IToggleTab {
    /**
     * 显示的文案
     */
    label: string;
    /**
     * 对应的值，请保持唯一性
     */
    value: string;
    /**
     * 下拉列表
     */
    tabDropdownList?: Array<TabDropdownItem | string>;
    /**
     * 下拉列表对应的值
     */
    tabDropdownValue?: string;
}
