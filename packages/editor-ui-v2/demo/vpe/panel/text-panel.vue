<template>
    <div >
        <eui-v2-tabs v-model="currentTab" float-tab>
            <eui-v2-tab v-for="tab in tabs" :key="tab.name" :content="tab.content" :name="tab.name"/>
            <div slot="panel" class="text-panel" v-if="currentTab === 'normal'">
                <TextNormalPanel :editor="editor"/>
            </div>
        </eui-v2-tabs>


    </div>
</template>

<script>
import TextNormalPanel from './text-normal-panel';

export default {
    components: {
        TextNormalPanel
    },
    props: {
        editor: { type: Object, required: true },
    },
    data() {
        return {
            currentTab: 'normal',
            tabs: [{
                content: '文字',
                name: 'normal',
            }, {
                content: '样式',
                name: 'threeText',
            }]
        };
    }
};
</script>

<style lang="less">
    .text-panel {
        padding: 24px;
    }
</style>
