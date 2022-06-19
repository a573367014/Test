<template>
    <div>
        <color-picker-panel
            :value="color"
            :show-straw="true"
            :enableAlpha="!threeMode"
            format="hex8"
            :cmykMode="cmykMode"
            :showStraw="showStraw"
            @input="handleColorInput"
            @click-straw="handleStrawClick"
            :enablePalette="enablePalette"
        ></color-picker-panel>
    </div>
</template>
<script>
import ColorPickerPanel from '../../base/color-picker-panel/index.vue';
import { defaultColorPreset } from './const';

export default {
    name: 'eui-v2-pure-color-picker',
    components: {
        ColorPickerPanel,
    },
    props: {
        enablePalette: {
            type: Boolean,
            default: true,
        },
        color: {
            type: String,
            default: defaultColorPreset.list[0],
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        threeMode: {
            type: Boolean,
            default: false,
        },
        showStraw: {
            type: Boolean,
            default: true,
        },
    },
    methods: {
        handleColorInput(color) {
            this.$emit('change', color);
        },
        handleStrawClick(e) {
            this.$emit('open-straw', e);
        },
    },
};
</script>
