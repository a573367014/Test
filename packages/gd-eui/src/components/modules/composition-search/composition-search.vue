<template>
    <div class="ge-composition-search">
        <g-popover
            placement="bottom"
            :autoAdjustOverflow="false"
            overlayClassName="ge-composition-search__popover"
            trigger="click"
            :getPopupContainer="getPopupContainer"
        >
            <template slot="content">
                <!-- 左侧内容弹层插槽 -->
                <slot name="leftPopoverContent"></slot>
            </template>
            <div
                @click="leftFill = true"
                :class="[
                    'ge-composition-search__left',
                    { 'ge-composition-search__left--fill': leftFill && leftCanFill },
                ]"
            >
                <ge-icon type="menu" class="ge-composition-search__left--menu" />
                <span v-if="leftFill && leftCanFill" class="ge-composition-search__left--content">
                    {{ _leftValue }}
                </span>
                <ge-icon
                    v-if="leftFill && leftCanFill"
                    type="chevron_down"
                    class="ge-composition-search__left--down"
                />
            </div>
        </g-popover>
        <div
            @click="leftFill = false"
            :class="[
                'ge-composition-search__right',
                { 'ge-composition-search__right--blur': leftFill && leftCanFill },
            ]"
        >
            <!-- 右侧自定义输入框插槽基于antd input -->
            <slot name="rightInputSlot"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import Popover from '@gaoding/gd-antd/es/popover';

/**
 * @title 组件名
 * GeCompositionSearch
 */
/**
 * @title 描述
 * 目前编辑组合搜索都是左边一个类似下拉框+右侧输入框的形式
 */
/**
 * @title 使用场景
 * 当需要拓展自己当组合搜索框时
 */
export default defineComponent({
    name: 'GeCompositionSearch',
    components: {
        GPopover: Popover,
    },
    props: {
        // 左侧框占位符
        leftPlaceholder: {
            type: String,
            default: '选择分类标签',
        },
        // 左侧值
        leftValue: {
            type: String,
            default: '',
        },
        // 左侧框是否可以向右填满
        leftCanFill: {
            type: Boolean,
            default: true,
        },
    },
    setup(props) {
        const leftFill = ref(true);
        const _leftValue = computed(() => {
            return props.leftValue ? props.leftValue : props.leftPlaceholder;
        });
        function getPopupContainer() {
            return document.querySelector('.ge-composition-search');
        }
        return {
            leftFill,
            _leftValue,
            getPopupContainer,
        };
    },
});
</script>

<style></style>
