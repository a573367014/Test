<template>
    <div
        :class="{
            'ge-tag-select': true,
            'ge-tag-select--expand': isExpand,
        }"
        ref="GeTagSelect"
    >
        <button
            :class="{
                'ge-tag-select__tag': true,
                'ge-tag-select__tag--active': item.key === active,
                'ge-tag-select__tag--disabled': !!item.disabled,
            }"
            v-for="item in renderTags"
            :key="item.key"
            @click="onTagClick(item)"
            :title="item.text"
        >
            {{ item.text }}
        </button>
        <slot
            name="handler"
            :onHandlerClick="onExpand"
            :showExpand="showExpand"
            :isExpand="isExpand"
            v-if="showExpand"
        >
            <button class="ge-tag-select__tag ge-tag-select__tag__handler" @click="onExpand">
                <span>{{ isExpand ? SHRINK_TEXT : EXPAND_TEXT }}</span>
                <ge-icon class="ge-tag-select__tag__handler__icon" type="BigChevronDown" />
            </button>
        </slot>
    </div>
</template>

<script lang="ts">
/**
 * @title 组件名
 * GeTagSelect
 */
/**
 * @title 描述
 * 标签选择器
 */
/**
 * @title 使用场景
 * @markdown
 * - 标签选择
 * - 标签选择切换（激发态）
 */

import type { ITags, ITagItem, ITagDisabled } from '../../../types';
import { PropType, defineComponent, computed, ref, watchEffect } from '@vue/composition-api';

const EXPAND_TEXT = '展开';
const SHRINK_TEXT = '收起';

export default defineComponent({
    name: 'GeTagSelect',
    props: {
        /**
         * 标签数组数据 list
         * 数组项需要带有 text 值
         * @markdown
         */
        tags: {
            type: Array as PropType<ITags | string[]>,
            default: () => [],
        },
        // 初始展示标签数量
        initTagNum: {
            type: Number,
            default: 5,
        },
        // 标签禁用
        tagDisabled: {
            type: Function as PropType<ITagDisabled>,
            default: () => false,
        },
        // 初始展开状态
        defaultExpand: {
            type: Boolean,
            default: false,
        },
        // 当前选中标签 Vue2 v-model
        value: {
            type: [String, Number],
            default: '',
        },
        // 当前选中标签 Vue3 v-model
        modelValue: {
            type: [String, Number],
            default: '',
        },
    },
    emits: ['onTagClick', 'update:modelValue', 'input'],
    setup(props, { emit }) {
        const isExpand = ref(props.defaultExpand);

        const active = ref(props.value);

        const showExpand = computed(() => props.tags.length > props.initTagNum + 1);

        const renderTags = computed(() => {
            const innerTags = props.tags.map((tag: ITagItem | string, index: number) => {
                const innerTag = typeof tag === 'object' ? tag : { text: String(tag) };
                return {
                    key: innerTag.key || index,
                    text: innerTag.text,
                    disabled: innerTag.disabled || !!props.tagDisabled?.(innerTag),
                    metaData: innerTag,
                };
            });
            if (showExpand.value) {
                return isExpand.value ? innerTags : innerTags.slice(0, props.initTagNum);
            } else return innerTags;
        });

        watchEffect(() => {
            active.value = props.value;
        });

        const onExpand = () => {
            isExpand.value = !isExpand.value;
        };

        const onTagClick = (tag: ITagItem, e?: Event) => {
            emit('onTagClick', tag, e);
            if (tag.key !== props.value) {
                // if (isVue2) {
                //     emit('input', tag.key);
                // } else {
                //     emit('update:modelValue', tag.key);
                // }
                emit('input', tag.key);
            }
        };

        return {
            active,
            isExpand,
            showExpand,
            renderTags,
            onTagClick,
            onExpand,
            EXPAND_TEXT,
            SHRINK_TEXT,
        };
    },
});
</script>
