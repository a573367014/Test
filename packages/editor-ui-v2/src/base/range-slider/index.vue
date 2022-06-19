<template>
    <div
        class="eui-v2-range-slider"
        @mousedown="onClickRange"
        @mousewheel="onWheel"
        draggable="false"
        :class="{'disabled': invalid || disabled}">
        <div
            class="progress"
            :style="progressSize">
            <em>{{progress.toFixed(2)}}</em>
        </div>
        <div
            class="slider-ball"
            v-if="!bubble"
            :style="{left: progress + '%'}"
            @mousedown="onMousedown"
            @touchstart="onMousedown"
            draggable="false"/>
        <div
            v-if="bubble && type=='percent' "
            :class="{'with-bubble': bubble, 'tooltip': bubble}"
            :style="{left: progress + '%'}"
            @mousedown="onMousedown"
            @touchstart="onMousedown"
            class="slider-ball"
            :aria-label="tip"/>
        <div
            v-if="bubble && type=='number' "
            :class="{'with-bubble': bubble, 'tooltip': bubble}"
            :style="{left: progress + '%'}"
            @mousedown="onMousedown"
            @touchstart="onMousedown"
            class="slider-ball"
            :data-a="value"
            :aria-label="tip"/>
        <div
            v-if="bubble && type=='format' "
            :class="{'with-bubble': bubble, 'tooltip': bubble}"
            :style="{left: progress + '%'}"
            @mousedown="onMousedown"
            @touchstart="onMousedown"
            class="slider-ball"
            :data-a="value"
            :aria-label="tip"/>
    </div>
</template>

<script>
import { compatibleEvent } from '@gaoding/editor-framework/src/utils/dom-event';

function noop() {};

