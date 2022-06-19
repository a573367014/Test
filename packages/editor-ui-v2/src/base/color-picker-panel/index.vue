<template>
    <div class="eui-v2-color-picker-panel">
        <div
            class="eui-v2-color-picker-panel__tip"
            :class="{ 'eui-v2-color-picker-panel__tip--warn': !inCMYK }"
            v-if="cmykMode && enablePalette"
        >
            <span v-if="loadingCMYK">正在加载 CMYK 模块</span>
            <div v-else>
                <span v-show="!inCMYK">
                    该颜色可能无法正确印刷
                    <span class="eui-v2-color-picker-panel__tip__link" @click="adjustCMYK">
                        调整
                    </span>
                </span>
                <span v-show="inCMYK">该颜色支持印刷</span>
            </div>
        </div>
        <slot name="header" />
        <div class="eui-v2-color-picker-panel__saturation__container" v-if="enablePalette">
            <Saturation :value="colors" @change="colorChange($event, null, 'saturation')" />
        </div>
        <div class="eui-v2-color-picker-panel__slider" v-if="enablePalette">
            <div class="eui-v2-color-picker-panel__slider__container" v-if="enableColor">
                <Hue :value="colors" :lockHls="!!lastSaturationColor" @change="colorChange" />
            </div>
            <div class="eui-v2-color-picker-panel__slider__container" v-if="enableAlpha">
                <Alpha :value="colors" @change="colorChange" />
            </div>
        </div>
        <div :class="bem('footer')" v-if="enablePalette">
            <div
                v-if="showStraw"
                :class="[bem('picker-button'), 'eui-v2-control']"
                @click.stop="onStrawClick"
            >
                <Icon
                    :class="bem('picker-button__icon')"
                    :name="activeStraw ? 'straw-active' : 'straw'"
                />
            </div>
            <EditableInput
                v-if="enableInput"
                :inputClass="[bem('input'), 'eui-v2-control']"
                :value="hex"
                label="hex"
                @change="onInputChange"
                ref="editableInput"
            />
            <Input
                v-if="enableAlpha"
                :class="[bem('input'), bem('alpha-input'), 'eui-v2-control']"
                :disabled="!enableAlpha"
                :value="alpha"
                @focus="handleAlphaInputFocus"
                @blur="onAlphaInputChange"
                ref="alphaInput"
            />
        </div>
    </div>
</template>

<script>
import colorMixin from './color-mixin.shim';
import Saturation from './saturation.shim';
import Hue from './hue.vue';
import Alpha from './alpha.vue';
import EditableInput from './editable-input.vue';
import tinycolor from 'tinycolor2';
import { getCMYKService } from '../../utils/cmyk-service';
import { colorPropsMixin } from './color-props-mixin';
import Icon from '../icon/index.vue';
import Input from '../input/index.vue';

export default {
    name: 'eui-v2-color-picker-panel',
    components: {
        Saturation,
        Hue,
        Alpha,
        EditableInput,
        Icon,
        Input,
    },
    props: {
        enablePalette: {
            type: Boolean,
            default: true,
        },
    },
    mixins: [colorMixin, colorPropsMixin],
    data() {
        return {
            loadingCMYK: true,
            cmykService: null,
            activeStraw: false,
        };
    },
    computed: {
        hex() {
            const { colors } = this;
            const hex = colors.hex || colors;
            return hex;
        },
        inCMYK() {
            const { cmykMode, cmykService, hex } = this;
            if (hex && cmykMode && cmykService) {
                const { r, g, b } = tinycolor(hex).toRgb();
                return cmykService.inGamut([r, g, b, 255]);
            }
            return true;
        },
        alpha() {
            return (this.colors.a * 100).toFixed(0) + '%';
        },
    },
    watch: {
        cmykMode: {
            immediate: true,
            handler: function (newValue) {
                if (newValue) {
                    this.loadingCMYK = true;
                    getCMYKService().then((cmykService) => {
                        this.cmykService = cmykService;
                        this.loadingCMYK = false;
                    });
                }
            },
        },
    },
    created() {
        this.initPasteEvent();
    },
    beforeDestroy() {
        const colors = this.colors;
        if (colors && colors.rgba && this.hasChanged && this.autoSwatchesHistory) {
            this.addColor(colors.rgba);
        }
        this.destroyPasteEvent();
    },
    methods: {
        selectColor(color) {
            if (color) {
                this.colorChange(color);
            }
            this.activeStraw = false;
        },
        addColor(color) {
            color = tinycolor(color);

            this.removeColor(color);

            const format = this.format;
            const swatches = this.swatches;
            const colorStr = color.toString(format);

            swatches.unshift(colorStr);

            // Limit
            if (swatches.length > this.swatchesHistoryMax) {
                swatches.pop();
            }

            return colorStr;
        },
        removeColor(color) {
            color = tinycolor(color);

            const format = this.format;
            const swatches = this.swatches;
            const colorStr = color.toString(format);
            const colorIdx = swatches.findIndex((item) => {
                return colorStr === tinycolor(item).toString(format);
            });

            if (colorIdx > -1) {
                swatches.splice(colorIdx, 1);
            }

            return colorIdx;
        },
        onInputChange(data) {
            if (!data) {
                return;
            }
            if (data.hex && this.isValidHex(data.hex)) {
                this.colorChange({
                    hex: data.hex,
                    source: 'hex',
                });
            } else if (data.r || data.g || data.b || data.a) {
                this.colorChange({
                    r: data.r || this.colors.rgba.r,
                    g: data.g || this.colors.rgba.g,
                    b: data.b || this.colors.rgba.b,
                    a: data.a || this.colors.rgba.a,
                    source: 'rgba',
                });
            }
        },
        onAlphaInputChange(_, e) {
            const validAlpha = (a) => {
                if (!/^\d+%?$/.test(a)) return false;
                const parsedValue = parseFloat(a);
                return parsedValue >= 0 && parsedValue <= 100;
            };
            const value = e.target.value;
            const alphaStr = validAlpha(value) ? value : this.cacheAlphaStr;
            const a = parseFloat(alphaStr) / 100;
            if (a === this.colors.a) {
                this.$refs.alphaInput.$forceUpdate();
                return;
            }
            const color = {
                r: this.colors.rgba.r,
                g: this.colors.rgba.g,
                b: this.colors.rgba.b,
                a,
                source: 'rgba',
            };
            this.colorChange(color);
        },
        handleAlphaInputFocus() {
            this.cacheAlphaStr = this.alpha;
        },
        adjustCMYK() {
            const { hex, cmykService } = this;
            const { r, g, b, a } = tinycolor(hex).toRgb();
            const outputBuffer = cmykService.transform([r, g, b, a]);
            this.colorChange({
                r: outputBuffer[0],
                g: outputBuffer[1],
                b: outputBuffer[2],
                a: 255,
            });
        },
        selectInput() {
            if (this.$refs.editableInput) {
                this.$refs.editableInput.selectAll();
            }
        },
        initPasteEvent() {
            document.body.addEventListener('paste', this.handlePaste);
        },
        handlePaste(e) {
            const input = this.$refs.editableInput.$refs.input;
            if (input !== document.activeElement) {
                return;
            }
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const color = tinycolor(paste);
            if (color.isValid()) {
                this.colorChange(color.toHsl());
                setTimeout(() => {
                    input.value = color.toHexString().toUpperCase();
                });
            }
        },
        destroyPasteEvent() {
            document.body.removeEventListener('paste', this.handlePaste);
        },
        onStrawClick() {
            this.activeStraw = !this.activeStraw;
            this.$emit('click-straw', { selectColor: this.selectColor });
        },
    },
};
</script>

