<style lang="less">

</style>

<template>
    <ColorPicker
        v-bind="$attrs"
        :show-straw="enableStraw"
        :editor="editor"
        :straw-activated="strawActivated"
        @click-straw="clickStraw"
        v-on="$listeners"/>
</template>

<script>
import ColorPicker from '../../components/color-picker';
import strawMixin from '../../utils/editor-straw-mixin';

export default {
    components: { ColorPicker },
    mixins: [strawMixin],
    props: {
        editor: {
            type: Object,
            required: true
        },
        enableStraw: {
            type: Boolean,
            default: false
        }
    }
};
</script>
