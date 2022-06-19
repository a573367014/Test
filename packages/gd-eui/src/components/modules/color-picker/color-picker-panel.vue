<template>
    <div class="color-panel">
        <s-v-panel class="color-panel__sv" :value="color" @change="handleColorChange" />
        <hue class="color-panel__hue" :value="color" @change="handleColorChange" />
        <alpha class="color-panel__alpha" :value="color" @change="handleColorChange" />
        <color-input class="color-panel__color_input" :value="color" @change="handleColorChange" />
        <div class="color-panel__line"></div>
        <div class="color-panel__swatches">
            <swatches-list @select="handleSwatchesSelect" :list="swatchesList" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import SVPanel from './sv-panel.vue';
import Hue from './hue.vue';
import Alpha from './alpha.vue';
import ColorInput from './color-input.vue';
import SwatchesList from './swatches-list.vue';
import tinycolor from 'tinycolor2';
import { IColor } from '../../../types/color-picker';
import { ISwatches } from '../../../types/swatches-list';

/**
 * 纯色颜色选择器
 *
 * value(v-model)
 * swatchesList
 *
 * change
 */
export default defineComponent({
    name: 'ge-color-pick-panel',
    components: {
        SVPanel,
        Hue,
        Alpha,
        ColorInput,
        SwatchesList,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        swatchesList: {
            type: Array as PropType<Array<ISwatches>>,
            default: () => [],
        },
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
        const color = ref(props.value);
        const handleSwatchesSelect = (selectColor: string) => {
            const tycolor = tinycolor(selectColor);
            const hsva = tycolor.toHsv();
            const colorItem: IColor = {
                h: hsva.h,
                s: hsva.s,
                v: hsva.v,
                a: hsva.a,
                format: 'hsva',
            };
            emit('change', colorItem);
            color.value = colorItem;
        };
        watch(
            () => props.value,
            (changeColor) => {
                color.value = { ...changeColor };
            },
        );
        const handleColorChange = (changeColor: IColor) => {
            emit('change', { ...changeColor });
            color.value = { ...changeColor };
        };
        return {
            color,
            handleSwatchesSelect,
            handleColorChange,
        };
    },
});
</script>
