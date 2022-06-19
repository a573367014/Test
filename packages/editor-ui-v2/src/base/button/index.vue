<style lang="less">
    @import '../../styles/mixin.less';

    .eui-v2-button {
        border-radius: @button-border-radius;
        border: @button-border;
        cursor: pointer;
        outline: none;
        text-decoration: none;

        user-select: none;
        transition: all .2s ease-out;
        transition-property: width, height, color, opacity, background-color, border-color;

        &--normal {
            color: @normal-color;
            border-color: @border-color;
            background-color: #fff;
            &:hover {
                color: black;
                background-color: #fff;
                border-color: @hover-border-color;
            }

            &:active, &.activated {
                color: @primary-color;
                background-color: #fff;
                border-color: @hover-border-color;
            }

            &:disabled, &[disabled] {
                color: @disabled-color;
                border-color: @border-color;
                background-color: #fff;
            }


            &--outline {
                color: @normal-color;
                border-color: @normal-color;
                background-color: #fff;
                &:hover {
                    color: #000;
                    background-color: #fff;
                    border-color: black;
                }

                &:active, &.activated {
                    color: @primary-color;
                    background-color: #fff;
                    border-color: @primary-color;
                }

                &:disabled, &[disabled] {
                    color: @disabled-color;
                    border-color: @normal-color;
                    background-color: #fff;
                }
            }

            &--clear {
                color: @normal-color;
                background-color: transparent;
                border-color: transparent;

                &:hover {
                    background-color: transparent;
                    border-color: transparent;
                }

                &:active, &.activated {
                    color: @primary-color;
                    background-color: transparent;
                    border-color: transparent;
                }

                &:disabled, &[disabled] {
                    color: @disabled-color;
                    border-color: transparent;
                }
            }
        }

        &--info {
            color: @primary-color;
            border-color: #D3DFFD;
            background-color: #ECF3FF;
            &:hover {
                color: @primary-color;
                background-color: #ECF3FF;
                border-color: @hover-border-color;
            }

            &:active, &.activated {
                color: @primary-color;
                background-color: #ECF3FF;
                border-color: @primary-color;
            }

            &:disabled, &[disabled] {
                color: fade(@primary-color, 70%);
                border-color: #D3DFFD;
                background-color: #ECF3FF;
            }


            &--outline {
                color: @primary-color;
                border-color: @primary-color;
                background-color: #ECF3FF;
                &:hover {
                    color: @primary-color-light;
                    background-color: #ECF3FF;
                    border-color: @primary-color-light;
                }

                &:active, &.activated {
                    color: @primary-color;
                    background-color: #ECF3FF;
                    border-color: @primary-color;
                }

                &:disabled, &[disabled] {
                    color: fade(@primary-color, .7);
                    border-color: @normal-color;
                    background-color: #ECF3FF;
                }
            }

            &--clear {
                color: @primary-color;
                background-color: transparent;
                border-color: transparent;

                &:hover {
                    color: @primary-color-light;
                    background-color: transparent;
                    border-color: transparent;
                }

                &:active, &.activated {
                    color: @primary-color;
                    background-color: transparent;
                    border-color: transparent;
                }

                &:disabled, &[disabled] {
                    color: @disabled-color;
                    border-color: transparent;
                }
            }
        }

        &--gray {
            color: black;
            background-color: #F0F3F4;
            border-color: #F0F3F4;

            &:hover {
                color: black;
                background-color: darken(#F0F3F4, 10%);
                border-color: darken(#F0F3F4, 10%);
            }

            &:active, &.activated {
                color: black;
                background-color: #F0F3F4;
                border-color: #F0F3F4;
            }

            &:disabled {
                opacity: 1;
                color: lighten(black, 40%);
                background-color: #F0F3F4;
                border-color: #F0F3F4;
            }

            &--clear {
                color: @normal-color;
                background-color: transparent;
                border-color: transparent;

                &:hover {
                    color: @normal-color;
                    background-color: #F1F2F4;
                    border-color: #F1F2F4;
                }

                &:active, &.activated {
                    color: @normal-color;
                    background-color: #F1F2F4;
                    border-color: #F1F2F4;
                }

                &:disabled {
                    color: @disabled-color;
                    border-color: transparent;
                }
            }
        }

        &:disabled, &[disabled] {
            cursor: not-allowed;
            .eui-v2-icon {
                cursor: not-allowed;
            }
        }

        &--block {
            width: 100%;
        }

        &__icon--block {
            .eui-v2-icon {
                display: block;
            }
        }

        &__icon--only {
            .eui-v2-icon {
                display: block;
                margin: 0 auto;
                line-height: 1;
            }
        }

        &__icon--left,
        &__icon--right {

            .eui-v2-button__container {
                display: flex;
                align-items: center;
                justify-content: center;

                .eui-v2-icon {
                    line-height: 1;
                }
            }
        }

        &--with-tooltip {
            position: relative;

            &:hover {
                .eui-v2-button__tooltip {
                    opacity: 1;
                }
            }

            // &:disabled, &[disabled] {
            //     .eui-v2-button__tooltip {
            //         display: none;
            //     }
            // }
        }

        &__tooltip {
            position: absolute;
            pointer-events: none;
            padding: 6px 8px;;
            background-color: @dark-color;
            border-radius: 4px;
            white-space: nowrap;

            font-size: 13px;
            line-height: 18px;
            color: #fff;
            opacity: 0;
            transition: opacity .15s;
            white-space: nowrap;
            z-index: 15;

            @tooltipPadding: calc(~'100% + 10px');

            &::before {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border-style: solid;
            }

            &--top {
                bottom: @tooltipPadding;
                left: 50%;
                transform: translateX(-50%);

                &::before {
                    border-width: 5px 5px 0 5px;
                    border-color: @dark-color transparent transparent transparent;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                }
            }

            &--left {
                right: @tooltipPadding;
                top: 50%;
                transform: translateY(-50%);

                &::before {
                    border-width: 5px 0 5px 5px;
                    border-color: transparent transparent transparent @dark-color;
                    right: -5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
            }

            &--right {
                left: @tooltipPadding;
                top: 50%;
                transform: translateY(-50%);

                &::before {
                    border-width: 5px 5px 5px 0;
                    border-color: transparent @dark-color transparent transparent;
                    left: -5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
            }

            &--bottom {
                top: @tooltipPadding;
                left: 50%;
                transform: translateX(-50%);

                &::before {
                    border-width: 0 5px 5px 5px;
                    border-color: transparent transparent @dark-color transparent;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                }
            }
        }
    }

    .eui-v2-button(primary, @primary-color, @primary-color-light, @primary-color);
    .eui-v2-button(success, @success-color, @success-color-light, @success-color);
    .eui-v2-button(warn, @warn-color, @warn-color-light, @warn-color);
    .eui-v2-button(error, @error-color, @error-color-light, @error-color);
    .eui-v2-button-size(large, 1.2);
    .eui-v2-button-size(middle, 1);
    .eui-v2-button-size(small, 0.9);
    .eui-v2-button-size(mini, 0.7);
</style>


<template>
    <component
        class="eui-v2-button"
        :class="innerClass"
        :is="tag"
        :disabled="disabled"
        :type="tag === 'button' ? type : ''"
        v-on="$listeners">
        <div class="eui-v2-button__container">
            <slot/>
        </div>

        <div class="eui-v2-button__tooltip" v-if="innerTooltip" :class="tooltipClass" v-html="innerTooltip"></div>
    </component>
</template>


<script>

export default {
    props: {
        color: {
            type: String,
            default: 'normal'
        },
        block: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        activated: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        iconType: {
            type: String,
            default: ''
        },
        disabled: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        tag: {
            type: String,
            default: () => 'button'
        },
        fill: {
            type: String,
            default: ''
        },
        tooltip: {
            type: String,
            default: null
        },
        tooltipSide: {
            type: String,
            default: 'bottom',
            validator: function(value) {
                return ['left', 'top', 'right', 'bottom'].includes(value);
            }
        },
        disabledTooltip: {
            type: String,
            default: null
        },
        size: {
            type: String,
            default: 'middle'
        },
        type: {
            type: String,
            default: 'button'
        }
    },
    data: function() {
        return { };
    },
    computed: {
        innerClass: function() {
            const { color, activated, block, fill, iconType, innerTooltip, size } = this;
            const colorClass = `eui-v2-button--${color}${fill ? '--' + fill : ''}`;
            const iconClass = iconType ? `eui-v2-button__icon--${iconType}` : '';
            const sizeclass = `eui-v2-button--${size}`;
            return [{
                'eui-v2-button--block': block,
                'activated': activated,
                'eui-v2-button--with-tooltip': innerTooltip
            }, colorClass, iconClass, sizeclass];
        },

        tooltipClass: function() {
            const { tooltipSide } = this;
            return `eui-v2-button__tooltip--${tooltipSide}`;
        },
        innerTooltip: function() {
            const { disabled, tooltip, disabledTooltip } = this;
            return disabled ? disabledTooltip : tooltip;
        }
    }
};

</script>
