<template>
    <div>
        <div class="slider-list-wrap">
            <GeSliderList :list="list1" />
            <GeSliderList :list="list2" />
        </div>
        <div class="slider-list__label">加背景框：</div>
        <div class="slider-list-wrap2">
            <GeSliderList :list="list2" />
        </div>
    </div>
</template>

<script>
import { GeSliderList } from '../../../../src';
import '../../../../es/components/modules/slider-list/style';

export default {
    name: 'test-slider-list-1',
    components: {
        GeSliderList,
    },
    data() {
        return {
            list1: [
                {
                    label: '',
                    key: 'ss',
                    value: 12,
                    max: 100,
                },
            ],
            list2: [
                {
                    label: '强度',
                    key: 's1',
                    value: 12,
                    max: 100,
                },
            ],
        };
    },
};
</script>

<style lang="less">
.slider-list-wrap {
    width: 244px;
}
.slider-list-wrap2 {
    background: #f6f7f9;
    width: 244px;
}
.slider-list__label {
    padding-top: 12px;
    padding-bottom: 12px;
}
</style>
