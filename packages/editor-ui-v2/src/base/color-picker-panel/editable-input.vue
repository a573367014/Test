<template>
    <div class="vc-editable-input">
        <input
            :aria-labelledby="labelId"
            :class="['vc-input__input', inputClass]"
            v-model="val"
            @keydown="handleKeyDown"
            @input="update"
            @change="handleNativeChange"
            @blur="handleBlur"
            @paste.stop
            v-focusSelect
            ref="input">
        <span
            :for="label"
            class="vc-input__label"
            :id="labelId">{{labelSpanText}}</span>
        <span class="vc-input__desc">{{desc}}</span>
    </div>
</template>

<script>
import focusSelect from '../../utils/directives/focus-select';
export default {
    name: 'editableInput',
    directives: {
        focusSelect
    },
    props: {
        label: {
            type: String,
            default: '',
        },
        labelText: {
            type: String,
            default: '',
        },
        desc: {
            type: String,
            default: '',
        },
        value: {
            type: [String, Number],
            default: '',
        },
        max: {
            type: Number,
            default: 0xffffff
        },
        min: {
            type: Number,
            default: 0
        },
        arrowOffset: {
            type: Number,
            default: 1
        },
        inputClass: {
            type: [String, Array],
            default: ''
        }
    },
    data() {
        return {
            isActive: false,
        };
    },
    computed: {
        val: {
            get() {
                return this.value;
            },
            set(v) {
                // TODO: min
                if(!(this.max === undefined) && +v > this.max) {
                    this.$refs.input.value = this.max;
                }
                else {
                    return v;
                }
            }
        },
        labelId() {
            return `input__label__${this.label}__${Math.random()
                .toString()
                .slice(2, 5)}`;
        },
        labelSpanText() {
            return this.labelText || this.label;
        }
    },
    methods: {
        update(e) {
            this.isActive = true;
            this.handleChange(e.target.value);
        },
        handleNativeChange(e) {
            if(!this.isActive) return;
            /*
             * F -> F00000
             * FF -> FF0000
             * ABC -> AABBCC
             * ABCD -> ABCD00
             * ABCDE -> ABCDE0
             * ABCDEF -> ABCDEF
             * ABCDEF123 -> ABCDEF
             */
            const format = val => {
                if(val.length === 3) {
                    val = val
                        .split('')
                        .map(v => v + v)
                        .join('');
                }
                else {
                    val += '00000';
                }

                val = val.slice(0, 6);
                return val;
            };
            let { value } = e.target;
            value = value.replace(/^#/, '');
            value = format(value);
            const hasChanged = this.value.slice(1, 7) !== value;
            this.handleChange(value);
            if(!hasChanged) {
                this.$nextTick(() => {
                    this.$refs.input.value = this.value;
                });
            }
        },
        handleChange(newVal) {
            let data = {};
            data[this.label] = newVal;
            if(data.hex === undefined && data['#'] === undefined) {
                this.$emit('change', data);
            }
            else if(newVal.length > 5) {
                this.$emit('change', data);
            }
        },
        handleBlur(e) {
            this.handleNativeChange(e);
            this.$forceUpdate();
        },
        handleKeyDown(e) {
            let val = this.val;
            let number = Number(val);
            this.isActive = true;
            if(number) {
                let amount = this.arrowOffset || 1;

                // Up
                if(e.keyCode === 38) {
                    val = number + amount;
                    this.handleChange(val);
                    e.preventDefault();
                }

                // Down
                if(e.keyCode === 40) {
                    val = number - amount;
                    this.handleChange(val);
                    e.preventDefault();
                }
            }
        },
        selectAll() {
            setTimeout(() => {
                const input = this.$refs.input;
                if(input) {
                    input.focus();
                    if(input.value && input.value.length) {
                        input.setSelectionRange(0, input.value.length);
                    }
                }
            });
        }
    // **** unused
    // handleDrag (e) {
    //   console.log(e)
    // },
    // handleMouseDown (e) {
    //   console.log(e)
    // }
    }
};
</script>

<style lang="less">
.vc-editable-input {
  position: relative;
}
.vc-input__input {
  padding: 0;
  border: 0;
  outline: none;
  cursor: pointer;
  &:focus {
      cursor: text;
  }
}
.vc-input__label {
  text-transform: capitalize;
}
</style>
