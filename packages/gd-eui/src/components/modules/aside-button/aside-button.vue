<template>
    <g-tooltip :placement="tipPlacement">
        <template slot="title" v-if="showTip">
            <span>{{ label }}</span>
        </template>
        <div
            :class="[
                'ge-aside-button',
                {
                    'ge-aside-button--active': activated,
                },
                {
                    'ge-aside-button--showLine': showLine && !showMask,
                },
                {
                    'ge-aside-button--hover': showHover,
                },
            ]"
        >
            <ge-icon :type="type" style="font-size: 24px"></ge-icon>
            <span class="ge-aside-button__label">{{ label }}</span>
            <div v-if="activated" class="ge-aside-button__line"></div>
            <div v-if="showMask" class="ge-aside-button--mask" />
            <div></div>
        </div>
    </g-tooltip>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import Tooltip from '@gaoding/gd-antd/es/tooltip';
/**
 * @title 组件名
 * GeAsideButton
 */
/**
 * @title 描述
 * 编辑器统一的左侧按钮菜单
 */
/**
 * @title 使用场景
 * 用于编辑器左侧菜单
 * @dot 选中、正常、禁用状态
 */
export default defineComponent({
    name: 'GeAsideButton',
    components: {
        GTooltip: Tooltip,
    },
    props: {
        // 底部文案
        label: {
            type: String,
            default: '我的',
        },
        // icon 类型
        type: {
            type: String,
            default: 'fullscreen_fill',
        },
        // 是否激活
        activated: {
            type: Boolean,
            default: false,
        },
        // 展示激活线
        showLine: {
            type: Boolean,
            default: true,
        },
        // 是否显示遮罩将会禁止点击
        showMask: {
            type: Boolean,
            default: false,
        },
        // 是否支持hover
        showHover: {
            type: Boolean,
            default: false,
        },
        // 是否显示tip
        showTip: {
            type: Boolean,
            default: false,
        },
        // tip位置
        tipPlacement: {
            type: String,
            default: 'left',
        },
    },
});
</script>
