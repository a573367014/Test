<template>
    <div class="eui-v2-range-picker" :class="{ 'eui-v2-range-picker--disabled': disabled }">
        <div class="eui-v2-range-picker__label" v-if="label">
            <slot name="before-label" />
            <slot name="label" :label="label">
                {{ label }}
            </slot>
        </div>
        <div class="eui-v2-range-picker__range" v-if="sliderVisible">
            <RangeSlider
                :max="max"
                :min="min"
                :value="innerVal"
                :bubble="bubble"
                :type="type"
                :formatter="sliderFormatter"
                :invalid="disabled"
                :start="start"
                :bonding="bonding"
                @change="setFromSlider"
                @drag-end="onDragEnd"
            />
        </div>
        <input
            class="eui-v2-range-picker__control"
            :class="{
                'eui-v2-range-picker__control--slience': inputSlience,
            }"
            ref="input"
            v-focusSelect
            v-if="inputVisible"
            :style="inputStyle"
            :value="filterValue(value)"
            :disabled="inputSlience || disabled"
            @focus="onFocus"
            @blur="onBlur"
            @keypress.enter="onEnter"
            @input="onInputChange"
        />
    </div>
</template>

<script>
import focusSelect from '../../utils/directives/focus-select';
import RangeSlider from '../../base/range-slider';
import $ from '@gaoding/editor-utils/zepto';

const doc = $(document);

export default {
    directives: {
        focusSelect,
    },
    components: {
        RangeSlider,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        label: {
            type: String,
            default: '',
        },
        labelWidth: {
            type: Number,
            default: 50,
        },
        value: {
            type: Number,
            default: 0,
        },
        suffix: {
            type: String,
            default: '',
        },
        max: {
            type: Number,
            default: 0,
        },
        min: {
            type: Number,
            default: 0,
        },
        digits: {
            type: Number,
            default: 0,
        },
        sliderVisible: {
            type: Boolean,
            default: true,
        },
        inputVisible: {
            type: Boolean,
            default: true,
        },
        inputSlience: {
            type: Boolean,
            default: false,
        },
        inputWidth: {
            type: Number,
            default: 26,
        },
        type: {
            type: String,
            default: 'format',
        },
        inputFormatter: {
            type: Function,
            default: Math.round,
        },
        formatter: {
            type: Function,
            default: function (progress, value) {
                return this.inputFormatter(value);
            },
        },
        syncLimit: {
            type: Boolean,
            default: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        autoSelect: {
            type: Boolean,
            default: true,
        },
        start: {
            type: Number,
            default: function () {
                return this.min;
            },
        },
        bubble: {
            type: Boolean,
            default: function () {
                return !this.inputVisible;
            },
        },
        bonding: {
            type: Number,
            default: 0,
        },
        space: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        innerVal() {
            return Math.min(this.max, this.value);
        },
        labelStyle() {
            const { labelWidth } = this;
            return {
                width: `${labelWidth}px`,
            };
        },
        inputStyle() {
            const { inputWidth } = this;
            return {
                width: `${inputWidth}px`,
            };
        },
    },
    methods: {
        filterValue(value) {
            let newValue = this.inputFormatter(value);
            if (isNaN(newValue)) {
                newValue = this.start;
            }

            if (newValue > this.max || newValue < this.min) {
                newValue = this.nearer(newValue, this.max, this.min);
            }
            return newValue + (this.suffix || '');
        },
        nearer(value, max, min) {
            const diffmax = Math.abs(value - max);
            const diffmin = Math.abs(value - min);
            return diffmax < diffmin ? max : min;
        },
        // newValue: number
        setFromSlider(newValue) {
            this.$emit('change', newValue);
            if (this.inputVisible) {
                this.$refs.input.value = this.filterValue(newValue);
            }
        },
        // newValue: string
        onInputChange() {
            if (this.disabled) {
                return;
            }

            let newValue = this.$refs.input.value;
            if (newValue === '-' || newValue === '') {
                return;
            }
            newValue = newValue.replace(new RegExp(this.suffix + '$') || '', '');
            if (isNaN(Number(newValue))) {
                this.$refs.input.value = this.filterValue(this.value);
                return;
            }
            // 当filter后和原来的number值一致时，让输入框恢复到原来的值，保证input可以输入小数点
            const filterValue = this.syncLimit ? this.filterValue(newValue) : newValue;
            newValue = +filterValue === +newValue ? newValue : filterValue;
            this.$refs.input.value = newValue;
            newValue = newValue.replace(new RegExp(this.suffix + '$') || '', '');
            if (!isNaN(newValue)) {
                this.$emit('change', Number(newValue));
            }
        },
        onDragEnd(val) {
            this.$emit('drag-end', val);
        },
        onFocus(event) {
            if (this.space > 0) {
                doc.on('keydown', this.keyboardHandle);
            }

            if (this.autoSelect) {
                this.$refs.input.select();
            }

            this.$emit('focus', event);
        },
        onBlur() {
            if (this.space > 0) {
                doc.off('keydown', this.keyboardHandle);
            }
            this.$emit('blur', event);
        },
        onEnter(event) {
            event.target.blur();
        },
        sliderFormatter(progress, value) {
            return this.formatter(progress, value);
        },
        keyboardHandle(event) {
            const { keyCode } = event;
            let newValue = +this.$refs.input.value;

            // 38 up | 40 down
            switch (keyCode) {
                case 38:
                    newValue += this.space;
                    break;
                case 40:
                    newValue -= this.space;
                    break;
                default:
                    return;
            }
            newValue = this.syncLimit ? this.filterValue(newValue) : newValue;
            this.$refs.input.value = newValue;
            if (!isNaN(newValue)) {
                this.$emit('change', Number(newValue));
            }
        },
    },
};
</script>

<style lang="less">
.eui-v2-range-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 14px 5px 16px;
    cursor: default;

    &__label {
        margin-right: 16px;
        font-size: 13px;
        font-weight: 500;
        color: #33383e;
        line-height: 30px;
        box-sizing: content-box;
        flex-shrink: 0;
        user-select: none;
        display: flex;
        align-items: center;
    }

    &__range {
        flex-grow: 1;
        flex-shrink: 1;
        &:first-child {
            padding-right: 4px;
        }
    }

    &::before {
        display: none;
    }

    &__control {
        display: inline-block;
        border: 1px transparent solid;
        border-radius: 4px;
        transition: all 0.2s ease;
        font-size: 13px;
        line-height: 20px;
        color: #33383e;
        cursor: pointer;
        box-sizing: content-box;
        padding: 4px 2px;
        text-align: right;
        background: transparent;

        &:hover:not(.eui-v2-range-picker__control--slience) {
            transition: all 0.2s ease;
            border: @border-color 1px solid;
        }
        &:focus {
            outline: none;
            cursor: text;
            text-align: center;
        }

        &--slience {
            color: #000;
            text-align: right;
        }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type='number'] {
        -moz-appearance: textfield;
    }

    &--disabled {
        .eui-v2-range-picker__label {
            color: @disabled-color;
        }

        .eui-v2-range-picker__control {
            color: @disabled-color;
            cursor: not-allowed;
            &:hover {
                border-color: transparent;
            }
        }
    }
}
</style>
