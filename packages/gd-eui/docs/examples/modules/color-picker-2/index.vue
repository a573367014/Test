<template>
    <div>
        <div class="wrap">
            <b>渐变色：</b>
            <div>描述：选择颜色并触发渐变色回调</div>
            <GeColorPicker
                ref="colorRef2"
                @degreeChange="onDegreeChange"
                @gradientChange="onGradientChange"
            />
            <div>色值：</div>
            <div v-for="(item, index) in colorListStr" :key="index">{{ item }}</div>
            <Button style="margin-top: 8px" @click="btClick">点击设置为红渐变蓝</Button>
            <div>角度：{{ degree }}</div>
        </div>
    </div>
</template>

<script>
import { GeColorPicker } from '../../../../src';
import { Button } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/button/style/';
import '../../../../es/components/modules/color-picker/style';

export default {
    name: 'test-color-picker-2',
    components: {
        GeColorPicker,
        Button,
    },
    data() {
        return {
            gl: [],
            degree: 0,
        };
    },
    computed: {
        colorListStr() {
            const list = this.gl.map(
                (item) =>
                    `h:${item.color.h}  s:${item.color.s}  v:${item.color.v}  a:${item.color.a} \n\r`,
            );
            return list;
        },
    },
    mounted() {
        this.$refs.colorRef2.show([1], 1);
    },
    methods: {
        btClick() {
            this.$refs.colorRef2.useGradient([
                {
                    color: {
                        a: 1,
                        format: 'hsva',
                        h: 0,
                        s: 1,
                        v: 1,
                    },
                    offset: 0,
                },
                {
                    color: {
                        a: 1,
                        format: 'hsva',
                        h: 225,
                        s: 1,
                        v: 1,
                    },
                    offset: 1,
                },
            ]);
        },

        onGradientChange(gl) {
            this.gl = gl;
            console.log(gl);
        },

        onDegreeChange(degree) {
            this.degree = degree;
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
