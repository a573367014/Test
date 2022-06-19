<template>
    <ComponentDescGroup>
        <ComponentDescWrap
            title="纯色颜色选择器"
            desc="提供最简单的颜色选择，支持画板、slider、alpha、样式列表，配置初始颜色"
        >
            <div style="display: flex">
                <GeColorPicker
                    ref="colorRef"
                    :defaultColor="defaultColor"
                    @colorChange="onSingleChange"
                />
                <div
                    :style="{
                        width: '50px',
                        height: '50px',
                        backgroundColor: color,
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
    name: 'demo-color-picker-1',
    data() {
        return {
            color: '#00ff00',
            defaultColor: '#00ff00',
        };
    },
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeColorPicker,
    },
    methods: {
        onSingleChange(color) {
            this.color = color;
        },
    },
};
</script>

<style lang="less"></style>