export default {
    model: {
        prop: 'value',
        event: 'change'
    },
    props: {
        value: {
            type: Number,
            default: 0
        },
        min: {
            type: Number,
            default: 0
        },
        max: {
            type: Number,
            default: 100
        },
        bubble: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: '',
            validator: function(value) {
                if(value) {
                    return ['percent', 'number', 'format'].includes(value);
                }
                return true;
            }
        },
        wheel: {
            type: Boolean,
            default: false
        },
        formatter: {
            type: Function,
            default: noop
        },
        invalid: {
            type: Boolean,
            default: false
        },
        start: {
            type: Number,
            default: function() {
                return this.min;
            }
        },
        disabled: {
            type: Boolean,
            default: false
        },
        bonding: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            focus: false,
            actived: false,
            range: this.min
        };
    },
    computed: {
        progress() {
            return this.getProgress(this.range);
        },
        tip() {
            let tip = this.value;
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
        },
        progressSize() {
            const { innerStart, progress } = this;
            const startProgress = this.getProgress(innerStart);
            return {
                left: `${Math.min(progress, startProgress)}%`,
                width: `${Math.abs(startProgress - progress)}%`
            };
        },
        innerStart() {
            const { max, min, start } = this;
            return Math.min(max, Math.max(min, start));
        }
    },
    created() {
        this.$on('destroy', this.removeDocEvts);
    },
    mounted() {
        // sync
        this.range = this.value === undefined
            ? this.min
            : this.value;

        // outer -> inner
        this.$watch('value', newValue => {
            this.range = Math.max(this.min, Math.min(this.max, newValue));
        });
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
    methods: {
        getProgress(value) {
            const total = this.max - this.min;
            const curr = value - this.min;
            return Math.max(Math.min(100 * curr / total, 100), 0);
        },
        onMousedown(e) {
            if((e.button !== 0 || this.invalid || this.disabled) && e.type !== 'touchstart') {
                return;
            }
            e.preventDefault();

            const self = this;
            const { pageX } = compatibleEvent(e);

            const drag = this.drag = {
                pageX,
                width: this.$el.offsetWidth,
                startRange: this.range,
                move(evt) {
                    evt.preventDefault();
                    const min = self.min;
                    const max = self.max;
                    const bonding = self.bonding;
                    const start = self.start;
                    const startRange = drag.startRange;
                    const { pageX } = compatibleEvent(evt);
                    const tx = pageX - drag.pageX;
                    const ratio = tx / drag.width;
                    let range = startRange + ratio * (max - min);
                    if(bonding) {
                        if(Math.abs(Math.abs(range) - Math.abs(start)) <= bonding) {
                            range = start;
                        }
                        // 如果变化超过吸附点，为了弥补被吸附的区间，将 range 减去吸附值
                        else if(Math.sign(startRange - start) !== Math.sign(range - start)) {
                            range = range - bonding * Math.sign(range - start);
                        }
                    }
                    range = Math.max(min, Math.min(max, range));
                    self.setRange(range);
                },
                cancel() {
                    document.removeEventListener('mousemove', drag.move);
                    document.removeEventListener('touchmove', drag.move);
                    document.removeEventListener('mouseup', drag.cancel);
                    document.removeEventListener('touchend', drag.cancel);
                    self.$emit('drag-end', self.range);
                    self.drag = null;
                    self.actived = false;
                }
            };

            this.actived = true;
            document.addEventListener('mousemove', drag.move);
            document.addEventListener('touchmove', drag.move);
            document.addEventListener('mouseup', drag.cancel);
            document.addEventListener('touchend', drag.cancel);
            this.initHotkey();
        },
        initHotkey() {
            if(this.focus) {
                return;
            }
            const self = this;
            const hotkey = {
                keydown(e) {
                    if(self.actived) {
                        return;
                    }

                    const keyCode = e.keyCode;
                    if(keyCode >= 37 && keyCode <= 40) {
                        const { min, max } = self;
                        let { range } = self;
                        switch (keyCode) {
                            case 37:
                            case 40:
                                range -= 1;
                                break;
                            case 38:
                            case 39:
                                range += 1;
                        }
                        range = Math.max(min, Math.min(max, range));
                        self.setRange(range);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                },
                cancel(e) {
                    const target = e.target;
                    if(!self.$el.contains(target)) {
                        self.focus = false;
                        document.removeEventListener('mousedown', hotkey.cancel);
                        document.removeEventListener('keydown', hotkey.keydown, true);
                    }
                }
            };
            self.focus = true;
            document.addEventListener('mousedown', hotkey.cancel);
            document.addEventListener('keydown', hotkey.keydown, true);
        },
        onClickRange(e) {
            if(e.target.classList.contains('slider-ball') || this.invalid || this.disabled) {
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
            this.range = percent;

            this.setRange(percent);

            this.onMousedown(e);
        },
        onWheel(e) {
            if(!this.wheel || this.invalid) {
                return;
            }

            e.preventDefault();
            const wheelMulti = e.shiftKey ? 0.5 : 0.1;
            const direction = e.wheelDelta > 0 ? -1 : 1;
            let range = this.range - (this.max - this.min) / 15 * direction * wheelMulti;
            range = Math.max(this.min, Math.min(this.max, range));

            this.setRange(range);
        },
        removeDocEvts() {
            const onDocClick = this.onDocClick;
            document.removeEventListener('click', onDocClick, false);
        },
        setRange(range) {
            this.$emit('change', range);
        }
    }
};
</script>

<style lang="less">
@import './tooltip.less';

.eui-v2-range-slider {
    position: relative;
    height: 16px;
    border-right: 6px solid transparent;
    cursor: pointer;

    &:before {
        content: "";
        width: 100%;
        box-sizing: content-box;
        background: #6B6B6D;
        opacity: .2;
    }
    &:before,
    .progress {
        position: absolute;
        height: 2px;
        border-radius: 15px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        border-radius: 2px;
    }
    .progress {
        background-color: @primary-color;
        width: 0;
        em {
            display: none;
        }
    }
    .slider-ball {
        position: absolute;
        top: 50%;
        left: 0px;
        height: 13px;
        width: 13px;
        box-sizing: border-box;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
        transform: translate(-50%, -50%);
        transition: width .05s ease-in, height .05s ease-in;
        cursor: pointer;
    }

    &:hover {
        .slider-ball {
            width: 15px;
            height: 15px;
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
        cursor: not-allowed;

        .progress {
            opacity: .6;
        }

        .slider-ball {
            cursor: not-allowed;
            border-color: @disabled-color;
        }
        &:hover {
            .slider-ball {
                height: 13px;
                width: 13px;
            }
        }
    }
}
</style>
