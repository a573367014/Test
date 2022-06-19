<template>
    <div ref="containerRef" class="alpha">
        <div class="alpha__checkboard-wrap">
            <checkboard></checkboard>
        </div>
        <div class="alpha__gradient" :style="{ background: gradientColor }"></div>
        <div
            class="alpha__container"
            ref="container"
            @mousedown.stop="handleMouseDown"
            @touchmove="handleChange"
            @touchstart="handleChange"
        >
            <div class="alpha__pointer" :style="{ left: value.a * 100 + '%' }">
                <div class="alpha__picker">
                    <div class="alpha__picker__center" :style="{ background: pointColor }"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, shallowRef } from '@vue/composition-api';
import Checkboard from './check-board.vue';
import { clamp, on, off } from '../../../utils';
import { IColor } from '../../../types/color-picker';
import tinycolor from 'tinycolor2';
import { Nullable } from '../../../types/common';

export default defineComponent({
    name: 'ge-alpha',
    components: {
        Checkboard,
    },
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
    },
    setup(props, { emit }) {
        const containerRef: Ref<Nullable<HTMLElement>> = shallowRef<Nullable<HTMLElement>>(null);
        const pointColor = computed(() => {
            const hsva = props.value;
            const color = tinycolor.fromRatio({
                h: hsva.h,
                v: hsva.v,
                s: hsva.s,
                a: hsva.a ? hsva.a : 0,
            });
            return color.toHslString();
        });
        const gradientColor = computed(() => {
            const hsv = props.value;
            const color = tinycolor.fromRatio({
                h: hsv.h,
                v: hsv.v,
                s: hsv.s,
            });
            const colorHSL = color.toHsl();
            const hslStr = [colorHSL.h, colorHSL.s * 100 + '%', colorHSL.l * 100 + '%'].join(',');
            return (
                'linear-gradient(to right, hsla(' +
                hslStr +
                ', 0) 0%, hsla(' +
                hslStr +
                ', 1) 100%)'
            );
        });

        const handleChange = (e: Event, skip = false) => {
            !skip && e.preventDefault();
            const containerRefTarget = containerRef.value;
            if (!containerRefTarget) {
                return;
            }
            const containerWidth = containerRefTarget.clientWidth;
            const reactDom = containerRefTarget.getBoundingClientRect();
            const xOffset = reactDom.left + window.pageXOffset;
            const pageX =
                (e as MouseEvent).pageX ||
                ((e as TouchEvent).touches ? (e as TouchEvent).touches[0].pageX : 0);
            const left = clamp(pageX - xOffset, 0, containerWidth);

            let a = 0;
            if (left < 0) {
                a = 0;
            } else if (left > containerWidth) {
                a = 1;
            } else {
                a = Math.round((left * 100) / containerWidth) / 100;
            }

            if (props.value.a !== a) {
                emit('change', {
                    h: props.value.h,
                    s: props.value.s,
                    v: props.value.v,
                    a: a,
                    format: 'hsva',
                });
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
            containerRef,
            gradientColor,
            handleChange,
            handleMouseDown,
        };
    },
});
</script>
