<style lang="less">

    .eui-v2-panel-container {
        position: absolute;
        bottom: 0;
        width: @panel-bar-width;
        background: white;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: content-box;
        transition: width .15s ease;
    }

    .eui-v2-panel-container__close {
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%) rotate(180deg);
        // transition: transform 0.1s ease;

        &__content {
            width: 20px;
            height: 64px;
            cursor: pointer;
            background-image: url('../collapse-container/icon-collapse-close.png');
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center;
        }
    }

    // .eui-v2-panel-container-enter-active {
    //     transition: opacity .15s ease, transform .15s ease;
    //     .eui-v2-panel-container__close {
    //         transform: translate3d(0, 0, 0);
    //     }
    // }

    // .eui-v2-panel-container-leave-active {
    //     transition: width .15s ease .5s,
    //         right .15s ease .5s,
    //         opacity .15s ease,
    //         transform .15s ease;
    //     .eui-v2-tooltip {
    //         display: none;
    //     }
    // }

    // .eui-v2-panel-container-enter, .eui-v2-panel-container-leave-to {
    //     width: 0 !important;
    //     opacity: 0;
    //     transform: translate3d(-300px, 0, 0);
    // }

</style>

<template>
    <transition name="eui-v2-panel-container" mode="out-in">
        <div class="eui-v2-panel-container" :style="style">
            <slot></slot>
            <div
                v-if="showClose"
                class="eui-v2-panel-container__close"
                @click="onToggle">
                <div class="eui-v2-panel-container__close__content"/>
                <!-- <Tooltip :appendBody="false" placement="left-center" content="关闭侧边栏">
                </Tooltip> -->
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    components: {
    },
    props: {
        __left: {
            type: Number,
            default: -1
        },
        __right: {
            type: Number,
            default: -1
        },
        __top: {
            type: Number,
            default: -1
        },
        width: {
            type: Number,
            default: 276
        },
        showClose: {
            type: Boolean,
            default: false
        },
        collapsed: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        style() {
            const { __left, __top, __right, width } = this;
            return {
                top: `${__top}px`,
                left: __left >= 0 ? `${__left}px` : '',
                right: __right >= 0 ? `${__right}px` : '',
                width: this.collapsed ? 0 : `${width}px`
            };
        }
    },
    methods: {
        onToggle() {
            this.$emit('toggle');
        }
    }
};
</script>
