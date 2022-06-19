<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="给slider配置初始值">
            <GeSlider v-model="sliderVal" />
        </ComponentDescWrap>

        <ComponentDescWrap title="配置最大值，最小值" desc="">
            <GeSlider :min="10" :max="20" v-model="sliderVal2" />
        </ComponentDescWrap>

        <ComponentDescWrap title="自定义步数" desc="请注意是步数不是步长">
            <GeSlider :min="-10" :max="120" :step="9" v-model="sliderVal3" />
        </ComponentDescWrap>

        <ComponentDescWrap title="中点模式" desc="">
            <GeSlider :min="-10" :max="120" :middle="30" :middleMode="true" v-model="sliderVal4" />
        </ComponentDescWrap>

        <ComponentDescWrap title="单行标题" desc="">
            <GeSlider
                labelSingleLine
                label="我是标题标题标题，我是个大标题"
                :min="-10"
                :max="120"
                :middle="30"
                :middleMode="true"
                v-model="sliderVal6"
            />
        </ComponentDescWrap>

        <ComponentDescWrap title="单行标题" desc="限制标题宽度">
            <GeSlider
                :labelWidth="60"
                labelSingleLine
                label="我是标题标题标题，我是个大标题"
                :min="-10"
                :max="120"
                :middle="30"
                :middleMode="true"
                v-model="sliderVal6"
            />
        </ComponentDescWrap>

        <ComponentDescWrap title="换行标题" desc="">
            <GeSlider
                :labelSingleLine="false"
                label="我是标题标题标题，我是个大标题"
                :min="-10"
                :max="120"
                :middle="30"
                :middleMode="true"
                v-model="sliderVal7"
            />
        </ComponentDescWrap>

        <ComponentDescWrap title="显示输入框" desc="在数值上显示">
            <GeSlider v-model="sliderVal8" showInput />
        </ComponentDescWrap>

        <ComponentDescWrap title="显示下拉选择" desc="">
            <GeSlider :min="-10" :max="120" v-model="sliderVal9" showSelect />
        </ComponentDescWrap>

        <ComponentDescWrap title="背景的颜色" desc="">
            <GeSlider backgroundColor="red" :min="-10" :max="120" v-model="sliderVal9" showSelect />
        </ComponentDescWrap>

        <ComponentDescWrap title="active轨道的颜色" desc="">
            <GeSlider
                backgroundColor="linear-gradient(90deg, #000000 0%, #B63382 49.52%, #ED259D 105.65%)"
                backgroundActiveColor="linear-gradient(90deg, #FFB800 0%, #41FFA4 26.57%, #0CD3FF 52.86%, #ED1FFF 81.99%, #FF2D2D 105.65%)"
                :min="-10"
                :max="120"
                v-model="sliderVal9"
                showSelect
            />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="js">
import ComponentDescGroup from "../ui/component-desc-group.js";
import ComponentDescWrap from '../ui/component-desc-wrap';
import { GeSlider } from '../../src/index';
import '../../src/components/base/slider/style/';
export default {
    name: 'demo-slider',
    data: () => {
        return {
            sliderVal: 20,
            sliderVal2: 0,
            sliderVal3: 0,
            sliderVal4: 0,
            sliderVal5: 0,
            sliderVal6: 0,
            sliderVal7: 0,
            sliderVal8: 0,
            sliderVal9: 0,
        };
    },
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeSlider,
    },
};
</script>

<style lang="less"></style>
