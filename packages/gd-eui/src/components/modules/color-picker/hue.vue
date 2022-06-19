<template>
    <div ref="containerRef" :class="['hue', directionClass]">
        <div
            class="hue__container"
            role="slider"
            :aria-valuenow="value.h"
            aria-valuemin="0"
            aria-valuemax="360"
            ref="container"
            @mousedown.stop="handleMouseDown"
            @touchmove="handleChange"
            @touchstart="handleChange"
        >
            <div
                class="hue__pointer"
                :style="{ top: pointerTop, left: pointerLeft }"
                role="presentation"
            >
                <div class="hue__picker">
                    <div class="hue__picker__center" :style="{ background: pointColor }"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, shallowRef } from '@vue/composition-api';
import { Direction, IColor } from '../../../types/color-picker';
import { Nullable } from '../../../types/common';
import { clamp, on, off } from '../../../utils';

export default defineComponent({
    name: 'ge-hue',
    components: {},
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: {
            type: Object as PropType<IColor>,
            default: () => {
                return {
                    h: 0,
                    s: 0,
                    v: 0,
                    a: 1,
                    format: 'hsva',
                };
            },
        },
        direction: {
            type: String as PropType<Direction>,
            default: Direction.HORIZONTAL,
        },
    },
    setup(props, { emit }) {
        const containerRef: Ref<Nullable<HTMLElement>> = shallowRef<Nullable<HTMLElement>>(null);
        const pointColor = computed(() => {
            return `hsl(${props.value.h}, 100%, 50%)`;
        });
        const directionClass = computed(() => {
            return {
                hue__horizontal: props.direction === Direction.HORIZONTAL,
                hue__vertical: props.direction === Direction.VERTICAL,
            };
        });
        const pointerTop = computed(() => {
            if (props.direction === Direction.VERTICAL) {
                return -((props.value.h * 100) / 360) + 100 + '%';
            } else {
                return 0 + '%';
            }
        });
        const pointerLeft = computed(() => {
            if (props.direction === Direction.VERTICAL) {
                return 0 + '%';
            } else {
                return (props.value.h * 100) / 360 + '%';
            }
        });
        const handleChange = (e: Event, skip = false) => {
            !skip && e.preventDefault();
            const containerRefTarget = containerRef.value;
            if (!containerRefTarget) {
                return;
            }
            const containerWidth = containerRefTarget.clientWidth;
            const containerHeight = containerRefTarget.clientHeight;
            const reactDom = containerRefTarget.getBoundingClientRect();
            const xOffset = reactDom.left + window.pageXOffset;
            const yOffset = reactDom.top + window.pageYOffset;
            const pageX =
                (e as MouseEvent).pageX ||
                ((e as TouchEvent).touches ? (e as TouchEvent).touches[0].pageX : 0);
            const pageY =
                (e as MouseEvent).pageY ||
                ((e as TouchEvent).touches ? (e as TouchEvent).touches[0].pageY : 0);

            const left = clamp(pageX - xOffset, 0, containerWidth);
            const top = clamp(pageY - yOffset, 0, containerHeight);

            let h = 0;
            let percent = 0;

            if (props.direction === 'vertical') {
                if (top < 0) {
                    h = 360;
                } else if (top > containerHeight) {
                    h = 0;
                } else {
                    percent = -((top * 100) / containerHeight) + 100;
                    h = (360 * percent) / 100;
                }

                if (props.value.h !== h) {
                    emit('change', {
                        h: h,
                        s: props.value.s,
                        v: props.value.v,
                        a: props.value.a,
                        format: 'hsva',
                    });
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
                if (props.value.h !== h) {
                    emit('change', {
                        h: h,
                        s: props.value.s,
                        v: props.value.v,
                        a: props.value.a,
                        format: 'hsva',
                    });
                }
            }
        };
        const handleMouseDown = (e: Event) => {
            handleChange(e, true);
            on(window, 'mousemove', handleChange);
            on(window, 'mouseup', unbindEventListeners);
        };
        const unbindEventListeners = () => {
            off(window, 'mousemove', handleChange);
            off(window, 'mouseup', unbindEventListeners);
        };
        return {
            pointColor,
            pointerTop,
            pointerLeft,
            containerRef,
            directionClass,
            handleMouseDown,
            handleChange,
        };
    },
});
</script>
