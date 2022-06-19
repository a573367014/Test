<template>
    <div class="inputPopover-demo">
        <ge-popover-input
            @setSearchValue="setSearchValue"
            @clearHistoryWord="handleClear"
            :visible="true"
            :hotWordList="['春风', '节日', '立冬', '晚风']"
            popupContainerClass=".inputPopover-demo"
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
    </div>
</template>

<script>
import { GePopoverInput } from '../../../../src';
import { Input } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/input/style/';
import '../../../../es/components/modules/popover-input/style';

export default {
    name: 'test-popover-input',
    components: {
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

<style lang="less">
.inputPopover-demo {
    position: relative;
    width: 240px;
}
</style>
