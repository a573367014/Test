<template>
    <div class="ge-toggle-tabs-bar__tabs" ref="tabsRef">
        <div
            class="ge-toggle-tabs-bar__tabs__tab"
            v-for="(item, index) in tabs"
            :key="item.value"
            @click="handleTabClick(index, item)"
            :style="{ width: itemWidth + 'px' }"
        >
            {{ item.label }}
        </div>

        <div v-show="activeTab" class="ge-toggle-tabs-bar__tabs__active" :style="activeStyle">
            {{ activeTab ? activeTab.label : '' }}
            <DropDown v-show="tabDropdownList" placement="bottomRight">
                <ge-icon
                    :class="'ge-toggle-tabs-bar__tabs__active-icon'"
                    type="chevron_down"
                    @click="onArrowDownClick"
                />

                <Menu
                    v-if="showDropdownList"
                    slot="overlay"
                    :style="{
                        width: 104 + 'px',
                    }"
                >
                    <MenuItem
                        v-for="(item, itemIndex) in tabDropdownList"
                        :key="tabDropdownItemValue(item)"
                        :class="{
                            'ge-toggle-tabs-bar__menu-item--selected':
                                tabDropdownItemValue(item) === activeTab.tabDropdownValue,
                        }"
                        @click="onTabDropdownItemClick(item, itemIndex)"
                    >
                        {{ item }}
                    </MenuItem>
                </Menu>
            </DropDown>
        </div>
    </div>
</template>
<script lang="ts">
import {
    computed,
    defineComponent,
    onMounted,
    PropType,
    ref,
    nextTick,
} from '@vue/composition-api';
import { IToggleTab, TabDropdownItem } from '../../../types';
import DropDown from '@gaoding/gd-antd/es/dropdown';
import Menu from '@gaoding/gd-antd/es/menu';
import MenuItem from '@gaoding/gd-antd/es/menu/MenuItem';

/**
 * @title 组件名
 * GeToggleTabsBar
 */
/**
 * @title 描述
 * 稿定主流样式的tab切换栏
 */
/**
 * @title 使用场景
 * - 多个tab切换
 */
export default defineComponent({
    name: 'GeToggleTabsBar',
    components: {
        DropDown,
        Menu,
        MenuItem,
    },
    props: {
        /**
         * tab切换数据
         */
        tabs: {
            type: Array as PropType<IToggleTab[]>,
            default: () => [],
        },
        /**
         * 当前的value，指向某个tab
         */
        value: {
            type: [String, Object] as PropType<String | null>,
            default: '',
        },
    },
    emits: [
        /**
         * @param {IToggleTab} item 改变后的值
         * @param {number} index 改变后的index
         */
        'change',
        /**
         * 当tab下拉列表中选中的值改变的时候回调
         * @param {TabDropdownItem} item 选中的下拉列表中的item
         * @param {number} tabIndex tab的索引位置
         * @param {number} itemIndex 下来列表item的索引位置
         */
        'changeTabDropdownValue',
    ],
    setup(props, { emit }) {
        const tabsRef = ref();
        const barWidth = ref(0);
        const showDropdownList = ref(false);
        const itemWidth = computed(() => {
            return barWidth.value / props.tabs.length;
        });
        const activeTab = computed(() => {
            return props.tabs.find((item) => {
                return item.value === props.value;
            });
        });
        const tabDropdownList = computed(() => {
            return activeTab.value?.tabDropdownList ? activeTab.value?.tabDropdownList : null;
        });
        const activeTabIndex = computed(() => {
            return props.tabs.findIndex((item) => {
                return item.value === props.value;
            });
        });
        const tabDropdownItemValue = (item: TabDropdownItem | string) => {
            if (typeof item === 'string') {
                return item;
            }
            return item.value || item.label;
        };
        const handleTabClick = (index: number, item: IToggleTab) => {
            if (item.value === props.value) {
                return;
            }
            emit('change', item, index);
        };
        const activeStyle = computed(() => {
            const index = props.tabs.findIndex((item) => {
                return item.value === props.value;
            });

            return {
                left: index * itemWidth.value + 'px',
                width: itemWidth.value + 'px',
            };
        });
        onMounted(() => {
            nextTick(() => {
                barWidth.value = tabsRef.value.getBoundingClientRect().width;
            });
        });
        const onTabDropdownItemClick = (item: TabDropdownItem | string, itemIndex: number) => {
            emit('changeTabDropdownValue', item, activeTabIndex.value, itemIndex);
            showDropdownList.value = false;
        };
        const onArrowDownClick = () => {
            showDropdownList.value = true;
        };
        return {
            tabDropdownList,
            showDropdownList,
            tabsRef,
            activeTab,
            itemWidth,
            handleTabClick,
            activeStyle,
            tabDropdownItemValue,
            onTabDropdownItemClick,
            onArrowDownClick,
        };
    },
});
</script>