<style lang="less">
.eui-v2-color-picker-panel {
    user-select: none;
    padding: 0 14px 12px;
    &__saturation__container {
        margin-bottom: 14px;
        position: relative;
        height: 140px;

        .vc-saturation {
            overflow: hidden;
        }

        .vc-saturation,
        .vc-saturation--black {
            border-radius: 4px;
        }

        .vc-saturation-circle {
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
            border: 2px solid #fff;
            transform: translate(-10px, -10px);
            height: 20px;
            width: 20px;
        }
    }

    &__slider {
        &__container {
            position: relative;
            height: 8px;
            margin-top: 13px;

            &:first-child {
                margin-top: 0;
            }

            .vc-hue,
            .vc-alpha-gradient {
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
                border-radius: 5px;
            }

            .vc-hue-picker,
            .vc-alpha-picker {
                background: none;
                border-radius: 50%;
                border: 5px solid #fff;
                height: 8px;
                width: 8px;
                transform: translate(-8px, -5px);
                box-sizing: content-box;
            }
        }
    }

    &__footer {
        margin-top: 16px;
        height: 32px;
        display: flex;
        align-items: center;

        .vc-editable-input {
            height: 100%;
            flex: 1;
            box-sizing: border-box;
            flex-shrink: 0;
            box-sizing: border-box;
        }

        .vc-input__input {
            height: 100%;
            width: 100%;
        }

        .vc-input__label {
            display: none;
        }
    }

    &__tip {
        text-align: center;
        background-color: @hover-background-color;
        color: #000;
        font-size: 12px;
        line-height: 17px;
        padding: 5px 0 6px;
        margin-bottom: 8px;
        border-radius: 4px;

        &--warn {
            background-color: @warn-color;
        }

        &__link {
            padding-left: 6px;
            color: @primary-color;
            cursor: pointer;

            &:hover {
                color: @primary-color-light;
            }
        }
    }

    &__picker-button {
        margin-right: 8px;
        width: 56px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        &__icon {
            padding: 0;
            width: 20px;
            height: 20px;
            font-size: 20px;
        }
    }

    &__input {
        color: #33383e;
        font-size: 14px;
        text-align: center;
        outline: none;
        box-sizing: border-box;
    }

    &__alpha-input {
        margin-left: 8px;
        width: 56px;
        height: 100%;
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        > input {
            width: 100%;
            padding: 0;
            text-align: center;
            color: inherit;
            font-size: inherit;
        }
    }

    .vc-hue-picker,
    .vc-alpha-picker {
        border-width: 4px;
    }
    .vc-hue-container,
    .vc-alpha-container {
        margin: 0 4px;
    }

    .vc-hue-picker {
        transform: translate(-8px, -5px);
    }
    .vc-alpha-picker {
        transform: translate(-8px, -5px);
    }
    .vc-alpha {
        border-radius: 5px;
    }
}
</style>
