<style lang="less">
    .eui-v2-checkbox-side(@padding) {
        &.eui-v2-checkbox {
            &--left {
                padding-left: 24px + @padding;

                .eui-v2-checkbox__inner {
                    left: @padding;
                }
            }

            &--right {
                padding-right: 24px + @padding;
                .eui-v2-checkbox__inner {
                    right: @padding;
                }
            }
        }
    }

    .eui-v2-checkbox {
        @checkbox-size: 16px;
        position: relative;
        font-size: 14px;
        line-height: 20px;
        color: black;
        cursor: pointer;
        user-select: none;
        display: inline-block;

        .eui-v2-checkbox-side(0px);

        &--block {
            display: block;
        }

        &--border {
            padding: 10px 16px;
            border: 1px solid @border-color;
            border-radius: @button-border-radius;

            .eui-v2-checkbox-side(16px);

            &:hover:not(.eui-v2-checkbox--disabled) {
                border-color: @hover-border-color;
            }
        }

        &--padding {
            padding: 10px 16px;
            .eui-v2-checkbox-side(16px);
        }

        &--checked {
            .eui-v2-checkbox__inner {
                .eui-v2-icon {
                    display: block;
                    color: @primary-color;
                }
            }
        }

        &--disabled {
            cursor: not-allowed;
            color: @disabled-color;
        }

        &--fill.eui-v2-checkbox--checked {
            .eui-v2-checkbox__inner {
                background: @primary-color;
                border-color: @primary-color;
                .eui-v2-icon {
                    color: #fff;
                }
            }
            &:hover:not(.eui-v2-checkbox--disabled) {
                .eui-v2-checkbox__inner {
                    border-color: @primary-color-light;
                    background: @primary-color-light;
                }
            }
        }

        &__inner {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: @checkbox-size;
            height: @checkbox-size;
            border: 1px solid @dark-border-color;
            border-radius: 2px;
            font-size: @checkbox-size - 2;
            box-sizing: border-box;

            .eui-v2-icon {
                display: none;
            }
        }

        &__input {
            opacity: 0;
            position: absolute;
            left: -9999px;
        }

        &:hover:not(.eui-v2-checkbox--disabled) {
            .eui-v2-checkbox__inner {
                border-color: @hover-border-color;
            }
        }
    }
</style>

<template>
    <label class="eui-v2-checkbox" :class="innerClass">
        <div class="eui-v2-checkbox__inner">
            <eui-v2-icon :name="checkedIcon || 'check'" />
        </div>
        <span>
            <slot />
        </span>
        <input
            class="eui-v2-checkbox__input"
            type="checkbox"
            :checked="checked"
            @change="onChange"
            :disabled="disabled">
    </label>
</template>

<script>
import Icon from '../icon';

export default {
    components: {
        'eui-v2-icon': Icon
    },
    model: {
        prop: 'checked',
        event: 'change'
    },
    props: {
        checked: Boolean,
        side: {
            type: String,
            validator(value) {
                return ['left', 'right'].includes(value);
            },
            default: 'left'
        },
        block: {
            type: Boolean,
            default: false,
        },
        border: {
            type: Boolean,
            default: false
        },
        padding: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        fill: {
            type: Boolean,
            default: false
        },
        checkedIcon: {
            type: String,
            default: '',
        }
    },
    computed: {
        innerClass() {
            const {
                side,
                checked,
                block,
                border,
                padding,
                disabled,
                fill
            } = this;

            return [`eui-v2-checkbox--${side}`, {
                'eui-v2-checkbox--checked': checked,
                'eui-v2-checkbox--border': border,
                'eui-v2-checkbox--block': block,
                'eui-v2-checkbox--padding': padding,
                'eui-v2-checkbox--disabled': disabled,
                'eui-v2-checkbox--fill': fill
            }];
        }
    },
    methods: {
        onChange(e) {
            this.$emit('change', e.target.checked);
        }
    }
};
</script>
