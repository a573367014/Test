<template>
    <div>
        <h5>简单使用</h5>
        <ge-image
            src="https://st0.dancf.com/gaodingx/208/design/20210304-131403-2e29.png"
            lowerRightCornerUrl="https://gd-filems.dancf.com/mcm79j/mcm79j/66658/a14c5602-88d3-4b2e-8439-a08cf8fdaffa259730.png"
        >
            <template slot="popoverContent">蓝天热气球彩色多彩缤纷图片摄影手机壁纸</template>
        </ge-image>
        <h5>可选态</h5>
        <ge-image
            showCheck
            @checkChange="onChange"
            :checked="checked"
            src="https://st0.dancf.com/gaodingx/208/design/20210304-131403-2e29.png"
            lowerRightCornerUrl="https://gd-filems.dancf.com/mcm79j/mcm79j/66658/a14c5602-88d3-4b2e-8439-a08cf8fdaffa259730.png"
        >
            <template slot="popoverContent">蓝天热气球彩色多彩缤纷图片摄影手机壁纸</template>
        </ge-image>

        <h5 style="margin-top: 5px">上传中...</h5>
        <ge-image uploadStatus="compressing" :uploadPercent="30"></ge-image>
        <h5 style="margin-top: 5px">失败态</h5>
        <ge-image
            uploadStatus="error"
            @delete="onDelete"
            @retryUpload="onRetryUpload"
            :uploadPercent="30"
        ></ge-image>
    </div>
</template>

<script>
import { GeImage } from '../../../../src';
import '../../../../es/components/modules/image/style';

export default {
    name: 'test-image',
    components: {
        GeImage,
    },
    data() {
        return {
            checked: false,
        };
    },
    methods: {
        onChange(e) {
            console.log('onChange', e);
            this.checked = e.target.checked;
        },
        onDelete() {
            console.log('onDelete');
        },
        onRetryUpload() {
            console.log('onRetryUpload');
        },
    },
};
</script>
