<template>
    <div class="range-slider-group">
        <div class="range-slider-item"
            v-for="(item, index) in list"
            :key="index"
        >
            <div class="range-slider-label">
                <label>
                    {{ item.name }}
                </label>

                <span>{{ item.value }}</span>
            </div>
            <range-slider
                :value="item.value"
                :min="item.min"
                :from-zero="item.fromZero"
                :max="item.max"
                type="number"
                @change="onChange(item, $event)"
            ></range-slider>
        </div>
    </div>
</template>

<script>
import RangeSlider from './range-slider';

export default {
    components: {
        RangeSlider,
    },

    props: {
        list: {
            type: Array,
            default: () => [],
        }
    },

    methods: {
        onChange(item, value) {
            item.value = value.toFixed(2);
            this.$emit('change', item);
        }
    },

    mounted() {
    }
};
</script>

<style lang="less" scoped>
.range-slider-group {
    padding: 20px 16px;
    .range-slider-item {
        margin: 5px 0 8px;
    }
    .range-slider-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        > label {
            font-size: 14px;
            color: #000000;
        }
        > span {
            font-size: 13px;
            color: #999999;
        }
    }
}
</style>
