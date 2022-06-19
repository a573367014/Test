<style lang="less">

    .eui-v2-dropdown-menu {
        cursor: pointer;
        color: #33383e;
        font-size: 14px;
        line-height: 20px;
        user-select:none;


        &:hover {
            background-color: @hover-background-color;
        }
        &:active,
        &.activated {
            background-color: #F0F6FF;
        }

        .eui-v2-icon {
            display: block;
        }

        &--flex {
            display: flex;
            align-items: center;
        }

        &__content {
            flex-grow: 1;
        }

        &__start {
            margin-right: 8px;
        }

        &__end {
            margin-left: 8px;
            justify-self: right;
        }

        &--small {
            padding: 5px 24px;
            font-size: 12px;
            line-height: 20px;
        }

        &--middle {
            padding: 5px 15px;
        }

        &--large {
            padding: 12px 15px;

            .eui-v2-icon {
                font-size: 20px;
            }
        }

        &--label {
            color: #8D949E;
            font-size: 12px;
            line-height: 17px;
            padding: 10px;
            cursor: default;

            &:hover {
                background: none;
            }

            &:active,
            &.activated {
                color: #8D949E;
                background: none;
                font-weight: 400;
            }
        }
    }
</style>

<template>
    <div class="eui-v2-dropdown-menu" :class="innerClass" v-on="$listeners">
        <div class="eui-v2-dropdown-menu__start" v-if="hasStart">
            <slot name="start" />
        </div>
        <div class="eui-v2-dropdown-menu__content">
            <slot />
        </div>
        <div class="eui-v2-dropdown-menu__end" v-if="hasEnd">
            <slot name="end" />
        </div>
    </div>
</template>

<script>
export default {
    props: {
        width: {
            type: Number,
            default: 0
        },
        activated: {
            type: Boolean,
            default: false
        },
        size: {
            type: String,
            default: 'middle'
        }
    },

    computed: {
        innerClass() {
            const { activated, hasStart, hasEnd, size } = this;
            return [
                `eui-v2-dropdown-menu--${size}`,
                {
                    'activated': activated,
                    'eui-v2-dropdown-menu--flex': hasStart || hasEnd
                }
            ];
        },
        menuStyle() {
            const { width } = this;
            return {
                width: width ? `${width}px` : 'auto'
            };
        },
        hasStart() {
            const slots = this.$scopedSlots.start ? this.$scopedSlots.start() : this.$slots.start;
            return slots && slots.length;
        },
        hasEnd() {
            const slots = this.$scopedSlots.end ? this.$scopedSlots.end() : this.$slots.end;
            return slots && slots.length;
        }
    }
};
</script>
