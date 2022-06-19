<template>
    <div class="test-slider-list-2">
        <div class="test-slider-list-2__wrap">
            <GeSliderList :list="list" @change="handleChange" />
        </div>
        <!-- <div style="margin-left: 30px" v-for="item in list" :key="item.key">
            <div style="display: flex">
                <div>{{ item.label }}:</div>
                <div>{{ item.value }}</div>
            </div>
        </div> -->
    </div>
</template>

<script>
import { GeSliderList } from '../../../../src';
import '../../../../es/components/modules/slider-list/style';

export default {
    name: 'test-slider-list-2',
    components: {
        GeSliderList,
    },
    data() {
        return {
            list: [
                {
                    label: '',
                    key: '0',
                    value: 12,
                    max: 100,
                },
                {
                    label: '强度',
                    key: '1',
                    value: 12,
                    max: 100,
                },
                {
                    label: '锐度',
                    key: '2',
                    value: 88,
                    max: 100,
                },
            ],
        };
    },
    methods: {
        handleChange(_val, _index, _list) {
            // console.log(_val, _index, _list);
            this.list[_index].value = _val;
        },
    },
};
</script>

<style lang="less">
.test-slider-list-2 {
    display: flex;
    &__wrap {
        background: #f6f7f9;
        width: 244px;
    }
}
</style>
