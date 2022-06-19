<style lang="less">

    .eui-v2-main-container {
        position: absolute;
        overflow: auto;
        background-color: @main-background-color;
        bottom: 0;
        right: 0;
        z-index: 0;
        box-sizing: content-box;

        transition: left 0.15s ease;
    }
</style>

<template>
    <div class="eui-v2-main-container" :style="style">
        <slot />
    </div>
</template>

<script>
export default {
    props: {
        __top: {
            type: Number,
            default: 0
        },
        __left: {
            type: Number,
            default: 0
        },
        __right: {
            type: Number,
            default: 0
        }
    },
    computed: {
        style() {
            return {
                top: `${this.__top}px`,
                left: `${this.__left}px`,
                right: `${this.__right}px`
            };
        }
    },
    mounted() {
        this.$el.addEventListener('transitionend', this.onTransitionEnd);
    },
    beforeDestroy() {
        this.$el.removeEventListener('transitionend', this.onTransitionEnd);
    },
    methods: {
        onTransitionEnd(event) {
            if(event.target === this.$el) {
                this.$emit('on-resize', this.__left, this.__right);
            }
        }
    }
};
</script>
