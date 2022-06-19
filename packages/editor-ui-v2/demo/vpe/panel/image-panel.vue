<template>
    <eui-v2-tabs v-model="currentTab">
        <eui-v2-tab v-for="tab in tabs" :key="tab.name" :content="tab.content" :name="tab.name" />
        <div class="image-panel" :class="{multi: isSelector}" slot="panel">
            <ImageNormalPanel :editor="editor" v-if="currentTab === 'normal'"/>
            <ImageFilter :editor="editor" v-if="currentTab === 'filter'"/>
        </div>
    </eui-v2-tabs>
</template>

<script>
import ImageNormalPanel from './image-normal-panel';
import ImageFilter from './image-filter';

export default {
    props: {
        editor: { type: Object, required: true },
        initEffects: { type: Object, require: true }
    },
    components: {
        ImageNormalPanel,
        ImageFilter,
    },
    data() {
        return {
            currentTab: 'normal',
        };
    },
    computed: {
        tabs() {
            const tabs = [{
                name: 'normal',
                content: '图片'
            }];

            !this.isNinePatch && {
                name: 'filter',
                content: '滤镜'
            };

            return tabs;
        },
        isSelector() {
            return this.editor.currentElement.type === '$selector';
        },
        isNinePatch() {
            return this.editor.currentElement.type === 'ninePatch';
        }
    }
};
</script>

<style lang="less" scoped>
.image-panel {
    padding: 24px;
}
</style>
