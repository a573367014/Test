<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="">
            <h4>渐变色样式</h4>
            <GeStyleBackground
                :degree="degree"
                :value="value"
                @change="handleChange"
                :title="title"
            />
            <h4>单色样式</h4>
            <GeStyleBackground :value="color" @change="handleColorChange" :title="'测试'" />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeStyleBackground, IGradientColor } from '../../src/index';
import '../../src/components/modules/style-background/style/index';

export default {
    name: 'demo-style-background',
    data: function () {
        return {
            value: [
                { color: '#001122', offset: 0.1 },
                { color: 'rgba(255, 0, 0, 0.4)', offset: 0.8 },
            ] as IGradientColor[],
            title: '渐变',
            degree: 120,
            color: '#ff0000',
        };
    },
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeStyleBackground,
    },
    methods: {
        handleChange(value: IGradientColor[], degree: number) {
            (this as any).value = value;
            this.degree = degree;
            console.log(degree);
        },
        handleColorChange(value: string, degree: number) {
            (this as any).color = value;
            console.log(degree);
        },
    },
};
</script>

<style lang="less"></style>
