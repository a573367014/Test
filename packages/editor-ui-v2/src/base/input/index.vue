<style lang="less">
    .eui-v2-input {
        border: 1px solid @border-color;
        border-radius: @button-border-radius;
        display: inline-block;
        color: black;
        font-size: 14px;
        line-height: 20px;

        &:hover:not(.eui-v2-input--disabled) {
            border-color: @hover-border-color;
        }

        &--block {
            display: block;

            input {
                width: 100%;
            }
        }

        &--dropdown {
            display: flex;
            align-items: center;

            .eui-v2-input__controll {
                flex-grow: 1;
                padding-right: 0;
            }

            > .eui-v2-input__dropdown-icon {
                display: block;
            }
        }

        &__controll {
            padding: 10px 16px;
            border-radius: @button-border-radius;
            color: black;
            font-size: 14px;
            line-height: 20px;
            background: transparent;
            outline: none;
            border: none;
            display: block;
            box-sizing: border-box;
            cursor: pointer;

            &:disabled {
                color: @disabled-color;
                cursor: not-allowed;

                &::placeholder {
                    color: @disabled-color
                }
            }

            &:focus {
                cursor: text;
            }
        }

        &__dropdown-icon {
            display: none;
            padding: 0 16px;
            cursor: pointer;
            font-size: 16px;
            >svg {
                margin-top: 6px;
            }
        }

        &--disabled {
            .eui-v2-input__dropdown-icon{
                cursor: not-allowed;
                color: @disabled-color;
            }
        }
    }
</style>

<script lang="jsx">
import Popup from '../popup/index.vue';
import Icon from '../icon/index.vue';

export default {
    model: {
        prop: 'value',
        event: 'change'
    },
    props: {
        value: {
            type: [Number, String],
            default: ''
        },
        type: {
            type: String,
            default: 'text'
        },
        placeholder: {
            type: String,
            default: ''
        },
        block: {
            type: Boolean,
            default: false
        },
        asRefWidth: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        maxLength: {
            type: Number,
            default: null
        },
        autoSelect: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            dropdownVisible: false
        };
    },
    computed: {
        innerClass() {
            const { block, hasDropdown, disabled } = this;

            return {
                'eui-v2-input--block': block,
                'eui-v2-input--dropdown': hasDropdown,
                'eui-v2-input--disabled': disabled
            };
        },
        hasDropdown() {
            const slots = this.$scopedSlots.dropdown ? this.$scopedSlots.dropdown() : this.$slots.dropdown;
            return slots && slots.length;
        }
    },
    methods: {
        onInput(event) {
            this.$emit('change', event.target.value, this);
        },
        onFocus(event) {
            if(this.autoSelect) {
                this.$refs.input.select();
            }

            this.dropdownVisible = true;
            this.$emit('focus', this, event);
        },
        onBlur(event) {
            this.$emit('blur', this, event);
        },
        updateVisible(value) {
            this.dropdownVisible = value;
        },
        closePopup() {
            this.dropdownVisible = false;
        },
        toggleDropdown() {
            if(this.disabled) return;
            this.dropdownVisible = !this.dropdownVisible;
        },
        onEnter(event) {
            event.target.blur();
            this.closePopup();
        }
    },
    render(h) {
        const { innerClass, hasDropdown, placeholder, type, value, disabled, asRefWidth, dropdownVisible, maxLength } = this;
        const input = (
            <div class={['eui-v2-input', innerClass]}>
                <input
                    maxlength={maxLength}
                    ref="input"
                    class="eui-v2-input__controll"
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    disabled={disabled}
                    onInput={this.onInput}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    onKeypress={(e) => {
                        if(e.keyCode === 13) {
                            this.onEnter(e);
                        }
                    }} />
                <div class="eui-v2-input__dropdown-icon" onClick={this.toggleDropdown}>
                    <Icon name="arrow-down"/>
                </div>
            </div>
        );
        /* eslint-enable */
        if(!hasDropdown) {
            return input;
        }

        return (
            <Popup asRefWidth={asRefWidth} placemenet="bottom-center" allow-directions={['bottom', 'top']} visible={dropdownVisible} on={{ 'update:visible': this.updateVisible }} >
                { input }
                <template slot="content">
                    { (this.$scopedSlots.dropdown ? this.$scopedSlots.dropdown({ close: this.closePopup }) : this.$slots.dropdown) }
                </template>
            </Popup>
        );
    }
};
</script>
