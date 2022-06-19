<template>
    <div :class="['vc-hue', directionClass]">
        <div
            ref="container"
            class="vc-hue-container"
            @mousedown="handleMouseDown"
            @touchmove="handleChange"
            @touchstart="handleChange"
        >
            <div class="vc-hue-pointer" :style="{ top: pointerTop, left: pointerLeft }">
                <div class="vc-hue-picker"></div>
            </div>
        </div>
    </div>
</template>
<script>
import { compatibleEvent } from '@gaoding/editor-framework/src/utils/dom-event';

export default {
    name: 'Hue',
    props: {
        value: {
            type: Object,
            default: () => ({}),
        },
        direction: {
            type: String,
            // [horizontal | vertical]
            default: 'horizontal',
        },
        lockHsl: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            oldHue: 0,
            pullDirection: '',
            lastHsl: null,
        };
    },
    computed: {
        colors() {
            const h = this.value.hsl.h;

            // if(h !== 0 && h - this.oldHue > 0) {
            //     this.pullDirection = 'right';
            // }

            // if(h !== 0 && h - this.oldHue < 0) {
            //     this.pullDirection = 'left';
            // }

            this.oldHue = h; // eslint-disable-line

            return this.value;
        },
        directionClass() {
            return {
                'vc-hue--horizontal': this.direction === 'horizontal',
                'vc-hue--vertical': this.direction === 'vertical',
            };
        },
        pointerLeft() {
            if (this.direction === 'vertical') {
                return 0;
            }

            const hsl = (this.lockHsl && this.lastHsl) || this.colors.hsl;

            if (hsl.h === 0 && this.pullDirection === 'right') {
                return '100%';
            }
            return (hsl.h * 100) / 360 + '%';
        },
        pointerTop() {
            const hsl = this.lastHsl || this.colors.hsl;

            if (this.direction !== 'vertical' || (hsl.h === 0 && this.pullDirection === 'right')) {
                return 0;
            }

            return -((hsl.h * 100) / 360) + 100 + '%';
        },
    },
    created() {
        this.lastHsl = this.colors.hsl;
    },
    methods: {
        onChange(data) {
            this.lastHsl = { ...data };

            this.$emit('change', data);
        },
        handleChange(e, skip) {
            if (!skip) {
                e.preventDefault();
            }

            const container = this.$refs.container;
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width || container.clientWidth;
            const containerHeight = containerRect.height || container.clientHeight;

            const xOffset = containerRect.left + window.pageXOffset;
            const yOffset = containerRect.top + window.pageYOffset;
            const { pageX, pageY } = compatibleEvent(e);
            const left = pageX - xOffset;
            const top = pageY - yOffset;

            let h;
            let percent;

            if (this.direction === 'vertical') {
                if (top < 0) {
                    h = 360;
                } else if (top > containerHeight) {
                    h = 0;
                } else {
                    percent = -((top * 100) / containerHeight) + 100;
                    h = (360 * percent) / 100;
                }
            } else {
                if (left < 0) {
                    h = 0;
                } else if (left > containerWidth) {
                    h = 360;
                } else {
                    percent = (left * 100) / containerWidth;
                    h = (360 * percent) / 100;
                }
            }

            const hsl = this.colors.hsl;

            if (hsl.h !== h) {
                this.onChange({
                    h: h,
                    s: hsl.s,
                    l: hsl.l,
                    a: hsl.a,
                    source: 'hsl',
                });
            }
        },
        handleMouseDown(e) {
            this.handleChange(e, true);
            window.addEventListener('mousemove', this.handleChange);
            window.addEventListener('mouseup', this.handleMouseUp);
        },
        // e
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
<style>
.vc-hue {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    border-radius: 2px;
}
.vc-hue--horizontal {
    background: linear-gradient(
        to right,
        #f00 0%,
        #ff0 17%,
        #0f0 33%,
        #0ff 50%,
        #00f 67%,
        #f0f 83%,
        #f00 100%
    );
}
.vc-hue--vertical {
    background: linear-gradient(
        to top,
        #f00 0%,
        #ff0 17%,
        #0f0 33%,
        #0ff 50%,
        #00f 67%,
        #f0f 83%,
        #f00 100%
    );
}
.vc-hue-container {
    cursor: pointer;
    margin: 0 2px;
    position: relative;
    height: 100%;
}
.vc-hue-pointer {
    z-index: 2;
    position: absolute;
}
.vc-hue-picker {
    cursor: pointer;
    margin-top: 1px;
    width: 4px;
    border-radius: 1px;
    height: 8px;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
    background: #fff;
    transform: translateX(-2px);
    box-sizing: content-box;
}
</style>
