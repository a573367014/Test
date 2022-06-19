<template>
    <div
        ref="containerRef"
        class="sv-panel"
        @mousedown.stop="handleMouseDown"
        :style="{ background: backgroundColor }"
    >
        <div class="sv-panel__white"></div>
        <div class="sv-panel__black"></div>
        <div class="sv-panel__pointer" :style="{ top: pointerTop, left: pointerLeft }">
            <div class="sv-panel__circle"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, shallowRef } from '@vue/composition-api';
import { clamp, on, off } from '../../../utils';
import { IColor } from '../../../types/color-picker';
import { Nullable } from '../../../types/common';
import { throttle } from 'lodash';

export default defineComponent({
    name: 'ge-sv-panel',
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
        const pointerTop = computed(() => {
            return -(props.value.v * 100) + 1 + 100 + '%';
        });
        const pointerLeft = computed(() => {
            return props.value.s * 100 + '%';
        });
        const backgroundColor = computed(() => {
            return `hsl(${props.value.h}, 100%, 50%)`;
        });
        const throttleFn = throttle(
            (fn, data) => {
                fn(data);
            },
            20,
            { leading: true, trailing: false },
        );

        const handleChange = (ev: Event) => {
            ev.preventDefault();
            throttleFn((ev: Event) => {
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
                    (ev as MouseEvent).pageX ||
                    ((ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].pageX : 0);
                const pageY =
                    (ev as MouseEvent).pageY ||
                    ((ev as TouchEvent).touches ? (ev as TouchEvent).touches[0].pageY : 0);

                const left = clamp(pageX - xOffset, 0, containerWidth);
                const top = clamp(pageY - yOffset, 0, containerHeight);
                const saturation = left / containerWidth;
                const bright = clamp(-(top / containerHeight) + 1, 0, 1);
                emit('change', {
                    h: props.value.h,
                    s: saturation,
                    v: bright,
                    a: props.value.a,
                    format: 'hsva',
                });
            }, ev);
        };
        const handleMouseUp = () => {
            off(window, 'mousemove', handleChange);
            off(window, 'mouseup', handleChange);
            off(window, 'mouseup', handleMouseUp);
        };
        const handleMouseDown = () => {
            on(window, 'mousemove', handleChange);
            on(window, 'mouseup', handleChange);
            on(window, 'mouseup', handleMouseUp);
        };
        return {
            pointerTop,
            pointerLeft,
            backgroundColor,
            handleMouseDown,
            handleChange,
            containerRef,
        };
    },
});
</script>
