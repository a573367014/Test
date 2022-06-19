<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="">
            <GeLayoutRatioPopover :value="value" @change="change">
                <h4>{{ valueTitle }}</h4>
            </GeLayoutRatioPopover>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeLayoutRatioPopover } from '../../src';
import '../../src/components/modules/layout-ratio-popover/style';

export default {
    name: 'demo-layout-ratio-popover',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeLayoutRatioPopover,
    },
    data: function () {
        return {
            value: 0,
        };
    },
    computed: {
        valueTitle() {
            const TypeTitleMap = {
                0: '默认比例',
                1: '9:16',
                2: '3:4',
                3: '1:1',
                4: '4:3',
                5: '16:9',
            };
            return TypeTitleMap[(this as any).value];
        },
    },
    methods: {
        change(value) {
            this.value = value;
        },
    },
};
</script>

<style lang="less"></style>
