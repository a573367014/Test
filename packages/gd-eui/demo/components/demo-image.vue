<template>
    <div class="demo-image" ref="demoImage" style="height: 300px; overflow: scroll">
        <GeImage
            :overlayClassName="['imageOverlay', 'sdsds', '232322']"
            :getPopupContainer="() => $refs.demoImage"
            :width="59"
            :height="59"
            :showCheckInput="true"
            :showCheck="true"
            :checked="checked"
            @checkChange="checkChange"
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/0/053c36b5-9b95-4c06-8019-de41d402bd0f1315.jpg?x-oss-process=image/format,webp"
        >
            <template slot="popoverContent">22222</template>
            <template slot="bottom_left_corner">22222</template>
            <template slot="top_left_corner">22222</template>
            <template slot="bottom_right_corner">bottom_right_corner</template>
        </GeImage>
        <GeImage :showMore="false" src="">
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/2434/baf82221-f554-4f35-938d-5b846ad858cd24162.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/2434/baf82221-f554-4f35-938d-5b846ad858cd24162.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/2434/baf82221-f554-4f35-938d-5b846ad858cd24162.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/2434/baf82221-f554-4f35-938d-5b846ad858cd24162.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems-fat.my-static.dancf.com/saas/xi19e5/2434/baf82221-f554-4f35-938d-5b846ad858cd24162.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
        <GeImage
            src="https://gd-filems.dancf.com/saas/cms/0/90cbdd9f-47db-45f9-9b60-d51c4c159ba79143.jpg"
        >
            <template slot="popoverContent">22222</template>
        </GeImage>
    </div>
</template>

<script>
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeImage } from '../../src';
import '../../src/components/modules/image/style';
export default {
    components: {
        GeImage,
        ComponentDescGroup,
        ComponentDescWrap,
    },
    data() {
        return {
            checked: false,
        };
    },
    methods: {
        checkChange(e) {
            console.log(e);
            this.checked = e.target.checked;
        },
    },
};
</script>

<style>
.imageOverlay {
    width: 64px;
    height: 64px;
    border-radius: 8px;
}
</style>
