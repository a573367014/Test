<style lang="less">

.eui-v2-aside-container {
    position: absolute;
    width: @aside-bar-width;
    bottom: 0;
    padding-top: 6px;
    background-color: white;
    box-sizing: border-box;

    .eui-v2-aside {
        display: flex;
        height: 100%;
        flex-direction: column;
        justify-content: flex-start;
        background: white;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;

        .eui-v2-aside-body {
            flex-grow: 1;
        }

        .eui-v2-aside-bottom {
            justify-self: end;
        }
    }
}
</style>

<template>
    <div class="eui-v2-aside-container" :style="style">
        <div class="eui-v2-aside">
            <div class="eui-v2-aside-body">
                <slot />
            </div>
            <div class="eui-v2-aside-bottom">
                <slot name="bottom" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        __left: {
            type: Number,
            default: -1
        },
        __right: {
            type: Number,
            default: -1
        },
        smallModeHeight: {
            type: Number,
            default: 720
        },
        __top: {
            type: Number,
            default: -1
        },
        width: {
            type: Number,
            default: 64
        }
    },
    data() {
        const { innerHeight } = window;
        return {
            innerHeight: innerHeight
        };
    },
    computed: {
        style() {
            const { __left, __top, __right, width } = this;
            return {
                top: `${__top}px`,
                left: __left >= 0 ? `${__left}px` : '',
                right: __right >= 0 ? `${__right}px` : '',
                width: `${width + 1}px`
            };
        },
        smallMode() {
            const { innerHeight, smallModeHeight } = this;
            return innerHeight < smallModeHeight;
        }
    },
    created() {
        window.addEventListener('resize', this.onWindowResize);
    },
    destroyed() {
        window.removeEventListener('resize', this.onWindowResize);
    },
    methods: {
        onWindowResize() {
            const { innerHeight } = window;
            this.innerHeight = innerHeight;
        }
    }
};

</script>
