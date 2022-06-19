<template>
    <div
        class="eui-v2-dropdown-menus"
        :class="{ 'eui-v2-dropdown-menus_large': large }"
        :style="menusStyle"
    >
        <slot />
    </div>
</template>

<script>
export default {
    props: {
        width: {
            type: Number,
            default: 0,
        },
        height: {
            type: Number,
            default: 0,
        },
        large: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        menusStyle() {
            const { width, height } = this;
            return {
                width: width ? `${width}px` : '',
                height: height ? `${height}px` : '',
            };
        },
    },
};
</script>
<style lang="less">
.eui-v2-dropdown-menus {
    overflow: auto;
    background: white;
    padding: 8px 0;
    border-radius: @button-border-radius;
    box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
    // border:1px solid @border-color;
    margin: -1px;

    &_large {
        padding: 12px 0;
    }
}
</style>
