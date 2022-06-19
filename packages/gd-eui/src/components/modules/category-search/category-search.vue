<template>
    <div class="ge-category-search">
        <composition-search :leftCanFill="false">
            <template slot="leftPopoverContent" v-if="options">
                <category-tag @select="handleSelect" :options="options" />
            </template>
            <template slot="rightInputSlot">
                <div class="ge-tree-search__input">
                    <popover-input
                        @setSearchValue="setSearchValue"
                        @clearHistoryWord="handleClear"
                        :visible="visibleWordPopover"
                        :hotWordList="hotWordList"
                        popupContainerClass=".ge-composition-search"
                        :historySearchList="historySearchList"
                    >
                        <g-input
                            slot="inputSlot"
                            ref="inputEl"
                            v-model="inputValue"
                            @blur="handleBlur"
                            @pressEnter="handlePressEnter"
                            allowClear
                            @change="handleInputChange"
                        >
                            <ge-icon slot="prefix" type="search" />
                        </g-input>
                    </popover-input>
                </div>
            </template>
        </composition-search>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, PropType } from '@vue/composition-api';
import { Nullable } from '../../../types/common';
import PopoverInput from '../popover-input';
import CompositionSearch from '../composition-search';
import CategoryTag from '../category-tag';
import { ICategoryTagItem } from '../../../types/category-tag';
import Input from '@gaoding/gd-antd/es/input';

/**
 * @title 组件名
 * GeCategorySearch
 */
/**
 * @title 描述
 * 组合搜索分类标签+普通输入框
 */
/**
 * @title 使用场景
 * 当需要分类标签和输入框时的特定场景
 */
export default defineComponent({
    name: 'GeCategorySearch',
    components: {
        PopoverInput,
        CompositionSearch,
        CategoryTag,
        GInput: Input,
    },
    props: {
        /**
         * 分类标签数据源
         */
        options: {
            type: Array as PropType<ICategoryTagItem[]>,
            default: () => [],
        },
        // 是否展示搜索词弹层
        visibleWordPopover: {
            type: Boolean,
            default: false,
        },
        // 显示搜索词弹层后的热词数据
        hotWordList: {
            type: Array as PropType<String[]>,
            default: () => [],
        },
    },
    emits: [
        /**
         * 输入值发生变化的时候回调
         * @param {string} value 输入值
         */
        'inputChange',
        /**
         * 输入框失焦 的时候回调
         * @param {string} value 输入值
         */
        'inputBlur',
    ],
    setup(prop, { emit }) {
        const inputValue = ref('');
        const historySearchList = ref<Array<string>>([]);

        const useInput = () => {
            const inputEl = shallowRef<Nullable<HTMLElement>>(null);
            function handlePressEnter(e: Event & { target: HTMLInputElement }) {
                if (!historySearchList.value.includes(e.target.value)) {
                    historySearchList.value.push(e.target.value);
                }
                inputEl.value && inputEl.value.blur();
            }
            function handleBlur(e: Event & { target: HTMLInputElement }) {
                // 输入框失焦
                // @arg (value: string);
                emit('inputBlur', e.target.value);
            }
            return {
                handlePressEnter,
                handleBlur,
                inputEl,
            };
        };
        const useSearchPopOverlay = () => {
            function handleClear() {
                historySearchList.value = [];
            }
            function setSearchValue(val: string) {
                inputValue.value = val;
                // 输入值发生变化
                // @arg (value: string)
                emit('inputChange', val);
            }

            return {
                handleClear,
                setSearchValue,
            };
        };

        function handleInputChange(e: Event & { target: HTMLInputElement }) {
            // 输入框输入值发生变化
            // @arg (value: string);
            emit('inputChange', e.target.value);
        }
        function handleSelect(value: string, category: ICategoryTagItem) {
            const { setSearchValue } = useSearchPopOverlay();
            setSearchValue(category.label!);
        }
        return {
            ...useInput(),
            ...useSearchPopOverlay(),
            handleInputChange,
            historySearchList,
            handleSelect,
            inputValue,
        };
    },
});
</script>

<style></style>
