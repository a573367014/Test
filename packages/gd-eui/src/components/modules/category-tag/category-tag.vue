<template>
    <div class="ge-category-tag">
        <div v-if="title" class="ge-category-tag__title" @click="$emit('clickTitle')">
            {{ title }}
        </div>
        <div class="ge-category-tag__content">
            <div class="ge-category-tag__content__parent">
                <div
                    class="ge-category-tag__content__parent__item"
                    v-for="(item, index) in options"
                    :key="item.value"
                    :class="{ parent_selected: parentIndex === index }"
                    @mouseenter="handleParentMouseEnter(index)"
                >
                    {{ item.label || item.value }}
                </div>
            </div>
            <div class="ge-category-tag__content__children">
                <div
                    v-for="(secItem, secIndex) in childrenItemList(parentIndex)"
                    :key="secItem.value"
                >
                    <div v-if="secItem.children">
                        <div class="ge-category-tag__content__children__title">
                            {{ secItem.title || secItem.value }}
                        </div>
                        <div
                            class="ge-category-tag__content__children__item"
                            v-for="(thirdItem, thirdIndex) in secItem.children"
                            :key="thirdItem.value"
                            :class="{ children_selected: thirdItem.value === selectValue }"
                            @mouseenter="
                                handleChildrenMouseEnter(
                                    [parentIndex, secIndex, thirdIndex],
                                    thirdItem,
                                )
                            "
                            @click="
                                handleChildClick([parentIndex, secIndex, thirdIndex], thirdItem)
                            "
                        >
                            {{ thirdItem.label || thirdItem.value }}
                        </div>
                    </div>
                    <div
                        v-else
                        class="ge-category-tag__content__children__item"
                        :class="{ children_selected: secItem.value === selectValue }"
                        @mouseenter="handleChildrenMouseEnter([parentIndex, secIndex], secItem)"
                        @click="handleChildClick([parentIndex, secIndex], secItem)"
                    >
                        {{ secItem.label || secItem.value }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, Ref } from '@vue/composition-api';
import { CHANGE_EVENT, SELECT_EVENT } from '../../../utils/constants';
import { ICategoryTagItem } from '../../../types/category-tag';

/**
 * @title 组件名
 * GeCategoryTag
 */
/**
 * @title 描述
 * 分类选择器
 */
/**
 * @title 使用场景
 * @dot 类型分层选择
 * @dot 支持 2 级、3 级类型分类
 */
export default defineComponent({
    name: 'GeCategoryTag',
    props: {
        // panel 标题
        title: {
            type: String,
            default: null,
        },
        // 选中 item 字体颜色
        activeColor: {
            type: String,
            default: '#2254f4',
        },
        /**
         * 数据源
         */
        options: {
            type: Array as PropType<ICategoryTagItem[]>,
            default: () => [],
        },
    },
    emits: [
        /**
         * 子选项改变时回调
         * @param {number[]} indexs 代表联级索引，从根节点算起
         * @param {CategoryTagItem} item 代表选中的 item
         */
        'change',
        /**
         * 确认选择时回调
         */
        'select',
    ],
    setup(props, { emit }) {
        const parentIndex = ref(0);
        const selectValue: Ref<Number | String> = ref(0);
        const childrenItemList = (index: number) => {
            let list: ICategoryTagItem[] = [];
            if (index < props.options.length) {
                const parent: ICategoryTagItem = props.options[index];
                list = parent.children?.length ? parent.children : [];
            }
            return list;
        };
        const _emit = (customEvent: string, indexs: number[], item: ICategoryTagItem) => {
            emit(customEvent, indexs, item);
        };
        const handleParentMouseEnter = (index: number) => {
            parentIndex.value = index;
            const list = childrenItemList(index);
            if (!list.length) {
                return;
            }
            for (let index = 0; index < list.length; index++) {
                const item = list[index];
                // 没有子节点
                if (!item.children) {
                    selectValue.value = item.value;
                    _emit(CHANGE_EVENT, [parentIndex.value, index], item);
                    return;
                }
                // 有子节点，但子节点儿子为0
                if (item.children && item.children.length === 0) {
                    continue;
                }
                selectValue.value = item.children[0].value;
                _emit(CHANGE_EVENT, [parentIndex.value, index, 0], item);
                return;
            }
        };
        const handleChildrenMouseEnter = (indexs: number[], item: ICategoryTagItem) => {
            selectValue.value = item.value;
            _emit(CHANGE_EVENT, indexs, item);
        };
        const handleChildClick = (indexs: number[], item: ICategoryTagItem) => {
            selectValue.value = item.value;
            _emit(SELECT_EVENT, indexs, item);
        };

        return {
            parentIndex,
            selectValue,
            childrenItemList,
            handleParentMouseEnter,
            handleChildrenMouseEnter,
            handleChildClick,
        };
    },
});
</script>
