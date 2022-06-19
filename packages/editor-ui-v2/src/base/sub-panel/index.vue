<style lang="less">
    .eui-v2-sub-panel {
        border: 1px solid @border-color;
        margin-top: -1px;
        position: relative;

        &:first-child {
            margin-top: 0;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
        }

        &:last-child {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
        }

        &--padding-horizontal {
            padding-left: 16px;
            padding-right: 16px;
        }

        &--padding-vertical {
            padding-top: 12px;
            padding-bottom: 12px;
        }

        &--light {
            background-color: #F8FAFC;
        }

        &--hover {
            &:hover {
                border-color: @hover-border-color;
                z-index: 1;
            }
        }
    }
</style>


<template>
    <div class="eui-v2-sub-panel" :class="innerClass">
        <slot />
    </div>
</template>

<script>
export default {
    props: {
        padding: {
            type: [Boolean, String],
            default: false
        },
        light: {
            type: Boolean,
            default: false
        },
        hover: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        innerClass() {
            const { padding, light, hover } = this;
            return {
                'eui-v2-sub-panel--padding-horizontal': typeof padding === 'boolean' ? padding : padding === 'horizontal',
                'eui-v2-sub-panel--padding-vertical': typeof padding === 'boolean' ? padding : padding === 'vertical',
                'eui-v2-sub-panel--light': light,
                'eui-v2-sub-panel--hover': hover
            };
        }
    }
};
</script>
