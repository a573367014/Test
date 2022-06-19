<style lang="less">
.eui-v2-dropdown-button {
    cursor: pointer;
    outline: none;
    text-decoration: none;
    text-align: left;
    padding-right: 32px;

    user-select: none;
    position: relative;

    &.eui-v2-dropdown-button--grey {
        background: #f6f7f9;
        border: none;

        &.eui-v2-button--normal:active,
        &.eui-v2-button--normal:hover,
        &.eui-v2-button--normal.activated {
            background: #f6f7f9;
            border: none;
        }
    }

    &--block {
        width: 100%;
        box-sizing: border-box;
    }
    &--clear {
        border: none;
        background: transparent;
    }

    &--has-prefix {
        .eui-v2-button__container {
            display: flex;
            flex-direction: row;
        }

        .eui-v2-dropdown-button__content {
            flex-grow: 1;
            text-align: right;
        }
    }

    &__prefix {
        color: black;
        text-align: left;
        margin-right: 12px;
    }

    &__suffix {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);

        &__icon {
            content: '';
            border-width: 5px 4px 0;
            border-color: @normal-color transparent transparent;
            border-style: solid;
            display: block;
        }

        .eui-v2-icon {
            font-size: 12px;
            color: #636c78;
        }
    }

    .eui-v2-button__container {
        justify-content: left;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    &:disabled {
        opacity: 0.7;
    }
    &:disabled &__suffix__select-icon {
        display: none;
    }
    &:disabled &__suffix__icon {
        border-color: @disabled-color transparent transparent;
    }
}
</style>

<template>
    <Popup
        ref="popup"
        v-bind="$attrs"
        :visible.sync="showPopup"
        :as-ref-width="asRefWidth"
        :allow-directions="allowDirections"
        :appendBody="appendBody"
        :classNames="popupClass"
        @active="onActive($event)"
        @inactive="onInActive($event)"
    >
        <Button
            class="eui-v2-dropdown-button"
            :class="[innerClass, dropDownBtnClass]"
            @click="toggleDropdown"
            :size="size"
            :block="block"
            :fill="fill"
            :disabled="disabled"
            :color="color"
            :tooltip="isActive ? '' : tooltip"
            :disabled-tooltip="disabledTooltip"
            :activated="buttonActivated || showPopup"
            :icon-type="iconType"
        >
            <slot name="diy">
                <div class="eui-v2-dropdown-button__prefix" v-if="hasPrefix">
                    <slot name="prefix" />
                </div>
                <slot />
                <div class="eui-v2-dropdown-button__suffix">
                    <slot v-if="!loading" name="suffix-icon">
                        <Icon
                            class="eui-v2-dropdown-button__suffix__select-icon"
                            name="arrow-down"
                        />
                        <!-- <i class="eui-v2-dropdown-button__suffix__icon" /> -->
                    </slot>

                    <Loading v-if="loading" />
                </div>
            </slot>
        </Button>

        <template slot="content" v-if="!disabled">
            <slot name="dropdown" v-bind:close="closePopup" />
        </template>
    </Popup>
</template>

<script>
import Popup from '../popup';
import Button from '../button';
import Loading from './loading';
import Icon from '../icon';

export default {
    components: {
        Popup,
        Loading,
        Button,
        Icon,
    },
    props: {
        allowDirections: {
            type: Array,
            default: () => ['top', 'bottom', 'left', 'right'],
        },
        tooltip: {
            type: String,
            default: '',
        },
        buttonActivated: {
            type: Boolean,
            default: () => false,
        },
        loading: {
            type: Boolean,
            default: () => false,
        },
        block: {
            type: Boolean,
            default: false,
        },
        fill: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        size: {
            type: String,
            default: 'middle',
        },
        color: {
            type: String,
            default: 'normal',
        },
        asRefWidth: {
            type: Boolean,
            default: true,
        },
        iconType: {
            type: String,
            default: '',
        },
        disabledTooltip: {
            type: String,
            default: null,
        },
        appendBody: {
            type: Boolean,
            default: true,
        },
        popupClass: {
            type: [Object, Array, String],
            default: '',
        },
    },
    data() {
        return {
            showPopup: false,
            isActive: false,
        };
    },
    computed: {
        hasPrefix() {
            const slots = this.$scopedSlots.prefix
                ? this.$scopedSlots.prefix()
                : this.$slots.prefix;
            return slots && slots.length;
        },
        innerClass() {
            const { hasPrefix } = this;
            return {
                'eui-v2-dropdown-button--has-prefix': hasPrefix,
            };
        },
        dropDownBtnClass() {
            const { type } = this;
            switch (type) {
                case 'grey':
                    return 'eui-v2-dropdown-button--grey';
                default:
                    return '';
            }
        },
    },
    watch: {
        showPopup(value) {
            this.$emit('onShow', value);
        },
    },
    methods: {
        toggleDropdown() {
            if (this.disabled) {
                return;
            }

            this.showPopup = !this.showPopup;
        },
        updatePopup() {
            const popup = this.$refs.popup;
            popup.updatePosition();
        },
        closePopup() {
            this.showPopup = false;
        },
        openPopup() {
            this.showPopup = true;
        },
        onActive(e) {
            this.isActive = true;
            this.$emit('active', e);
        },
        onInActive(e) {
            this.isActive = false;
            this.$emit('inactive', e);
        },
    },
};
</script>
