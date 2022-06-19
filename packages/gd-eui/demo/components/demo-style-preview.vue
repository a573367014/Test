<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="无样式" desc="">
            <GeStylePreview />
        </ComponentDescWrap>
        <ComponentDescWrap title="纯色样式" desc="">
            <GeStylePreview title="纯色样式" preview="red" />
        </ComponentDescWrap>
        <ComponentDescWrap title="渐变色样式" desc="">
            <GeStylePreview
                title="渐变色样式"
                preview="linear-gradient(90deg, rgb(255, 146, 79) 25.39%, rgb(10, 207, 254) 100%)"
            />
        </ComponentDescWrap>
        <ComponentDescWrap title="图片样式" desc="">
            <GeStylePreview
                title="图片样式"
                preview="https://st-gdx.dancf.com/templets/88263/shots/20190329-164301-9Ekzz.png?x-oss-process=image/resize,w_300/interlace,1,image/format,webp"
            />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeStylePreview } from '../../src';
import '../../src/components/modules/style-preview/style';

export default {
    name: 'demo-style-preview',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeStylePreview,
    },
};
</script>

<style lang="less"></style>
