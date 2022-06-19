<template>
    <div class="eui-v2-effect-preview">
        <canvas ref="previewImgRef" />
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref, onMounted } from '@vue/composition-api';
import type { IImageElement } from '@gaoding/editor-utils/types/image';
import { useDrawEffect } from './use-draw-effect';

export default defineComponent({
    props: {
        editor: { type: Object, required: true },
    },
    setup(props) {
        const previewImgRef = ref<HTMLCanvasElement | null>(null);
        const element = computed(() => {
            const { currentSubElement, currentElement } = props.editor || {};
            return (currentSubElement || currentElement) as IImageElement;
        });
        const drawEffect = useDrawEffect(element, previewImgRef);

        onMounted(drawEffect);
        watch(
            () => {
                return [element.value.imageEffects, element.value.shadows];
            },
            drawEffect,
            {
                deep: true,
            },
        );

        return { element, previewImgRef };
    },
});
</script>

<style lang="less">
.eui-v2-effect-preview {
    position: relative;
    height: 44px;
    width: 44px;
    overflow: hidden;

    canvas {
        position: absolute;
        left: 11px;
        top: 13px;
    }
}
</style>
