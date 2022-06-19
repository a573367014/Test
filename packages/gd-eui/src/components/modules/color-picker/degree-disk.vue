<template>
    <div
        ref="panRef"
        class="degree-disk"
        :style="{ width: `${size}px`, height: `${size}px` }"
        @mousedown.stop="handleMousedown"
    >
        <div class="degree-disk__control" :style="rotateStyle">
            <span class="degree-disk__pointer" ref="pointer" />
        </div>
    </div>
</template>

<script lang="ts">
import { Nullable } from '../../../types/common';
import { computed, defineComponent, ref, Ref, shallowRef } from '@vue/composition-api';

export default defineComponent({
    name: 'ge-degree-disk',
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: {
            type: Number,
            default: 0,
        },
        size: {
            type: Number,
            default: 48,
        },
    },
    setup(props, { emit }) {
        const panRef: Ref<Nullable<HTMLElement>> = shallowRef<Nullable<HTMLElement>>(null);
        const stepUnit: Ref<number> = ref(1);
        const offsetToDegree = (x: number, y: number) => {
            const target = panRef?.value;
            if (!target) {
                return 0;
            }
            const panRect = target.getBoundingClientRect();
            const cx = panRect.width / 2;
            const cy = panRect.width / 2;
            const degree = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
            const unit = stepUnit.value;
            return Math.floor(degree / unit) * unit;
        };
        const sticky = (degree: number) => {
            const tolerance = 5;
            const step = 90;
            const min = -180;
            const max = 180;
            for (let i = min; i < max; i += step) {
                if (degree > i - tolerance && degree < i + tolerance) {
                    return i;
                }
            }
            return degree;
        };
        const handleMousedown = (event: MouseEvent) => {
            // event.offsetX || event.layoutX
            const diskX = event.pageX - event.offsetX;
            const diskY = event.pageY - event.offsetY;

            const handleMousemove = (event: MouseEvent) => {
                const offsetX = event.pageX - diskX;
                const offsetY = event.pageY - diskY;
                const degree = offsetToDegree(offsetX, offsetY);
                emit('change', sticky(degree));
            };
            handleMousemove(event);
            const removeListener = () => {
                document.removeEventListener('mousemove', handleMousemove);
                document.removeEventListener('mouseup', removeListener);
            };
            document.addEventListener('mousemove', handleMousemove);
            document.addEventListener('mouseup', removeListener);
        };
        const rotateStyle = computed(() => {
            const { value } = props;
            return {
                transform: `rotate(${-value}deg)`,
            };
        });
        return {
            panRef,
            rotateStyle,
            handleMousedown,
        };
    },
});
</script>
