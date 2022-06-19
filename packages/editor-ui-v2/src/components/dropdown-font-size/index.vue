<template>
    <Popup
        classNames="eui-v2-dropdown-font-size-popup"
        placement="bottom-center"
        :allow-directions="['top', 'bottom']"
        as-ref-width
        :visible.sync="popupVisible"
        @active="onPopActive"
    >
        <div
            class="eui-v2-dropdown-font-size"
            :class="{
                'eui-v2-dropdown-font-size--disabled': disabled,
                'eui-v2-dropdown-font-size--focus': focus,
            }"
            @click="onInputClick"
        >
            <input
                :value="innerValue"
                ref="fontInput"
                :step="step"
                :min="min"
                :max="max"
                :disabled="disabled"
                @focus="onInpFocus"
                @blur="onInpBlur"
                @input="onInput"
                @keypress.enter="onEnter"
                @keydown.up.prevent="onArrowUp(true)"
                @keydown.down.prevent="onArrowDown(true)"
            />
            <div
                class="eui-v2-dropdown-font-size__size"
                :style="fakeBluring && { fontSize: '12px' }"
            >
                {{ currentFontSize }}
            </div>
            <span
                class="eui-v2-dropdown-font-size__increase"
                role="button"
                @click.stop="onArrowUp(false)"
                :class="{ 'eui-v2-dropdown-font-size__increase--disabled': maxDisabled }"
            >
                <Icon name="font-size-arrow-up" />
            </span>
            <span
                class="eui-v2-dropdown-font-size__decrease"
                role="button"
                @click.stop="onArrowDown(false)"
                :class="{ 'eui-v2-dropdown-font-size__increase--disabled': minDisabled }"
            >
                <Icon name="font-size-arrow-down" />
            </span>
        </div>
        <DropdownMenus
            class="eui-v2-dropdown-font-size-list"
            slot="content"
            :height="280"
            ref="listPanel"
        >
            <DropdownMenu
                v-for="item in fontSizeList"
                :key="item"
                :activated="item === currentFontSize"
                @click="onSelect(getFontSize(item))"
            >
                <!-- @mouseenter="onHover(getFontSize(item))" -->
                {{ getFontSize(item) }}
            </DropdownMenu>
        </DropdownMenus>
    </Popup>
</template>
<script>
import Icon from '../../base/icon';
import Popup from '../../base/popup';
import DropdownMenus from '../../base/dropdown-menus';
import DropdownMenu from '../../base/dropdown-menu';

