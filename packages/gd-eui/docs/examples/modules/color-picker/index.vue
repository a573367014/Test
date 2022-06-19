<template>
    <div>
        <div class="wrap">
            <b>纯色：</b>
            <div>描述：选择颜色并触发颜值回调</div>
            <GeColorPicker ref="colorRef" @colorChange="onSingleChange" />
            <div :style="{ color: colorStr }">色值：{{ colorStr }}</div>
            <Button style="margin-top: 8px" @click="btClick">点击设置为蓝色</Button>
        </div>
    </div>
</template>

<script>
import { GeColorPicker } from '../../../../src';
import { hsv2RgbHex } from '../../../utils/index';
import { Button } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/button/style/';
import '../../../../es/components/modules/color-picker/style';

export default {
    name: 'test-color-picker',
    components: {
        GeColorPicker,
        Button,
    },
    data() {
        return {
            color: {
                type: Object,
                default: () => {},
            },
        };
    },
    computed: {
        colorStr() {
            return hsv2RgbHex(this.color);
        },
    },
    methods: {
        onSingleChange(color) {
            this.color = color;
        },
        btClick() {
            this.$refs.colorRef.useColor('rgba(255,255,0,1)');
        },
    },
};
</script>

<style lang="less">
.wrap {
    &__title {
        font-size: 16px;
    }
}
</style>
