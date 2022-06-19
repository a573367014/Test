<template>
    <div class="background-panel">
        <EditorBackground
            :editor="editor"
            :pick-image="uploadImage" />
    </div>
</template>

<script>
import { EditorBackground } from '@/src';
export default {
    props: {
        editor: { type: Object, required: true },
    },
    components: {
        EditorBackground
    },
    methods: {
        uploadImage(file) {
            return new Promise(resolve => {
                const image = new Image();
                const url = URL.createObjectURL(file);
                image.onload = () => {
                    resolve({
                        url: url,
                        width: image.width,
                        height: image.height
                    });
                };
                image.src = url;
            });
        }
    }
};
</script>

<style lang="less" scoped>

</style>
