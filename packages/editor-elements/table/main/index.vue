<template>
    <section class="editor-table">
        <GridCore :model="element.model" :zoom="editor.zoom" />
    </section>
</template>

<script>
import GridCore from '../table-controller/component/main.vue';

export default {
    components: {
        GridCore,
    },

    props: {
        editor: {
            type: Object,
            default: () => {},
        },
        // 表格依赖的编辑选项
        element: {
            type: Object,
            default: () => ({}),
        },
    },
};
</script>

<style>
.editor-table {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>
