<template>
    <div class="collage-panel">
        <ColorPicker
            v-if="currentCell"
            v-model="currentCell.backgroundColor"
            :enable-alpha="true"
            format="rgb"
            @change="onBgChange"/>
    </div>
</template>

<script>
import { ColorPicker } from '@/src';

export default {
    props: {
        editor: { type: Object, required: true },
    },
    components: {
        ColorPicker
    },
    computed: {
        currentCell() {
            return this.editor.getCurrentCell();
        }
    },
    methods: {
        onBgChange(val) {
            console.log(val);
        }
    },
};
</script>

<style lang="less" scoped>
</style>
