<template>
    <div class="ge-tree-search">
        <composition-search :leftValue="leftValue">
            <template slot="leftPopoverContent">
                <g-tree
                    @click.stop
                    :tree-data="treeData"
                    @select="handleSelect"
                    @expand="handleTreeExpand"
                    :replaceFields="replaceFields"
                ></g-tree>
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
import { defineComponent, ref, shallowRef } from '@vue/composition-api';
import { Nullable } from '../../../types/common';
import PopoverInput from '../popover-input';
import CompositionSearch from '../composition-search';
import Tree from '@gaoding/gd-antd/es/tree';
import Input from '@gaoding/gd-antd/es/input';

/**
 * @title 组件名
 * GeTreeSearch
 */
/**
 * @title 描述
 * 组合搜索树形下拉框+普通输入框
 */
/**
 * @title 使用场景
 * 当搜索场景是需要树形选择，和输入框时的特定场景
 */
export default defineComponent({
    name: 'GeTreeSearch',
    components: {
        PopoverInput,
        CompositionSearch,
        GTree: Tree,
        GInput: Input,
    },
    props: {
        // 替换 treeNode 中 title,value,key,children 字段为 treeData 中对应的字段
        replaceFields: {
            type: Object,
            default: () => {
                return { children: 'children', title: 'title', key: 'key', value: 'value' };
            },
        },
        // 树形选择器数据,格式参考replaceFields的默认值
        treeData: {
            type: Array,
            default: () => [],
        },
        // 树形选择器无值时候的占位字符
        placeholder: {
            type: String,
            default: '选择分类标签',
        },
        // 是否展示搜索词弹层
        visibleWordPopover: {
            type: Boolean,
            default: false,
        },
        // 显示搜索词弹层后的热词数据
        hotWordList: {
            type: Array,
            default: () => [],
        },
    },
    emits: [
        /**
         * 输入框输入值发生变化
         * @param {string} value
         */
        'inputChange',
        /**
         * 输入框失焦
         * @param {string} value
         */
        'inputBlur',
        /**
         * 树形选择框选中事件
         * @param {string} value
         */
        'treeSelect',
        /**
         * 展开节点时调用
         * @param {String[]} expandedKeys
         */
        'treeExpand',
    ],
    setup(prop, { emit }) {
        const inputValue = ref('');
        const historySearchList = ref<Array<string>>([]);
        const leftValue = ref('');

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
            function handleIconClick() {
                inputEl.value && inputEl.value.focus();
            }
            return {
                handlePressEnter,
                handleBlur,
                inputEl,
                handleIconClick,
            };
        };
        const useSearchPopOverlay = () => {
            function handleClear() {
                historySearchList.value = [];
            }
            function setSearchValue(val: string) {
                inputValue.value = val;
                emit('inputChange', val);
            }

            return {
                handleClear,
                setSearchValue,
            };
        };

        function handleSelect(value: Array<string>) {
            leftValue.value = value[0];
            // 树形选择框选中事件
            // @arg (value: string)
            emit('treeSelect', value[0]);
        }
        function handleTreeExpand(expandedKeys: Array<String>) {
            // 展开节点时调用
            // @arg `(expandedKeys: Array<String>)`
            emit('treeExpand', expandedKeys);
        }
        function handleInputChange(e: Event & { target: HTMLInputElement }) {
            // 输入框输入值发生变化
            // @arg (value:string);
            emit('inputChange', e.target.value);
        }

        return {
            ...useInput(),
            ...useSearchPopOverlay(),
            handleSelect,
            handleTreeExpand,
            handleInputChange,
            historySearchList,
            inputValue,
            leftValue,
        };
    },
});
</script>

<style></style>
