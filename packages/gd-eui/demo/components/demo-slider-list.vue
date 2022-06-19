<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="单个slider" desc="">
            <div class="slider-list-wrap">
                <GeSliderList @change="handleChange" :list="list" />
            </div>
        </ComponentDescWrap>

        <ComponentDescWrap title="多个slider" desc="单个滑杆、带字描述、不带字描述">
            <div class="slider-list-wrap">
                <GeSliderList @change="handleChange2" :list="list2" />
            </div>
        </ComponentDescWrap>

        <ComponentDescWrap title="多个slider，带步数" desc="">
            <div class="slider-list-wrap">
                <GeSliderList @change="handleChange3" :list="list3" />
            </div>
        </ComponentDescWrap>

        <ComponentDescWrap title="多个slider，设置范围" desc="可配置slider范围">
            <div class="slider-list-wrap">
                <GeSliderList @change="handleChange4" :list="list4" />
            </div>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeSliderList, ISliderItem } from '../../src/index';
import '../../src/components/modules/slider-list/style';
export default {
    name: 'demo-slider-list',
    data: () => {
        return {
            sliderVal: 0,
            list: [
                {
                    label: '',
                    key: '',
                    value: 12,
                    max: 100,
                },
            ] as ISliderItem[],
            list2: [
                {
                    label: '',
                    key: '',
                    value: 12,
                    max: 100,
                },
                {
                    label: '强度',
                    key: 's1',
                    value: 22,
                    max: 100,
                },
            ] as ISliderItem[],
            list3: [
                {
                    label: '',
                    key: '',
                    value: 12,
                    max: 100,
                },
                {
                    label: '强度',
                    key: '强度',
                    value: 22,
                    max: 100,
                    step: 12,
                },
            ] as ISliderItem[],
            list4: [
                {
                    label: '锐度',
                    key: '锐度',
                    value: 22,
                    min: 0,
                    max: 20,
                    step: 12,
                },
            ] as ISliderItem[],
        };
    },
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeSliderList,
    },
    methods: {
        handleChange(_val: number, _index: number, _list: ISliderItem[]) {
            this.list[_index].value = _val;
        },
        handleChange2(_val: number, _index: number, _list: ISliderItem[]) {
            this.list2[_index].value = _val;
        },
        handleChange3(_val: number, _index: number, _list: ISliderItem[]) {
            this.list3[_index].value = _val;
        },
        handleChange4(_val: number, _index: number, _list: ISliderItem[]) {
            this.list4[_index].value = _val;
        },
    },
};
</script>

<style lang="less">
.slider-list-wrap {
    width: 244px;
    background: #f6f7f9;
}
</style>
