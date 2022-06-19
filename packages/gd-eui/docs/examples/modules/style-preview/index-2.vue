<template>
    <div class="wrap">
        <GeStylePreview :preview="preview" :title="title" />
        <GeStylePreview :preview="preview2" :title="title2" />
    </div>
</template>

<script>
import { GeStylePreview } from '../../../../src';
import '../../../../es/components/modules/style-preview/style';

export default {
    name: 'test-style-preview-2',
    components: {
        GeStylePreview,
    },
    data() {
        return {
            preview: 'red',
            title: '纯色样式',
            preview2: 'linear-gradient(90deg, rgb(255, 146, 79) 25.39%, rgb(10, 207, 254) 100%)',
            title2: '渐变色样式',
        };
    },
};
</script>

<style lang="less" scoped>
.wrap {
    display: flex;
    justify-content: space-around;
}
</style>
