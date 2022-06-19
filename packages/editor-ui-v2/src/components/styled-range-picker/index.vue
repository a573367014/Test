<template>
    <div :class="pfx()">
        <div :class="pfx('__icon')">
            <slot name="icon">
                <img :src="icon">
            </slot>
        </div>
        <RangePicker
            :class="pfx('-picker')"
            :max="max"
            :min="min"
            :value="innerVal"
            :inputWidth="32"
            @change="rangeChange"
        />
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
        },
        icon: {
            type: String,
            default: '',
        }
    },
    computed: {
        innerVal() {
            return Math.min(this.max, this.value);
        }
    },
    methods: {
        pfx(name) {
            return `eui-v2-styled-range${name || ''}`;
        },
        rangeChange(value) {
            this.$emit('change', value);
        }
    }
};
</script>

<style lang="less">
.eui-v2-styled-range {
    position: relative;
    width: 100%;
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
}
</style>
