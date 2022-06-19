<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="">
            <div class="demo-toggle-tabs-bar">
                <h4>多个tab</h4>
                <GeToggleTabsBar :tabs="tabs" :value="value" @change="change" />
                <h4>单个tab</h4>
                <GeToggleTabsBar
                    :tabs="[
                        {
                            label: '标题一',
                            value: '1',
                        },
                    ]"
                    :value="'1'"
                />
                <h4>带下拉的tab</h4>
                <GeToggleTabsBar
                    :tabs="tabs2"
                    :value="value2"
                    @change="changeTest2"
                    @changeTabDropdownValue="handleChangeTabDropdownValue"
                />
            </div>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeToggleTabsBar } from '../../src';
import '../../src/components/modules/toggle-tabs-bar/style';

export default {
    name: 'demo-toggle-tabs-bar',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeToggleTabsBar,
    },
    data: function () {
        return {
            tabs: [
                { label: '标题一', value: '1' },
                {
                    label: '标题二',
                    value: '2',
                },
            ],
            value: '1',
            tabs2: [
                {
                    label: '全部',
                    value: '1',
                    tabDropdownList: ['全部', '中文', '英文'],
                    tabDropdownValue: '全部',
                },
                {
                    label: '标题二',
                    value: '2',
                },
                {
                    label: '我的',
                    value: '3',
                    tabDropdownList: ['我的', '品牌', '企业'],
                    tabDropdownValue: '品牌',
                },
            ],
            value2: '1',
        };
    },
    methods: {
        change(_item, _index) {
            this.value = _item.value;
        },
        handleChangeTabDropdownValue(value, tabIndex) {
            this.tabs2[tabIndex].label = value;
            this.tabs2[tabIndex].tabDropdownValue = value;
        },
        changeTest2(_item) {
            this.value2 = _item.value;
        },
    },
};
</script>

<style lang="less">
.demo-toggle-tabs-bar {
    width: 300px;
}
</style>
