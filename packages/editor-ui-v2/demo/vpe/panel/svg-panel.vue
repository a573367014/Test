<style lang="less">
    .svg-panel {
        padding: 24px;
    }
</style>

<template>
    <eui-v2-tabs value="svg" float-tab>
        <eui-v2-tab name="svg" content="图形"/>
        <div slot="panel" class="svg-panel">
            <SvgNormalPanel :editor="editor" />
        </div>
    </eui-v2-tabs>
</template>

<script>
import SvgNormalPanel from './svg-normal-panel';

export default {
    components: {
        SvgNormalPanel
    },
    props: {
        editor: {
            type: Object,
            required: true
        }
    }
};
</script>
