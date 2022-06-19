<template>
    <div
        class="eui-v2-range-slider"
        @mousedown="onClickRange"
        @mousewheel="onWheel"
        draggable="false"
        :class="{'disabled': invalid}"
    >
        <div
            class="progress"
            :style="style"
        >
            <em>{{progress.toFixed(2)}}</em>
        </div>
        <div
            class="slider-ball"
            v-if="!bubble"
            :style="{left: Math.min(progress, 100) + '%'}"
            @mousedown="onMousedown"
            draggable="false"
        >
        </div>
        <div
            v-if="bubble && type=='number' "
            :class="{
                'with-bubble': bubble,
            }"
            :style="{left: Math.min(progress, 100) + '%'}"
            @mousedown="onMousedown"
            class="ball"
            :data-a="value"
            :aria-label="displayFormatter(tip)"
        ></div>
    </div>
</template>

<script>
const { round } = Math;

export default {
    props: {
        change: {},
        value: {},
        min: {},
        max: {},
        bubble: {},
        type: {},
        wheel: {},
        formatter: {},
        disabled: {},
        fromZero: {
            default: true,
            type: Boolean
        },
        invalid: {},
        displayFormatter: {
            default(v) {
                return round(v, 1);
            },
            type: Function
        },
        throttle: {
            type: Number,
            default: 0,
        }
    },
    data() {
        return {
            actived: false,
            range: 0,
            oldRange: 0
        };
    },
    computed: {
        style() {
            const { progress, max, min, fromZero } = this;

            if(!fromZero) {
                return {
                    width: Math.min(progress, 100) + '%'
                };
            }
            else {
                const whereZero = ((max - 0) / (max - min)) * 100;

                return {
                    width: Math.min(Math.abs(progress - whereZero), 100) + '%',
                    left: Math.min(Math.min(progress, whereZero), 100) + '%'
                };
            }
        },
        progress() {
            const total = this.max - this.min;
            const curr = this.range - this.min;

            return (100 * curr) / total;
        },
        tip() {
            let tip = this.value;
            if(this.fromZero) {
                const whereZero =
                    ((this.max - 0) / (this.max - this.min)) * 100;

                tip = tip - whereZero;
            }

            switch (this.type) {
            case 'percent':
                tip = parseInt(this.progress) + '%';
                break;
            case 'number':
                tip = parseInt(this.value) + '°';
                break;
            case 'format':
                tip = this.formatter(this.progress, this.value);
                break;
            default:
                tip = this.value;
            }

            return tip;
        }
    },
    methods: {
        onMousedown(e) {
            if(e.button !== 0) {
                return;
            }
            e.preventDefault();

            const self = this;
            const drag = this.drag = {
                pageX: e.pageX,
                width: this.$el.offsetWidth,
                startRange: this.range,
                move(evt) {
                    evt.preventDefault();
                    const min = self.min;
                    const max = self.max;
                    const startRange = drag.startRange;
                    const tx = evt.pageX - drag.pageX;
                    const ratio = tx / drag.width;
                    let range = startRange + ratio * (max - min);
                    range = Math.max(min, Math.min(max, range));
                    self.setRange(range);
                },
                cancel() {
                    document.removeEventListener('mousemove', drag.move);
                    document.removeEventListener('mouseup', drag.cancel);
                    self.drag = null;
                    self.actived = false;
                }
            };

            this.actived = true;
            document.addEventListener('mousemove', drag.move);
            document.addEventListener('mouseup', drag.cancel);
        },
        onClickRange(e) {
            if(e.target.classList.contains('slider-ball')) {
                return false;
            }

            const offsetValue = e.clientX - this.$el.getBoundingClientRect().left;
            let percent = offsetValue / this.$el.scrollWidth;
            const edgeOmit = 0.04;

            // To edge value
            if(percent <= edgeOmit || percent >= 1 - edgeOmit) {
                percent = Math.round(percent);
            }

            percent = this.min + (this.max - this.min) * percent;

            this.setRange(percent);

            this.onMousedown(e);
        },
        onWheel(e) {
            if(!this.wheel) {
                return;
            }

            e.preventDefault();
            const wheelMulti = e.shiftKey ? 0.5 : 0.1;
            const direction = e.wheelDelta > 0 ? -1 : 1;
            let range = this.range - (this.max - this.min) / 15 * direction * wheelMulti;
            range = Math.max(this.min, Math.min(this.max, range));

            this.range = this.stickToZero(range, this.oldRange);
            this.setRange(range);
        },
        removeDocEvts() {
            const onDocClick = this.onDocClick;
            document.removeEventListener('click', onDocClick, false);
        },
        setRange(range) {
            this.$emit('change', range);
        },
        stickToZero(val) {
            if(!this.fromZero) {
                this.oldRange = val;
                return val;
            }

            if(this.oldRange > val && val <= this.max * 0.05 && val >= 0) {
                return 0;
            }

            if(this.oldRange < val && val >= this.min * 0.05 && val <= 0) {
                return 0;
            }

            this.oldRange = val;

            return val;
        }

    },
    created() {
        this.$on('destroy', this.removeDocEvts);
    },
    mounted() {
        // sync
        this.range = this.value;

        // outer -> inner
        this.$watch('value', newValue => {
            this.range = Math.max(this.min, Math.min(this.max, newValue));
        });
    },
    beforeDestroy() {
        this.$emit('destroy');
    }
};
</script>

<style lang="less" scoped>
.tooltip{
    position: relative;
    &::before,
    &::after{
        position: absolute;
        left: 50%;
        opacity: 0;
        line-height: 20px;
        font-style: normal;
        transform: translateX(-50%);
        transition: all .3s;
        pointer-events: none;
    }
    &::before{
        content: '';
        top: -1px;
        z-index: 999;
        width: 0;
        height: 0;
        border: 5px solid rgba(0, 0, 0, 0);
        border-top-color: rgba(0, 0, 0, .7);
        color: rgba(0, 0, 0, 0.8);
    }
    &::after{
        content: attr(aria-label);
        top: -25px;
        padding: 3px 5px;
        border-radius: 3px;
        font-size: 12px;
        white-space: pre;
        color: #fff;
        background: rgba(0, 0, 0, .7);
        -webkit-font-smoothing: subpixel-antialiased;
    }
    &:hover{
        &::before,
        &::after{
            opacity: 1;
        }
        &::before{
            top: -9px;
        }
        &::after{
            top: -35px;
        }
    }
}

.eui-v2-range-slider {
    border-right: 3px solid transparent;
    height: 16px;
    position: relative;
    cursor: pointer;

    &:before {
        box-sizing: content-box;
        content: "";
        // padding-right: 12px;
        width: 100%;
    }
    &:before, .progress {
        background: #DEE5F0;
        border-radius: 2px;
        height: 2px;
        position: absolute;
        top: 7px;
        left: 0;
    }
    .progress {
        background-color: #005CF9;
        width: 0;
        em {
            display: none;
        }
    }
    .slider-ball {
        background: #005CF9;
        border-radius: 50%;
        height: 12px;
        width: 12px;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        transition: width .2s linear, height .2s linear;
        left: 0px;
        cursor: pointer;
    }
    &:hover {
        .slider-ball {
            width: 16px;
            height: 16px;
        }
        .tooltip {
            &::before,
            &::after{
                opacity: 1;
            }
            &::before{
                top: -9px;
            }
            &::after{
                top: -35px;
            }
        }
    }
    &.disabled {
        &:before {
            background: #eeeeee;
        }
        .progress, .slider-ball {
            background: #dddddd;
        }
    }
}
</style>
