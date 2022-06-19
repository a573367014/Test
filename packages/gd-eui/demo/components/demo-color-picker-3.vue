<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="纯色与渐变色：" desc="提供纯色、渐变色的选择器">
            <div style="display: flex">
                <GeColorPicker
                    ref="colorRef"
                    :defaultDegree="degree"
                    :defaultGradientColor="defaultGradientColor"
                    :defaultTabs="defaultTabs"
                    @gradientChange="gradientChange"
                    @degreeChange="degreeChange"
                    @colorChange="colorChange"
                />
                <div
                    :style="{
                        width: '50px',
                        height: '50px',
                        background: color,
                    }"
                ></div>
            </div>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeColorPicker } from '../../src/';
import '../../src/components/modules/color-picker/style';

export default {
    name: 'demo-color-picker-3',
    data() {
        return {
            color: 'linear-gradient(0deg, rgb(25, 205, 25) 0%,#ff0000 100%)',
            defaultGradientColor: [
                { color: '#00ff00', offset: 0 },
                {
                    color: '#ff0000',
                    offset: 1,
                },
            ],
            defaultTabs: [0, 1],
            degree: 0,
        };
    },
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeColorPicker,
    },
    methods: {
        colorChange(color) {
            this.color = color;
        },
        gradientChange(colors) {
            this.color = `linear-gradient(${this.degree}deg, ${colors.map(
                (step) => `${step.color} ${step.offset * 100}%`,
            )})`;
        },
        degreeChange(degree) {
            this.degree = degree;
            if (/[-0-9]+deg/.test(this.color)) {
                this.color = this.color.replace(/[-0-9]+deg/, this.degree + 'deg');
            }
        },
    },
};
</script>

<style lang="less"></style>
