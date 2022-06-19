<template>
    <div class="eui-v2-gradient-picker-panel">
        <div class="eui-v2-gradient-picker-panel__gradient">
            <tooltip
                :content="tooltipContent"
                placement="bottom-center"
                trigger="click"
                classes="eui-v2-gradient-picker-panel__tip"
            >
                <gradient-picker
                    class="eui-v2-gradient-picker-panel__gradient-picker"
                    :angle="angle"
                    :stops="stops"
                    :current-stop-index="currentStopIndex"
                    :presets="gradientPresets"
                    @change-stops="handleStopsChange"
                    @change-current-stop="handleCurrentStopChange"
                    @mousedown-stop="handleStopMousedown"
                />
            </tooltip>
            <dropdown-button
                class="eui-v2-gradient-picker__link"
                placement="bottom-end"
                :as-ref-width="false"
            >
                <template #dropdown="dropdown">
                    <div class="eui-v2-gradient-picker__dropdown">
                        <div class="eui-v2-gradient-picker__preset">
                            <div class="eui-v2-gradient-picker__preset-container">
                                <image-list
                                    :list="presetImages"
                                    :image-width="54"
                                    :image-height="50"
                                    :gap-x="4"
                                    :gap-y="4"
                                    @change="handlePresetImageChange(dropdown, ...arguments)"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </dropdown-button>
        </div>
        <color-picker-panel
            ref="colorPickerPanel"
            class="eui-v2-gradient-picker-panel__color"
            :value="currentStop.color"
            :format="format"
            :enable-alpha="enableAlpha"
            :cmyk-mode="cmykMode"
            :show-straw="showStraw"
            :straw-activated="strawActivated"
            @click-straw="$emit('click-straw', $event)"
            @change="handleColorChange"
        />
        <div class="eui-v2-gradient-picker-panel__angle">
            <DegreeInput :value="formatAngle(inputAngle)" align="right" @change="handleAngleChange">
                <template slot="label">
                    <Select
                        class="eui-v2-gradient-picker-panel__angle-select"
                        class-select="eui-v2-gradient-picker-panel__angle-select-pop"
                        fill="clear"
                        v-if="threeMode"
                        v-model="face"
                        :options="gradientTypes"
                        :asRefWidth="false"
                        size="middle"
                        @change="emitChange"
                    />
                    <span v-else>{{$tsl('渐变角度')</span>
                </template>
            </DegreeInput>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import GradientPicker from '../gradient-picker';
import ColorPickerPanel from '../color-picker-panel';
import Select from '../select';
import DropdownButton from '../dropdown-button';
import ImageList from '../image-list';
import Tooltip from '../../base/tooltip';
import DegreeInput from '../../base/degree-input';
import { gradientPropsMixin } from './gradient-props-mixin';
import { i18n } from '../../i18n';

export default {
    components: {
        Select,
        Tooltip,
        DropdownButton,
        ImageList,
        // DegreeDisk,
        GradientPicker,
        ColorPickerPanel,
        DegreeInput,
    },
    mixins: [gradientPropsMixin],
    data() {
        const angle =
            !this.gradient || !this.gradient.angle === undefined ? 90 : this.gradient.angle;
        return {
            currentStopIndex: 0,
            stops: [
                { color: '#fff', offset: 0 },
                { color: '#000', offset: 1 },
            ],
            angle,
            face: this.gradientTypes[0].value,
            tooltipContent: '',
            inputAngle: angle,
        };
    },
    computed: {
        currentStop() {
            return this.stops[this.currentStopIndex] || this.stops[this.currentStopIndex - 1];
        },
        presetImages() {
            return this.gradientPresets.map((preset) =>
                this.getGradientString(preset.angle, preset.stops),
            );
        },
    },
    watch: {
        gradient: {
            deep: true,
            handler(gradient) {
                if (gradient) {
                    const { stops, angle, face = 0 } = gradient;
                    this.angle = angle;
                    this.stops = [].concat(stops);
                    this.face = this.gradientTypes[face].value;
                }
            },
            immediate: true,
        },
        angle(val) {
            // 激活时不更新
            if (this.$refs.input === document.activeElement) {
                return;
            }
            this.inputAngle = val;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        getGradientString(angle, stops) {
            return `linear-gradient(${90 - angle}deg, ${stops.map(
                (stop) => `${stop.color} ${stop.offset * 100}%`,
            )})`;
        },
        emitChange() {
            this.$emit('change', {
                angle: this.angle,
                stops: this.stops.map((stop) => Object.assign({}, stop)),
                face: this.face,
            });
        },
        handleStopsChange(stops, emitChange = true) {
            const MIN_STOP_NUM = 2;
            const isAddStop =
                stops.length !== this.stops.length && stops.length > this.gradientMaxStop;
            const isInvalid = stops.length < MIN_STOP_NUM;
            if (isAddStop || isInvalid || !this.gradientStopDraggable) {
                if (isAddStop) {
                    this.tooltipContent = `仅支持添加${this.gradientMaxStop}个颜色`;
                }
            } else {
                this.tooltipContent = '';
                this.stops = stops;
                if (emitChange) {
                    this.emitChange();
                }
            }
        },
        handleAngleChange(angle, emitChange = true) {
            this.angle = angle;
            this.inputAngle = angle;
            if (emitChange) {
                this.emitChange();
            }
        },
        handleColorChange(color) {
            this.currentStop.color = color._color.toHex8String();
            this.emitChange();
        },
        handleCurrentStopChange(stop, stopIndex) {
            if (this.stops.includes(stop)) {
                this.tooltipContent = '';
                this.currentStopIndex = stopIndex;
            }
        },
        handlePresetImageChange(dropdown, image, imageIndex) {
            dropdown.close();
            this.handleAngleChange(this.gradientPresets[imageIndex].angle, false);
            this.handleStopsChange(this.gradientPresets[imageIndex].stops, false);
            this.handleCurrentStopChange(this.stops[0], 0);
            this.emitChange();
        },
        handleStopMousedown() {
            // this.$refs.colorPickerPanel.selectInput();
        },
    },
};
</script>

<style lang="less">
@border-color: #dfe3ed;

.eui-v2-gradient-picker-panel {
    &__gradient {
        margin-bottom: 14px;
        display: flex;
        box-sizing: border-box;
        height: 50px;
        padding: 0 14px;
        padding: 11px 14px;
        border-bottom: 1px solid @border-color;
        &-picker {
            margin-right: 4px;
            flex: 1;
        }
    }
    &__color {
        padding-bottom: 20px;
    }
    &__angle {
        display: flex;
        box-sizing: border-box;
        height: 60px;
        border-top: 1px solid @border-color;
        user-select: none;

        align-items: center;
        justify-content: space-between;

        .eui-v2-degree-input {
            width: 100%;
            padding: 0 10px;
            .eui-v2-degree-input__label {
                & > .eui-v2-button {
                    margin-right: 3px;
                }
                & > span {
                    margin-right: 33px;
                }
            }
        }

        .eui-v2-degree-disk__pan {
            flex: 1 0 48px;
        }

        &-select.eui-v2-dropdown-button {
            padding-right: 28px;
            padding-left: 0;
        }
        &-select-pop {
            margin-top: -5px;
            width: 110px;
        }
    }

    &__tip.eui-v2-tooltip {
        pointer-events: none;
        .eui-v2-tooltip-content {
            padding: 5px 8px;
            font-size: 12px;
            border-radius: 3px;
            cursor: default;
        }
    }
}

.eui-v2-gradient-picker {
    &__link.eui-v2-dropdown-button {
        box-sizing: content-box;
        width: 28px;
        height: 24px;
        padding: 0;

        flex-shrink: 0;
        .eui-v2-dropdown-button__suffix {
            right: 10px;
        }
    }
    &__dropdown {
        width: 256px;
        max-height: 295px;
        padding: 16px 0;
        border: 1px solid #dfe3ed;
        font-size: 14px;
        box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.06);
        color: #000;
        background: #fff;
        transform: translate(15px, 6px);
    }
    &__preset {
        &-label {
            margin: 14px;
        }
        &-container {
            padding: 0 0 0 14px;
            overflow: auto;
        }
    }
}
</style>
