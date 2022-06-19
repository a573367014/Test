<template>
    <div>
        <div class="wrap">
            <b>纯色与渐变色：</b>
            <div>描述：选择颜色并触发回调</div>
            <GeColorPicker
                ref="colorRef2"
                :swatchesList="swatchesList"
                @colorChange="onColorChange"
                @degreeChange="onDegreeChange"
                @gradientChange="onGradientChange"
            />
            <div :style="{ color: colorStr }">纯色值：{{ colorStr }}</div>
            <Button style="margin-top: 8px" @click="btColorClick">点击设置为蓝色</Button>
            <div>渐变色值：</div>
            <div v-for="(item, index) in colorListStr" :key="index">{{ item }}</div>
            <Button style="margin-top: 8px" @click="btClick">点击设置为红渐变蓝</Button>
            <div>角度：{{ degree }}</div>
        </div>

        <div class="wrap">
            <b>默认配置：</b>
            <div>描述：使用属性值配置默认配置</div>
            <GeColorPicker
                :defaultColor="pickerColor"
                :defaultTabs="[0, 1]"
                @colorChange="onColorChange2"
            />
        </div>
    </div>
</template>

<script>
import { GeColorPicker } from '../../../../src';
import { Button } from '@gaoding/gd-antd';
import { hsv2RgbHex } from '../../../../src/utils/index';
import '@gaoding/gd-antd/es/button/style/';
import '../../../../es/components/modules/color-picker/style';

export default {
    name: 'test-color-picker-3',
    components: {
        GeColorPicker,
        Button,
    },
    data() {
        return {
            gl: [],
            degree: 0,
            color: {},
            swatchesList: [
                {
                    title: '默认',
                    list: ['#122BCC', '#636C78', '#FF0128'],
                },
            ],
            pickerColor: {
                h: 122,
                s: 0,
                v: 0,
                a: 1,
                format: 'hsva',
            },
        };
    },
    computed: {
        colorStr() {
            return hsv2RgbHex(this.color);
        },
        colorListStr() {
            const list = this.gl.map(
                (item) =>
                    `h:${item.color.h}  s:${item.color.s}  v:${item.color.v}  a:${item.color.a} \n\r`,
            );
            return list;
        },
    },
    mounted() {
        this.$refs.colorRef2.show([0, 1], 1);

        // this.pickerColor = {
        //     h: 222,
        //     s: 0,
        //     v: 0,
        //     a: 1,
        //     format: 'hsva',
        // };
    },
    methods: {
        onColorChange2(color) {
            this.pickerColor = color;
        },

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

        btColorClick() {
            this.$refs.colorRef2.useColor({
                a: 1,
                h: 244,
                s: 1,
                v: 1,
            });
        },

        onColorChange(color) {
            this.color = color;
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
