<template>
    <div :class="[bem(''), bem([threeMode && 'three'])]">
        <color-picker-panel
            :value="color"
            :show-straw="showStraw"
            format="hex8"
            :cmykMode="cmykMode"
            :enableAlpha="!threeMode"
            @input="handleColorInput"
            @click-straw="$emit('open-straw', $event)"
            :enablePalette="enablePalette"
        >
            <template #header>
                <div :class="bem('header')">
                    <GradientPicker
                        :class="bem('gradient-picker')"
                        :angle="gradient.angle"
                        :stops="gradient.stops"
                        :current-stop-index="currentStopIndex"
                        @change-stops="handleStopsChange"
                        @change-current-stop="handleCurrentStopChange"
                    />
                    <Select
                        v-if="threeMode"
                        :options="faceOptions"
                        :value="gradient.face"
                        placement="bottom-center"
                        :popClass="bem('angle-select__pop')"
                        :menuClass="bem('angle-select__menu')"
                        @select="handleSelectFace"
                    >
                        <template #toggle="{ label, open }">
                            <div :class="bem('angle-select')" @click="open">
                                <span>{{ label }}</span>
                                <Icon name="arrow-down" />
                            </div>
                        </template>
                    </Select>
                    <DegreeInput
                        :class="bem('degree-input')"
                        :value="Math.round(gradient.angle)"
                        @change="handleAngleChange"
                    />
                </div>
            </template>
        </color-picker-panel>
    </div>
</template>
<script>
import ColorPickerPanel from '../../base/color-picker-panel/index.vue';
import GradientPicker from '../../base/gradient-picker/index.vue';
import DegreeInput from '../../base/degree-input/index.vue';
import { defaultGradientPreset } from './const';
import Icon from '../../base/icon/index.vue';
import Select from './select.vue';
import { isGradientColor } from '../../utils/color';
// import { isEqualGradient } from './utils';
import { i18n } from '../../i18n';

export default {
    name: 'eui-v2-gradient-color-picker',
    components: {
        ColorPickerPanel,
        GradientPicker,
        DegreeInput,
        Icon,
        Select,
    },
    props: {
        gradient: {
            type: Object,
            default: () => defaultGradientPreset.list[0],
        },
        threeMode: {
            type: Boolean,
            default: false,
        },
        gradientMaxStop: {
            type: Number,
            default: Infinity,
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        showStraw: {
            type: Boolean,
            default: true,
        },
        enablePalette: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            currentStopIndex: 0,
            faceOptions: [
                { name: i18n.$tsl('正面渐变'), value: 0 },
                { name: i18n.$tsl('侧面渐变'), value: 1 },
            ],
            faceMenuVisible: false,
        };
    },
    computed: {
        color() {
            const { gradient, currentStopIndex = 0 } = this;
            return gradient.stops[currentStopIndex].color;
        },
    },
    methods: {
        onChange(gradient) {
            this.$emit('change', gradient);
        },
        handleColorInput(color) {
            const _gradient = { ...this.gradient };
            _gradient.stops[this.currentStopIndex].color = color;
            this.onChange(_gradient);
        },
        handleStopsChange(stops) {
            if (stops.length < 2) return;
            if (stops.length > this.gradientMaxStop) {
                return (this.tooltipContent = `仅支持添加${this.gradientMaxStop}个颜色`);
            }
            this.tooltipContent = '';
            const data = { ...this.gradient, stops };
            this.onChange(data);
        },
        handleCurrentStopChange(stop, stopIndex) {
            this.currentStopIndex = stopIndex;
        },
        handleAngleChange(angle) {
            this.onChange({ ...this.gradient, angle });
        },
        handleAngleSelectClick() {
            this.faceMenuVisible = !this.faceMenuVisible;
        },
        handleSelectFace(face) {
            const value = typeof face === 'number' ? face : face.value;
            this.onChange({ ...this.gradient, face: value });
        },
        handleSelectSwatch(color) {
            if (isGradientColor(color)) {
                this.onChange(color);
            } else {
                this.handleColorInput(color);
            }
        },
    },
};
</script>
<style lang="less">
.eui-v2-gradient-color-picker {
    &__header {
        margin-bottom: 12px;
        display: flex;
        align-items: center;
    }

    &__gradient-picker {
        flex: 1;
    }

    &__degree-input {
        margin-left: 8px;
        width: 64px;
        height: 28px;
    }

    &__angle-select {
        flex: 1;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f6f7f9;
        cursor: pointer;

        &__menu {
            width: 180px;
        }
        &__pop {
            margin-top: -60px;
        }
    }

    &--three &__header {
        flex-wrap: wrap;
    }

    &--three &__gradient-picker {
        width: 100%;
        flex: auto;
        margin-bottom: 14px;
    }
    &--three &__degree-input {
        width: 56px;
        height: 32px;
    }
}
</style>
