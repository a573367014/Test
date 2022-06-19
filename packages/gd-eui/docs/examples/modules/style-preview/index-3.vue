<template>
    <div>
        <GeStylePreview :preview="preview" :title="title" />
    </div>
</template>

<script>
import { GeStylePreview } from '../../../../src';
import '../../../../es/components/modules/style-preview/style';

export default {
    name: 'test-style-preview-3',
    components: {
        GeStylePreview,
    },
    data() {
        return {
            preview:
                'https://st-gdx.dancf.com/templets/88263/shots/20190329-164301-9Ekzz.png?x-oss-process=image/resize,w_300/interlace,1,image/format,webp',
            title: '添加样式',
        };
    },
};
</script>
