<template>
    <ComponentDescGroup>
        <ComponentDescWrap
            title="渐变色颜色选择器"
            desc="提供渐变色的选择器，可自定义渐变色个数、位置、色值"
        >
            <div style="display: flex">
                <GeColorPicker
                    ref="colorRef"
                    :defaultDegree="degree"
                    :defaultGradientColor="defaultGradientColor"
                    :defaultTabs="defaultTabs"
                    @gradientChange="gradientChange"
                    @degreeChange="degreeChange"
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
    name: 'demo-color-picker-2',
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
            defaultTabs: [1],
            degree: 0,
        };
    },
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeColorPicker,
    },
    methods: {
        gradientChange(colors) {
            this.color = `linear-gradient(${this.degree}deg, ${colors.map(
                (step) => `${step.color} ${step.offset * 100}%`,
            )})`;
        },
        degreeChange(degree) {
            this.degree = degree;
            console.log('this.color', this.color);
            this.color = this.color.replace(/[-0-9]+deg/, this.degree + 'deg');
        },
    },
};
</script>

<style lang="less"></style>
