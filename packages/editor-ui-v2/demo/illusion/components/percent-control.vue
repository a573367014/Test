<template>
    <div class="percent-control">
        <label>{{ value }}</label>
        <RangeSlider
            :max="max"
            :min="min"
            :value="value"
            @change="setFromSlider"
        />
    </div>
</template>

<script>
import RangeSlider from '../../src/base/range-slider';
export default {
    comments: {
        RangeSlider,
    },

    props: {
        value: {
            type: Number,
            default: 80
        },
    }
};
</script>

<style lang="less" scoped>
.percent-control {
    position: relative;
    width: 52px;
}
</style>
