<template>
    <div>
        <ColorPicker @colorChange="colorChange" />
    </div>
</template>

<script>
import ColorPicker from '../../src/components/modules/color-picker';
// import { generate } from 'preprocess-to-css-variable/es';
import "../../es/style/index";

export default {
    name: 'custom-theme',
    components: {
        ColorPicker,
    },
    methods: {
        colorChange(color) {
            // generate({
            //     color: {
            //         primary: color,
            //     },
            // });
        },
    },
};
</script>

<style></style>
