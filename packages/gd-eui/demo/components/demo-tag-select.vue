<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="">
            <div class="demo-tag-select">
                <h4>普通选择：</h4>
                <GeTagSelect :tags="tags" @onTagClick="tagClick"></GeTagSelect>
                <p></p>
                <h4>菜单型选择：</h4>
                <GeTagSelect :tags="tags" v-model="active"></GeTagSelect>
                <p></p>
                <h4>自定义展开按钮：</h4>
                <GeTagSelect :tags="tags">
                    <template #handler="{ isExpand, onHandlerClick }">
                        <button
                            class="ge-tag-select__tag ge-tag-select__tag__handler"
                            @click="onHandlerClick"
                        >
                            <span>{{ isExpand ? '哈收起《' : '嘿展开》' }}</span>
                        </button>
                    </template>
                </GeTagSelect>
            </div>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { ref } from '@vue/composition-api';
import { GeTagSelect, ITagItem } from '../../src';
import '../../src/components/modules/tag-select/style/index';
export default {
    name: 'demo-tag-select',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeTagSelect,
    },
    setup() {
        const tags = ref([
            '中国风',
            '手绘',
            '动物',
            '水墨风',
            '老虎',
            '趣味',
            '简约自然',
            '卡通人物',
            '非常长的标签字数非常的多多到一行纳不下',
        ]);

        const active = ref(0);

        const tagClick = (tag: ITagItem) => {
            alert(tag.text);
        };

        return {
            tags,
            active,
            tagClick,
        };
    },
};
</script>

<style lang="less" scoped>
.demo-tag-select {
    width: 200px;
}
</style>
