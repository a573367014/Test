<template>
    <div
        class="editor-angle-picker"
        @mousedown="onMousedown"
        @mousewheel="onWheel"
        @selectstart.prevent
    >
        <div
            class="editor-angle-picker__part"
            :style="{
                top: progress + 'px',
            }"
        >
            <!-- <div class="editor-angle-picker__angle-list">
                <div
                    class="angle-list__item"
                    v-for="(item, index) in angleList"
                    :key="index"
                    :style="{
                        opacity: computeOpacity(item, index)
                    }">{{ item }}</div>
            </div> -->
            <div class="editor-angle-picker__dot-list">
                <div
                    class="dot-list__item"
                    v-for="(item, index) in dotList"
                    :key="'$' + index"
                    :style="computeDotStyle(item, index)"
                >
                    <span>{{ getDeg(item) }}</span>
                </div>
            </div>
        </div>
        <div class="editor-angle-picker__pointer"></div>
    </div>
</template>
<script>
import $ from '@gaoding/editor-utils/zepto';
import outClick from '@gaoding/editor-utils/out-click';

export default {
    props: {
        value: {
            type: Number,
            default: 0,
        },
        min: {
            type: Number,
            default: -90,
        },
        max: {
            type: Number,
            default: 90,
        },
        wheel: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            active: false,
            currentAngle: 0,
            angleList: [90, 75, 60, 45, 30, 15, 0, -15, -30, -45, -60, -75, -90],
            elHeight: 0,
        };
    },
    computed: {
        range: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('update:value', val);
                this.$emit('change', val);
            },
        },
        deltaRange() {
            return this.elHeight / (this.max - this.min);
        },
        progress() {
            const distance = this.range * this.deltaRange;
            return distance;
            // return (this.range / 15 - 3) * this.baseOffsetFactor * 100;
            // return 0;
        },
        baseOffsetFactor() {
            const listItemHeight = 10 + 43;
            const partHeight = 150;
            const factor = listItemHeight / partHeight;

            return factor;
        },
        tip() {
            return Math.round(this.range);
        },
        dotList() {
            const arr = new Array(120);
            const list = [];

            let value = 90;
            for (let i = 0; i <= 60; i++) {
                list.push(value);
                value -= 3;
            }

            return list;
        },
    },

    mounted() {
        // active toggle
        this.initOutClick();
        this.updateHeight();

        window.addEventListener('resize', this.updateHeight);
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.updateHeight);
        this.$emit('destroy');
    },
    methods: {
        updateHeight() {
            this.$nextTick(() => {
                this.elHeight = this.$el.offsetHeight;
            });
        },
        computeOpacity(item) {
            // if(Math.abs(item) > Math.abs(this.range) + 45) {
            //     return Math.max(0, 1 - 0.2 * (Math.abs(item) - 45) / 3);
            // }

            return 1;
        },
        getDeg(item) {
            return this.angleList.includes(item) ? item + '°' : '';
        },
        computeDotStyle(item) {
            const opacity = this.computeOpacity(item);
            let width = 2;
            let height = 2;
            if (this.angleList.includes(item)) {
                width = 4;
                height = 4;
            }

            return {
                opacity,
                width: width + 'px',
                height: height + 'px',
            };
        },
        onMousedown(e) {
            if (e.button !== 0) {
                return;
            }

            const self = this;
            let doc = $(document);
            const drag = (this.drag = {
                pageY: e.pageY,
                height: $(this.$el).height(),
                startRange: this.range,
                move(e) {
                    const min = self.min;
                    const max = self.max;
                    const startRange = drag.startRange;
                    const tx = e.pageY - drag.pageY;
                    const ratio = tx / drag.height;
                    let range = startRange + ratio * (max - min);
                    range = Math.max(min, Math.min(max, range));
                    self.range = parseInt(range); // 刻度值为整数
                },
                cancel(e) {
                    e.stopPropagation();
                    doc.off('mousemove', drag.move);
                    self.drag = null;
                    doc = null;

                    // inactive
                    self.active = false;
                },
            });

            // active
            this.active = true;

            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
            doc.one('click', drag.docClick);
        },

        // out click
        initOutClick() {
            const self = this;
            const offOutClick = outClick.addOutClick({
                element: this.$el,
                callback() {
                    self.active = false;
                },
            });
            this.$on('destroy', offOutClick);
        },

        // Click change range value
        onClickRange(e) {
            // Click ball do nothing.
            if (e.target.classList.contains('ball')) {
                return false;
            }

            const offsetValue = e.clientX - this.$el.getBoundingClientRect().left;
            let percent = offsetValue / this.$el.scrollWidth;
            const edgeOmit = 0.04;

            // To edge value
            if (percent <= edgeOmit || percent >= 1 - edgeOmit) {
                percent = Math.round(percent);
            }

            percent = this.min + (this.max - this.min) * percent;

            this.range = percent;

            this.onMousedown(e);
        },

        // Wheel change range value
        onWheel(e) {
            if (!this.wheel) {
                return;
            }

            e.preventDefault();
            const wheelMulti = e.shiftKey ? 0.5 : 0.1;
            const direction = e.wheelDelta > 0 ? -1 : 1;
            let range = this.range - ((this.max - this.min) / 15) * direction * wheelMulti;
            range = Math.max(this.min, Math.min(this.max, range));

            this.range = range;
        },
    },
};
</script>

<style lang="less">
.editor-angle-picker {
    width: 100px;
    height: 100%;
    display: flex;
    flex-direction: column;
    cursor: ns-resize;
    overflow: hidden;
    text-align: center;
    z-index: 99;
    user-select: none;
    mask-image: -webkit-gradient(
        linear,
        center top,
        center bottom,
        color-stop(0, rgba(0, 0, 0, 0)),
        color-stop(0.18, rgba(0, 0, 0, 0)),
        color-stop(0.25, #000000),
        color-stop(0.75, #000000),
        color-stop(0.82, rgba(0, 0, 0, 0)),
        color-stop(1, rgba(0, 0, 0, 0))
    );

    &__part {
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: absolute;
        left: 50%;
    }

    &__current-angle {
        width: 35px;
        display: flex;
        align-content: center;
        justify-items: center;
        align-items: center;
        transition: transform 0.2s;
        font-weight: bold;
        font-size: 14px;
        margin-left: -2px;
    }

    &__dot-list {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        .dot-list__item {
            border-radius: 50%;
            background: #606770;
            span {
                position: absolute;
                color: #9aa0a6;
                font-size: 14px;
                line-height: 1;
                margin-top: -7px;
                left: -48px;
                width: 40px;
                text-align: right;
            }
        }
    }

    &__pointer {
        width: 0;
        height: 0;
        border-width: 7px 8px;
        border-style: solid;
        border-color: transparent #444950 transparent transparent;
        position: absolute;
        top: 50%;
        transform: translate(calc(-50% + 18px), -50%);
        left: 50%;
    }

    .nw-arrow {
        height: 36px;
        width: 30px;
        margin-left: -15px;
        // background: svg-load('../styles/assets/svg/nw-arrow.svg', fill=#000)
        //     no-repeat center center;
    }
}
</style>
