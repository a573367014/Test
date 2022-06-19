<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="xx">
            <GeXXX />
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeXXX } from '../../src/';
import '../../src/components/ccc/xxx/style/';

export default {
    name: 'demo-xxx',
    components: {
        ComponentDescWrap,
        ComponentDescGroup,
        GeXXX,
    },
};
</script>

<style lang="less"></style>
