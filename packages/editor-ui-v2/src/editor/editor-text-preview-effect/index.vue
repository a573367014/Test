<template>
    <div
        class="eui-v2-effect-preview"
        :style="{
            fontSize: `${textSize}px`,
        }"
    >
        <p class="eui-v2-effect-preview-text" :style="{ color: element ? element.color : '' }">
            <template v-if="styles.length > 0">
                <span
                    class="eui-v2-effect-preview-span"
                    v-for="(style, index) in styles"
                    :key="index"
                    :style="style"
                >
                    A
                </span>
            </template>
            <span v-else class="eui-v2-effect-preview-span">A</span>
        </p>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { TextEffectEngine } from '@gaoding/editor-utils/effect/browser/text-effect-engine';
import type { ITextElement } from '@gaoding/editor-utils/types/text';

export default defineComponent({
    props: {
        editor: { type: Object, required: true },
        textSize: { type: Number, default: 20 },
    },
    setup(props) {
        const element = computed(() => {
            const { currentSubElement, currentElement } = props.editor || {};
            return (currentSubElement || currentElement) as ITextElement;
        });
        const styles = computed(() => {
            const ratio = props.textSize / element.value.fontSize;

            return TextEffectEngine.draw(element.value, ratio);
        });

        return { element, styles };
    },
});
</script>

<style lang="less">
.eui-v2-effect-preview {
    position: relative;
    display: flex;
    height: 44px;
    width: 44px;
    overflow: hidden;
    justify-content: center;
    align-items: center;

    &-text {
        position: relative;
        font-family: sans-serif;
        user-select: none;
        display: inline-block;
        font-weight: bold;
    }

    &-span {
        left: 0;
        position: absolute;

        &:first-child {
            position: relative;
        }
    }
}
</style>
