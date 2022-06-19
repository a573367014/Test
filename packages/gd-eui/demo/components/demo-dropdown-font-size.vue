<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="常规用法" desc="">
            <h4>普通使用: {{ value1 }}</h4>
            <GeDropdownFontSize v-model="value1" />
            <h4>自定义字号列表</h4>
            <GeDropdownFontSize :fontSizeList="fontSizeList" />
            <h4>最小值 {{ min }}</h4>
            <GeDropdownFontSize :min="min" />
            <h4>最大值 {{ max }}</h4>
            <GeDropdownFontSize :max="max" />
            <h4>多种字号</h4>
            <GeDropdownFontSize :mixed="mixed" />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeDropdownFontSize } from '../../src';
import '../../src/components/modules/dropdown-font-size/style';

export default {
    name: 'demo-dropdown-font-size',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeDropdownFontSize,
    },
    data: function () {
        return {
            value1: 1,
            fontSizeList: [1, 2, 3, 5],
            min: 20,
            max: 40,
            mixed: true,
        };
    },
};
</script>

<style lang="less"></style>
