<style lang="less">
    .eui-v2-degree-input {
        position: relative;
        z-index: 2;
        font-size: 12px;
        background-color: #F6F7F9;
        border-radius: 4px;
        &__control {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 4px;
            background-color: inherit;

            &__input {
                max-width: 28px;
                text-align: center;
                border: none;
                outline: none;
                background-color: transparent;
                color: #33383E;
                font-size: inherit;
            }
        }

        &:hover &__control {
            background-color: #D9DCDF;
        }

        &__panel {
            display: none;
            padding-top: 4px;
        }

        &:hover &__panel, &--moving &__panel {
            display: block;
        }

        &__disk {
            width: 64px;
            height: 64px;
            background-color: white;
            box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.16), 0px 1px 8px rgba(0, 0, 0, 0.06), 0px 4px 12px rgba(0, 0, 0, 0.08);
            border-radius: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
</style>

<template>
    <div :class="[bem(''), moving && bem(['moving'])]">
        <div :class="[bem('control')]">
            <input
                :class="[bem('control__input')]"
                ref="input"
                :disabled="disabled"
                :value="degree"
                @focus="onFocus"
                @keypress.enter="onEnter"
                @blur="onBlur"
                v-focusSelect>
        </div>
        <div :class="bem('panel')">
            <div :class="bem('disk')">
                <DegreeDisk
                    :degree="value"
                    :step="step"
                    @change="onChange"
                    @mousedown="handleDiskMouseDown"
                    @mouseup="handleDiskMouseUp"/>
            </div>
        </div>
    </div>
</template>

<script>
import DegreeDisk from '../degree-disk/index.vue';
import focusSelect from '../../utils/directives/focus-select';

export default {
    name: 'eui-v2-degree-input',
    components: {
        DegreeDisk,
    },
    directives: {
        focusSelect
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
        min: {
            type: Number,
            default: -180
        },
        max: {
            type: Number,
            default: 180
        },
        autoSelect: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        step: {
            type: Number,
            default: 1
        },
        cache: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            focus: false,
            moving: false,
        };
    },
    computed: {
        degree() {
            return this.value + '°';
        }
    },
    methods: {
        onFocus(event) {
            if(this.autoSelect) {
                this.$refs.input.select();
            }
            this.cacheDegree = this.degree;
            this.focus = true;
            this.$emit('onFocus', event);
        },
        onBlur(e) {
            const value = e.target.value;
            const validDegree = v => {
                const parsedV = Number(v);
                if(Number.isNaN(parsedV) || parsedV !== parseInt(parsedV)) return false;
                return parsedV >= -180 && parsedV <= 180;
            };
            const degree = validDegree(value) ? value : this.cacheDegree;
            this.onChange(parseFloat(degree));
            this.$forceUpdate();
            this.focus = false;
            this.$emit('onBlur', e);
        },
        onChange(value) {
            if(value > 180 || value < -180) {
                value = value - Math.round(value / 360) * 360;
            }
            this.$emit('change', value);
        },
        onEnter(event) {
            event.target.blur();
        },
        handleDiskMouseDown() {
            this.moving = true;
        },
        handleDiskMouseUp() {
            this.moving = false;
        }
    }
};
</script>
