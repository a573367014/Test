<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="配置热词">
            <ge-popover-input
                @setSearchValue="setSearchValue"
                @clearHistoryWord="handleClear"
                :visible="false"
                :hotWordList="['春风', '节日', '立冬', '晚风']"
                :historySearchList="historySearchList"
            >
                <g-input
                    slot="inputSlot"
                    v-model="inputValue"
                    @pressEnter="handlePressEnter"
                    allowClear
                >
                    <ge-icon slot="prefix" type="search" />
                </g-input>
            </ge-popover-input>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script>
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap';
import { GePopoverInput } from '../../src';
import { Input } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/input/style/';
import '../../src/components/modules/popover-input/style/index';

export default {
    name: 'demo-popover-input',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GePopoverInput,
        GInput: Input,
    },
    data() {
        return {
            historySearchList: [],
            inputValue: null,
        };
    },
    methods: {
        setSearchValue(val) {
            this.inputValue = val;
        },
        handleClear() {
            this.historySearchList = [];
        },
        handlePressEnter(e) {
            if (!this.historySearchList.includes(e.target.value)) {
                this.historySearchList.push(e.target.value);
            }
        },
    },
};
</script>

<style lang="less"></style>
