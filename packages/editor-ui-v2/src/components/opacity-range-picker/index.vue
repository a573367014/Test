<template>
    <div class="eui-v2-opacity-range">
        <div class="eui-v2-opacity-range__icon">
            <img :src="require('./images/fill_opacity.svg')" >
        </div>
        <RangePicker
            class="eui-v2-opacity-range-picker"
            :max="max"
            :min="min"
            :value="innerVal"
            :inputWidth="32"
            @change="rangeChange"
        />
        <span class="range-unit">%</span>
    </div>
</template>

<script>
import RangePicker from '../range-picker';

export default {
    components: {
        RangePicker,
    },
    model: {
        prop: 'value',
        event: 'change'
    },
    props: {
        value: {
            type: Number,
            default: 0
        },
        max: {
            type: Number,
            default: 0
        },
        min: {
            type: Number,
            default: 0
        }
    },
    computed: {
        innerVal() {
            return Math.min(this.max, this.value);
        }
    },
    methods: {
        rangeChange(value) {
            this.$emit('change', value);
        }
    }
};
</script>

<style lang="less">
.eui-v2-opacity-range {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 18px;
    padding-right: 4px;
    background: #F6F7F9;
    border-radius: 4px;
    cursor: default;

    &__icon {
        margin-right: 20px;
        height: 20px;
        width: 20px;
        img {
            height: 100%;
            width: 100%;
        }
    }

    &-picker {
        flex: 1;
    }

    .eui-v2-range-picker__control {
        height: 30px;
        box-sizing: border-box;
    }

    .range-unit {
        position: absolute;
        right: 8px;
        top: 50%;
        font-size: 13px;
        line-height: 1;
        transform: translateY(-50%);
    }
}
</style>
