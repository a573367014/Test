<template>
    <div class="ge-aside-item">
        <div class="ge-aside-item__title">
            <!-- 头部主内容 -->
            <slot name="head">
                <div class="ge-aside-item__title__default">
                    <span class="prefix">{{ label }}</span>
                    <span class="suffix" @click="handleSuffixLabelClick">{{ suffixLabel }}</span>
                </div>
            </slot>
        </div>
        <div class="ge-aside-item__main">
            <!-- 主内容 -->
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

/**
 * @title 组件名
 * GeAsideItem
 */
/**
 * @title 描述
 * 侧边栏通用列表 item
 */
/**
 * @title 使用场景
 * 用于侧边栏通用列表 item
 */
export default defineComponent({
    name: 'GeAsideItem',
    props: {
        // 前缀文案
        label: {
            type: String,
            default: '',
        },
        // 后缀文案
        suffixLabel: {
            type: String,
            default: '查看全部',
        },
    },
    emits: [
        /**
         * 后缀点击时回调
         */
        'suffixLabelClick',
    ],
    setup(props, { emit }) {
        function handleSuffixLabelClick() {
            emit('suffixLabelClick');
        }
        return {
            handleSuffixLabelClick,
        };
    },
});
</script>
