<template>
    <div>
        <GeStylePreview :title="title" />
    </div>
</template>

<script>
import { GeStylePreview } from '../../../../src';
import '../../../../es/components/modules/style-preview/style';

export default {
    name: 'test-style-preview-1',
    components: {
        GeStylePreview,
    },
    data() {
        return {
            preview: '',
            title: '添加样式',
        };
    },
};
</script>
