<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通状态" desc="hover时显示竖线">
            <GeAsideButton />
        </ComponentDescWrap>
        <ComponentDescWrap title="普通状态" desc="hover时不显示竖线，配置文案">
            <GeAsideButton :showLine="false" label="GD-EUI" />
        </ComponentDescWrap>
        <ComponentDescWrap title="配置icon" desc="">
            <GeAsideButton :showLine="false" label="GD-EUI" type="shutter_outline" />
        </ComponentDescWrap>
        <ComponentDescWrap title="禁用状态" desc="">
            <GeAsideButton :showLine="false" showMask />
        </ComponentDescWrap>
        <ComponentDescWrap title="高亮" desc="hover时高亮显示">
            <GeAsideButton showHover />
        </ComponentDescWrap>
        <ComponentDescWrap title="选中状态" desc="">
            <GeAsideButton showHover activated />
        </ComponentDescWrap>
        <ComponentDescWrap title="显示tip" desc="hover时显示tip">
            <GeAsideButton showHover showTip tipPlacement="right" />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeAsideButton } from '../../src/';
import '../../src/components/modules/aside-button/style';

export default {
    name: 'demo-aside-button',
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeAsideButton,
    },
};
</script>

<style lang="less"></style>
