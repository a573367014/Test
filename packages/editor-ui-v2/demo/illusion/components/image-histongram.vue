<template>
    <div class="image-histogram"><canvas ref="canvas"></canvas></div>
</template>

<script>
import Histrogram from '../lib/histogram';

export default {
    props: {
    },

    mounted() {
        const canvas = this.$refs.canvas;
        const image = new Image();
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');

        const instance = new Histrogram(c);

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0, image.width, image.height);
            instance.update(canvas);
        };
        image.crossOrigin = 'Anonymous';
        image.src = 'https://st0.dancf.com/csc/32/topics/2242/20190414-172225-0ee5.png';

        // histogram(, (err, data) => {
        //     console.log(data);
        // });
    }
};
</script>

<style scoped lang="less">
.image-histogram {
    position: fixed;
    top: 58px;
    left: 0;
    width: 512;
    height: auto;
}
</style>
