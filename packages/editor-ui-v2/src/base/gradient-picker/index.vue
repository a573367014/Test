<template>
    <div class="eui-v2-gradient-picker" tabindex="0" ref="container">
        <div class="eui-v2-gradient">
            <div
                ref="bg"
                class="eui-v2-gradient__background"
                :style="{
                    backgroundImage: getGradientString(previewAngle, stops)
                }"
            />
            <div
                :class="bem('stop__container')"
                ref="bar"
                @mousedown.self="handleBackgroundMousedown"
            >
                <div
                    :class="[bem('stop'), stopIndex === currentStopIndex && bem('stop', 'current')]"
                    v-for="(stop, stopIndex) in stops"
                    :key="stopIndex"
                    :style="{ left: `calc(${stop.offset * 100}% - 8px)`}"
                    @mousedown="handleStopMousedown($event, stop, stopIndex)"
                    @dragstart.prevent
                >
                    <span
                        :class="bem('stop__inner')"
                        :style="{
                            backgroundImage: getGradientString(previewAngle, stops),
                            width: barWidth + 'px',
                            backgroundPositionX: (14 - barWidth) * stop.offset + 'px'
                        }" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import tinycolor from 'tinycolor2';
const PREVIEW_ANGLE = 0;

export default {
    name: 'eui-v2-gradient',
    props: {
        stops: {
            type: Array,
            default: () => [{ color: '#fff', offset: 0 }, { color: '#000', offset: 1 }]
        },
        currentStopIndex: {
            type: Number,
            default: 0
        },
        angle: {
            type: Number,
            default: 90
        }
    },
    data() {
        return {
            previewAngle: PREVIEW_ANGLE,
            barWidth: 0,
        };
    },
    mounted() {
        this.initDeleteEvent();
        this.barWidth = this.$refs.bg.clientWidth;
    },
    beforeDestroy() {
        this.destroyDeleteEvent();
    },
    methods: {
        getStops() {
            return this.stops.map(stop => Object.assign({}, stop));
        },
        getGradientString(angle, stops) {
            stops = stops.length === 1 ? stops.concat(stops) : stops;
            return `linear-gradient(${90 - angle}deg, ${stops.map(stop => `${stop.color} ${stop.offset * 100}%`)})`;
        },
        sortStops(stops) {
            stops.sort((previous, next) => previous.offset - next.offset);
        },
        getOffsetByEvent(event) {
            this.barRect = this.$refs.bar.getBoundingClientRect();
            const elLeft = this.barRect.left;
            const offsetLeft = event.pageX - elLeft;
            return offsetLeft / this.barRect.width;
        },
        addStop(stops, stop) {
            const index = this.getStopIndexByOffset(stop.offset);
            stops.splice(index, 0, stop);
        },
        removeStop(stops, stop) {
            stops.splice(stops.indexOf(stop), 1);
        },
        getStopIndexByOffset(offset) {
            const { stops } = this;
            const leftStop = stops.find(
                (stop, stopIndex) => (
                    stop.offset < offset &&
                    stops[stopIndex + 1] &&
                    stops[stopIndex + 1].offset > offset
                )
            );

            return leftStop === undefined
                ? offset < stops[0].offset
                    ? 0
                    : stops.length
                : stops.indexOf(leftStop) + 1;
        },
        getColorByOffset(offset) {
            const { stops } = this;
            const index = this.getStopIndexByOffset(offset);
            const leftStop = stops[index - 1] || { color: stops[0].color, offset: 0 };
            const rightStop = stops[index] || { color: stops[stops.length - 1].color, offset: 100 }; ;
            const leftRgb = tinycolor(leftStop.color).toRgb();
            const rightRgb = tinycolor(rightStop.color).toRgb();

            const gap = rightStop.offset - leftStop.offset;
            const offsetToLeft = offset - leftStop.offset;
            const weight1 = offsetToLeft / gap;
            const weight2 = 1 - weight1;
            const rgbArray = [
                leftRgb.r * weight2 + rightRgb.r * weight1,
                leftRgb.g * weight2 + rightRgb.g * weight1,
                leftRgb.b * weight2 + rightRgb.b * weight1,
                leftRgb.a * weight2 + rightRgb.a * weight1,
            ].map(Math.round);
            const color = tinycolor({
                r: rgbArray[0],
                g: rgbArray[1],
                b: rgbArray[2],
                a: rgbArray[3]
            });

            return color.toRgbString();
        },
        handleBackgroundMousedown(event) {
            const offset = this.getOffsetByEvent(event);
            const color = this.getColorByOffset(offset);
            const stops = this.getStops();
            const stop = {
                color,
                offset
            };
            this.addStop(stops, stop);
            this.$emit('change-stops', stops);
            this.$emit('change-current-stop', stop, stops.indexOf(stop));
        },
        handleStopMousedown(event, stop, stopIndex) {
            const handleMousemove = event => {
                const stops = this.getStops();
                const stop = stops[this.currentStopIndex];
                stop.offset = Math.min(Math.max(0, this.getOffsetByEvent(event)), 1);
                this.sortStops(stops);
                this.$emit('change-stops', stops);
                this.$emit('change-current-stop', stop, stops.indexOf(stop));
            };
            document.addEventListener('mousemove', handleMousemove);
            document.addEventListener('mouseup', () => {
                this.$emit('change-stops-end', this.getStops());
                document.removeEventListener('mousemove', handleMousemove);
            });

            this.$emit('change-current-stop', stop, stopIndex);
            this.$emit('mousedown-stop', stop);
        },
        initDeleteEvent() {
            this.$refs.container.addEventListener('keydown', this.handleKeydown);
        },
        handleKeydown(e) {
            if(['Delete', 'Backspace'].includes(e.key)) {
                e.stopPropagation();
                const stops = this.getStops();
                this.removeStop(stops, stops[this.currentStopIndex]);

                const currentStopIndex = stops[this.currentStopIndex]
                    ? this.currentStopIndex
                    : this.currentStopIndex - 1;
                this.$emit('change-stops', stops);
                this.$emit('change-current-stop', currentStopIndex);
            }
        },
        destroyDeleteEvent() {
            this.$refs.container.removeEventListener('keydown', this.handleKeydown);
        }
    }
};
</script>

<style lang="less">
.eui-v2-gradient {
    @bar-height: 16px;
    @stop-height: 16px;
    @stop-width: 14px;
    @stop-border-width: 2px;
    @border-color: #dfe3ed;

    position: relative;
    height: @bar-height;
    border-radius: 5px;
    box-sizing: content-box;
    * {
        box-sizing: content-box;
    }
    &-picker:focus {
        outline: none;
    }
    &__background {
        height: 100%;
        border-radius: 4px;
        box-shadow: inset 0px 0px 0px 1px rgba(0,0,0,.06);
    }
    &__stop {
        position: absolute;
        top: -2px;
        width: @stop-width;
        height: @stop-height;
        overflow: hidden;
        border: @stop-border-width solid rgba(255, 255, 255, 1);
        border-radius: 2px;
        cursor: pointer;
        box-shadow:0px 0px 2px rgba(0, 0, 0, 0.35);;
        &__container {
            position: absolute;
            width: calc(~"100% -" @stop-width);
            top: 0;
            height: 100%;
            left: @stop-width / 2;
        }
        &__inner {
            display: inline-block;
            height: 100%;
        }
        &--current {
            position: relative;
            z-index: 1;
            box-shadow:0px 0px 4px 0px rgba(0,0,0,0.2), 0px 0px 0px 1.2px #2254F4;
        }
    }
}

</style>
