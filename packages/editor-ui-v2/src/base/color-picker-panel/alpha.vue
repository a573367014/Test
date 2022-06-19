<template>
    <div class="vc-alpha">
        <div class="vc-alpha-checkboard-wrap">
            <checkboard></checkboard>
        </div>
        <div class="vc-alpha-gradient" :style="{ background: gradientColor }"></div>
        <div
            class="vc-alpha-container"
            ref="container"
            @mousedown="handleMouseDown"
            @touchmove="handleChange"
            @touchstart="handleChange"
        >
            <div class="vc-alpha-pointer" :style="{ left: colors.a * 100 + '%' }">
                <div
                    class="vc-alpha-picker vc-alpha__tip"
                    :aria-label="Math.floor(colors.a * 100) + '%'"
                ></div>
            </div>
        </div>
    </div>
</template>

<script>
import checkboard from 'vue-color/src/components/common/Checkboard.vue';
import { compatibleEvent } from '@gaoding/editor-framework/src/utils/dom-event';

export default {
    name: 'Alpha',
    components: {
        checkboard,
    },
    props: {
        value: {
            type: Object,
            default: () => ({}),
        },
        onChange: {
            type: Function,
            default: () => {},
        },
    },
    computed: {
        colors() {
            return this.value;
        },
        gradientColor() {
            const rgba = this.colors.rgba;
            const rgbStr = [rgba.r, rgba.g, rgba.b].join(',');
            return (
                'linear-gradient(to right, rgba(' +
                rgbStr +
                ', 0) 0%, rgba(' +
                rgbStr +
                ', 1) 100%)'
            );
        },
    },
    methods: {
        handleChange(e, skip) {
            if (!skip) {
                e.preventDefault();
            }
            const container = this.$refs.container;
            if (!container) {
                return;
            }
            const containerWidth = container.clientWidth;

            const xOffset = container.getBoundingClientRect().left + window.pageXOffset;
            const { pageX } = compatibleEvent(e);

            const left = pageX - xOffset;

            let a;
            if (left < 0) {
                a = 0;
            } else if (left > containerWidth) {
                a = 1;
            } else {
                a = Math.round((left * 100) / containerWidth) / 100;
            }

            if (this.colors.a !== a) {
                this.$emit('change', {
                    h: this.colors.hsl.h,
                    s: this.colors.hsl.s,
                    l: this.colors.hsl.l,
                    a: a,
                    source: 'rgba',
                });
            }
        },
        handleMouseDown(e) {
            this.handleChange(e, true);
            window.addEventListener('mousemove', this.handleChange);
            window.addEventListener('mouseup', this.handleMouseUp);
        },
        handleMouseUp() {
            this.unbindEventListeners();
        },
        unbindEventListeners() {
            window.removeEventListener('mousemove', this.handleChange);
            window.removeEventListener('mouseup', this.handleMouseUp);
        },
    },
};
</script>

<style lang="less">
.vc-alpha {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    &__tip[aria-label] {
        position: relative;

        &:before {
            content: '';
            position: absolute;
            z-index: 999;
            bottom: 100%;
            left: 50%;
            margin: -8px 0 0 -5px;
            display: none;
            width: 0;
            height: 0;
            border: 5px solid rgba(0, 0, 0, 0);
            border-top-color: rgba(0, 0, 0, 0.7);
            color: rgba(0, 0, 0, 0.8);
            pointer-events: none;
        }

        &:after {
            content: attr(aria-label);
            position: absolute;
            z-index: 999;
            bottom: 100%;
            left: 50%;
            margin-bottom: 10px;
            display: none;
            padding: 5px 8px;
            font-size: 14px;
            text-align: center;
            white-space: pre;
            word-wrap: break-word;
            border-radius: 3px;
            color: #fff;
            background: rgba(0, 0, 0, 0.7);
            pointer-events: none;
            -webkit-transform: translateX(-50%);
            transform: translateX(-50%);

            -webkit-font-smoothing: subpixel-antialiased;
        }

        &:hover,
        &:active {
            z-index: 999;

            &:before,
            &:after {
                display: block;
                text-decoration: none;
            }
        }
    }
}
.vc-alpha-checkboard-wrap {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    overflow: hidden;
    border-radius: inherit;

    .vc-checkerboard {
        background-size: 2%;
    }
}
.vc-alpha-gradient {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
}
.vc-alpha-container {
    position: relative;
    z-index: 2;
    margin: 0 3px;
    height: 100%;
    cursor: pointer;
}
.vc-alpha-pointer {
    position: absolute;
    z-index: 2;
}
.vc-alpha-picker {
    margin-top: 1px;
    width: 4px;
    height: 8px;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
    border-radius: 1px;
    background: #fff;
    cursor: pointer;
    transform: translateX(-2px);
}
</style>
