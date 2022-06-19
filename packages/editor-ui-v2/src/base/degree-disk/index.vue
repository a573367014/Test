<template>
    <div
        ref="pan"
        :class="[bem('pan'), disabled && bem('pan', 'disabled')]"
        :style="{width: `${size}px`, height: `${size}px`}"
        @mousedown="handleMousedown">
        <div :class="bem('pan__control')" :style="rotateStyle">
            <span :class="bem('pan__pointer')" ref="pointer" :style="pointerStyle" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'eui-v2-degree-disk',
    props: {
        degree: {
            type: Number,
            default: 0
        },
        disabled: {
            type: Boolean,
            default: false
        },
        step: {
            type: Number,
            default: 1
        },
        size: {
            type: Number,
            default: 48
        },
        dotSize: {
            type: Number,
            default: 10
        }
    },
    data() {
        return {};
    },
    computed: {
        pointerStyle() {
            const { dotSize } = this;
            return {
                width: dotSize + 'px',
                height: dotSize + 'px',
            };
        },
        rotateStyle() {
            const { degree } = this;
            return {
                transform: `rotate(${-degree}deg)`
            };
        }
    },
    mounted() {},
    methods: {
        offsetToDegree(x, y) {
            const panRect = this.$refs.pan.getBoundingClientRect();
            const cx = panRect.width / 2;
            const cy = panRect.width / 2;
            const degree = Math.atan2(cy - y, x - cx) * 180 / Math.PI;
            return parseInt(degree / this.step) * this.step;
        },
        handleMousedown(event) {
            if(this.disabled) return;
            const diskX = event.pageX - event.layerX;
            const diskY = event.pageY - event.layerY;
            const handleMousemove = (event) => {
                const offsetX = event.pageX - diskX;
                const offsetY = event.pageY - diskY;
                const degree = this.offsetToDegree(offsetX, offsetY);
                this.$emit('change', this.sticky(degree));
            };
            handleMousemove(event);
            document.addEventListener('mousemove', handleMousemove);
            document.addEventListener('mouseup', () => {
                this.$emit('mouseup');
                document.removeEventListener('mousemove', handleMousemove);
            });
            this.$emit('mousedown');
        },
        sticky(degree) {
            const tolerance = 5;
            const step = 90;
            const min = -180;
            const max = 180;
            for(let i = min; i < max; i += step) {
                if(degree > i - tolerance && degree < i + tolerance) {
                    return i;
                }
            }
            return degree;
        }
    },
};
</script>

<style lang="less">
.eui-v2-degree-disk {
    &__pan {
        position: relative;
        text-align: right;
        border-radius: 50%;
        background: #E8EAEC;
        cursor: pointer;
        &--disabled {
            cursor: not-allowed;
            .eui-v2-degree-disk__pointer {
                background: @disabled-color;
            }
        }
         &__control {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }
         &__pointer {
            margin-right: 7%;
            display: inline-block;
            border-radius: 50%;
            background: #33383E;
            pointer-events: none;
            transform-origin: left top;
        }
    }
}
</style>