export default {
    components: {
        Icon,
        Popup,
        DropdownMenus,
        DropdownMenu,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: { type: Number, required: true },
        fontSizeMixed: { type: Boolean, default: false },
        fontSizeList: { type: Array, required: true },
        isEditing: { type: Boolean, default: false },
        step: { type: Number, default: 1 },
        max: { type: Number, default: Infinity },
        min: { type: Number, default: 1 },
        mixed: { type: Boolean, default: false },
        format: { type: Function, default: (val) => Math.round(val * 10) / 10 },
        disabled: { type: Boolean, default: false },
        dpi: { type: Number, default: 0 },
        editor: { type: Object, default: () => {} },
    },
    data() {
        return {
            timerId: 0,
            pushUp: false,
            popupVisible: false,
            focus: false,
            innerValue: this.value,
            lastInerValue: this.value,
            fakeBluring: false,
        };
    },
    computed: {
        unit() {
            return this.dpi > 0 ? 'pt' : 'px';
        },
        dropdownStyle() {
            return this.pushUp ? { top: null, bottom: '50px' } : { top: '0', buttom: null };
        },
        currentFontSize: {
            get() {
                const { fontSizeMixed, value, innerValue } = this;

                if (innerValue !== value) {
                    return innerValue;
                }

                if (fontSizeMixed) {
                    return '…';
                }

                const fontSize = value;
                if (!fontSize) {
                    return '-';
                }

                return this.getFontSize(fontSize);
            },
        },
        maxDisabled() {
            return this.disabled || !this.isNumber || this.currentFontSize >= this.max;
        },
        minDisabled() {
            return this.disabled || !this.isNumber || this.currentFontSize <= this.min;
        },
        isNumber() {
            return typeof this.currentFontSize === 'number';
        },
    },
    watch: {
        popupVisible(visible) {
            this.$emit('onShow', visible);
        },
        value(size) {
            this.innerValue = size;
        },
    },
    methods: {
        onInput(e) {
            const v = e.target.value;
            if (/^\d+$/.test(v)) {
                this.innerValue = +v;
                this.lastInerValue = this.innerValue;
                e.target.selectionStart = e.target.value.length;
            } else if (!v) {
                return;
            } else {
                this.innerValue = this.lastInerValue;
                this.$forceUpdate();
            }
            this.popupVisible = false;
            this.onChange({ focus: true });
        },
        onArrowUp(focus = false) {
            let v = this.innerValue + this.step;
            v > this.max && (v = this.max);
            this.innerValue = v;
            this.onChange({ focus });
        },
        onArrowDown(focus = false) {
            let v = this.innerValue - this.step;
            v < this.min && (v = this.min);
            v < 6 && (v = 6);
            this.innerValue = v;
            this.onChange({ focus });
        },
        onChange(payload = { focus: false }) {
            if (this.fakeBluring) return;
            this.popupVisible = false;
            this.$emit('change', this.innerValue);
            if (this.isEditing && payload.focus) {
                this.fakeBluring = true;
                const textElm = document.activeElement;
                if (textElm !== this.$refs.fontInput) {
                    textElm.addEventListener('keydown', this.onDisableTextInput);
                    this.editor.currentRichText.once('change', () => {
                        this.$refs.fontInput.focus();
                        this.fakeBluring = false;
                        textElm.removeEventListener('keydown', this.onDisableTextInput);
                    });
                } else {
                    this.fakeBluring = false;
                }
            }
        },
        onInputClick() {
            if (this.disabled) return;

            const { fontInput } = this.$refs;

            if (fontInput) {
                fontInput.select();
            }
            this.$nextTick(() => {
                this.popupVisible = true;
            });
        },
        onInpFocus() {
            this.focus = true;
        },

        onInpBlur() {
            this.focus = false;
            this.$emit('onInpBlur');
        },

        findNearValueIndex(val) {
            const list = this.fontSizeList;

            return list.findIndex((num, i) => {
                const nextNum = list[i + 1];

                return !nextNum || num === val || (val > num && val < nextNum);
            });
        },

        focusCurrent() {
            const listPanelVm = this.$refs.listPanel;
            const idx = this.findNearValueIndex(this.currentFontSize);

            if (!listPanelVm || idx < 0) {
                return;
            }

            const elem = listPanelVm.$el.querySelector(`:nth-child(${idx + 1})`);

            if (elem && elem.scrollIntoViewIfNeeded) {
                elem.scrollIntoViewIfNeeded();
            } else if (elem) {
                elem.scrollIntoView();
            }
        },

        onSelect(size) {
            this.innerValue = +size;
            this.onChange();
            this.popupVisible = false;
        },

        onHover(size) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = setTimeout(() => {
                const props = { fontSize: +size < 1 ? 6 : +size || 20 };
                this.$emit('change', props.fontSize);

                clearTimeout(this.hoverTimer);
            }, 500);
        },

        onPopActive() {
            this.$nextTick(this.focusCurrent);
        },

        onEnter(event) {
            event.target.blur();
        },

        getFontSize(size) {
            return this.format(size);
        },
        onDisableTextInput(e) {
            e.preventDefault();
            e.stopPropagation();
        },
    },
};
</script>

<style lang="less">
@import '../../styles/variables.less';

.eui-v2-dropdown-font-size {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    background: #f6f7f9;
    border: none;
    border-radius: @button-border-radius;
    overflow-x: auto;

    &:hover:not(.eui-v2-dropdown-font-size--disabled) {
        border-color: @hover-border-color;
    }

    input {
        width: 100%;
        padding: 10px 20px 10px 8px;
        font-size: 12px;
        line-height: 20px;
        color: transparent;
        background: none;
        border: none;
        outline: none;
        box-shadow: none;
        cursor: pointer;
        font-family: initial;
        text-align: center;

        &:focus {
            cursor: text;
        }

        &:disabled {
            cursor: not-allowed;
            color: transparent;
        }
    }

    &::after {
        margin-left: 10px;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type='number'] {
        -moz-appearance: textfield;
    }

    &:hover {
        background: @hover-dropdown-background-color;
    }
    &--focus {
        background: @hover-dropdown-background-color;

        .eui-v2-dropdown-font-size__size {
            color: transparent;
        }

        input {
            color: #000;
        }
    }

    &--disabled {
        .eui-v2-dropdown-font-size__size {
            color: @disabled-color;
        }
    }

    &__size {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        right: 22px;
        padding: 10px 0 10px 8px;
        font-size: 14px;
        line-height: 20px;
        color: #33383e;
        user-select: none;
        pointer-events: none;
        overflow: hidden;
        text-align: center;
        white-space: nowrap;
    }

    &__increase,
    &__decrease {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        position: absolute;
        width: 12px;
        height: 12px;
        right: 4px;
        border-left: none;
        color: #636c78;
        cursor: pointer;

        &:hover {
            color: black;
        }

        &--disabled {
            opacity: 0.6;
            cursor: not-allowed;

            &:hover {
                color: @normal-color;
            }
        }

        .eui-v2-icon {
            height: 4px;
            width: 8px;
        }
    }

    &__increase {
        top: 8px;
    }
    &__decrease {
        bottom: 8px;
    }

    &-list {
        width: 104px;
        transform: translateX(-49px);
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        border: none;
    }
}

.eui-v2-dropdown-font-size-popup {
    z-index: 15;
}
</style>
