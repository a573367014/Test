<template>
    <div class="eui-v2-editor-color-panel">
        <Popup
            v-if="presetColors"
            :visible.sync="showPresetColors"
            :placement="placement"
            force-placement
            :as-ref-width="!presetWidth"
            :appendBody="false"
        >
            <div class="eui-v2-editor-color-panel__label" @click="closeColorsPopupByHead">
                {{ label }}
                <div
                    class="eui-v2-editor-color-panel__more"
                    :disabled="disabled"
                    v-if="hasPresetColors"
                    @click.stop="togglePreset()"
                >
                    <Icon name="palette" />
                </div>
            </div>
            <template slot="content" v-if="hasPresetColors">
                <DropdownMenus
                    class="eui-v2-color-panel-popup-preset"
                    :data-type="presetType"
                    :style="presetSize"
                >
                    <template v-if="presetType === 'color'">
                        <div class="eui-v2-color-panel-popup-preset__label">
                            {{ presetLabel }}
                        </div>
                        <div class="eui-v2-color-panel-popup-preset__list">
                            <div
                                class="eui-v2-color-panel-popup-preset__list__colors"
                                v-for="(colors, index) in presetColors"
                                :key="index"
                                @click="onPresetClick(colors)"
                            >
                                <ColorCube
                                    class="eui-v2-color-panel-popup-preset__list__colors__color"
                                    innerClass="eui-v2-color-panel-popup-preset__list__colors__color__inner"
                                    v-for="(color, index) in colors"
                                    :key="index"
                                    :color="color"
                                />
                            </div>
                        </div>
                    </template>
                    <div v-else-if="presetType === 'material'">
                        <div class="eui-v2-color-panel-popup-preset__label">
                            {{ $tsl('材质预设') }}
                        </div>
                        <material-picker-panel
                            :material="material"
                            :presets="materialPresets"
                            :ossResizeUrl="ossResizeUrl"
                            @change="onChange({ type: 'material-preset', data: $event })"
                        />
                    </div>
                </DropdownMenus>
            </template>
        </Popup>

        <Popup
            :visible="activateIndex !== -1"
            @update:visible="onClosePicker"
            placement="bottom-center"
            :position="{ left: -24 }"
        >
            <div
                :class="[bem('colors'), isMultiColors && bem('colors', 'multi-colors')]"
                @click="togglePicker(-1)"
            >
                <div
                    v-if="disabled || multiple"
                    class="eui-v2-editor-color-panel__status"
                    :class="{
                        'is-disabled': disabled,
                    }"
                    @click.stop="!disabled && togglePicker(0)"
                >
                    {{ disabled ? $tsl('不可修改颜色') : multiple ? $tsl('多种颜色') : '' }}
                </div>
                <ColorCube
                    v-else
                    :class="bem('colors__item')"
                    v-for="(color, index) in colors"
                    :key="index"
                    :color="color"
                    @click.native.stop="togglePicker(index)"
                />
            </div>
            <template slot="content">
                <ColorPicker
                    ref="colorPicker"
                    :class="bem('color-picker', threeMode && '3d')"
                    :type="threeMode ? 'three-albedo-filling' : type"
                    :value="colors[activateIndex]"
                    :editor="editor"
                    :threeMode="threeMode"
                    :material="material"
                    :normalMap="normalMap"
                    :showStraw="showStraw"
                    @import="onImportFile($event)"
                    @change="onChange"
                    @presetChange="$forceUpdate()"
                />
            </template>
        </Popup>
    </div>
</template>

<script>
import Vue from 'vue';
import Icon from '../../base/icon';
import Popup from '../../base/popup';
import DropdownMenus from '../../base/dropdown-menus';
import ColorPicker from '../color-picker';
import MaterialPickerPanel from '../../base/material-picker-panel';
import ColorCube from '../color-picker/color-cube';
import { i18n } from '../../i18n';

export default {
    name: 'eui-v2-editor-color-panel',
    components: {
        Icon,
        Popup,
        ColorPicker,
        MaterialPickerPanel,
        DropdownMenus,
        ColorCube,
    },
    props: {
        enablePreset: {
            type: Boolean,
            default: true,
        },
        label: {
            type: String,
            default: () => i18n.$tsl('颜色'),
        },
        colors: {
            type: [String, Object, Array],
            required: true,
        },
        placement: {
            type: String,
            default: () => 'bottom-end',
        },
        format: {
            type: String,
            default: () => 'hex',
        },
        mapPresets: {
            type: Array,
            default: () => [
                {
                    name: i18n.$tsl('无'),
                    value: 'none',
                    images: [],
                },
            ],
        },
        material: {
            type: Object,
            default: () => ({}),
        },
        materialPresets: {
            type: Array,
            default: () => [],
        },
        presetType: {
            type: String,
            default: () => 'color',
        },
        showStraw: {
            type: Boolean,
            default: true,
        },
        strawActivated: {
            type: Boolean,
            default: false,
        },
        clickStraw: {
            type: Function,
            default: () => {},
        },
        presetColors: {
            type: Array,
            default: () => [],
        },
        presetLabel: {
            type: String,
            default: () => i18n.$tsl('预设'),
        },
        presetWidth: {
            type: [Number, String],
            default: function () {
                const presetTypeToPresetWidthMap = {
                    material: 258,
                };
                return presetTypeToPresetWidthMap[this.presetType] || '';
            },
        },
        enableAlpha: {
            type: Boolean,
            default: Boolean,
        },
        multiple: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        gradientMaxStop: {
            type: Number,
            default: 0,
        },
        gradientStopDraggable: {
            type: Boolean,
            default: true,
        },
        gradientEnableAlpha: {
            type: Boolean,
            default: false,
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        editor: {
            type: Object,
            default: () => ({}),
        },
        ossResizeUrl: {
            type: Boolean,
            default: true,
        },
        designMode: {
            type: Boolean,
            default: true,
        },
        threeMode: {
            type: Boolean,
            default: false,
        },
        normalMap: {
            type: Object,
            default: () => ({}),
        },
        normalMapPresets: {
            type: Array,
            default: () => [],
        },
        options: {
            type: Object,
            default: () => ({}),
        },
        type: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            activateIndex: -1,
            showPresetColors: false,
            cacheTab: null,
        };
    },
    computed: {
        hasPresetColors() {
            const { presetColors, presetType, materialPresets, enablePreset } = this;
            if (!enablePreset) return false;
            return (
                (presetType === 'color' && presetColors && presetColors.length) ||
                (presetType === 'material' && materialPresets && materialPresets.length)
            );
        },
        isMultiColors() {
            return this.colors.length > 5;
        },
        presetSize() {
            const height = window.innerHeight;
            const { presetWidth } = this;

            return {
                width: presetWidth ? `${presetWidth}px` : '',
                height: `${Math.floor(height * 0.4)}px`,
            };
        },
        activateColor() {
            let colors = this.colors;
            if (!Array.isArray(colors)) {
                colors = [colors];
            }

            return colors.map((color) => this.genColorGroup(color))[this.activateIndex];
        },
        activateElement() {
            const { activateIndex, $refs } = this;
            return $refs.colorRef ? $refs.colorRef[activateIndex] : null;
        },
    },
    watch: {
        activateIndex(value) {
            this.editor.options.scopePointerEventsEnable = value === -1;
        },
        showPresetColors(value) {
            this.editor.options.scopePointerEventsEnable = !value;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        closeColorsPopupByHead() {
            if (this.showPresetColors) {
                this.showPresetColors = false;
            }
        },
        togglePicker(index) {
            if (this.activateIndex === -1) {
                this.$emit('change-visible', true);
            } else if (this.activateIndex === index) {
                this.$emit('change-visible', false);
            }
            this.activateIndex = this.activateIndex === index ? -1 : index;
            this.$emit('change-current-color', this.activateColor, index);
        },
        onChange({ data, type }) {
            const index = this.activateIndex;
            const result = {
                type,
                data,
                index,
            };
            this.$emit('change', result);
        },
        onImportFile($event) {
            const index = this.activateIndex;
            this.$emit('import', {
                index: index,
                data: $event,
            });
        },
        onClosePicker() {
            if (!this.$refs.colorPicker.strawActivated) {
                this.togglePicker(this.activateIndex);
            }
        },
        togglePreset() {
            if (this.disabled) {
                return;
            }
            this.showPresetColors = !this.showPresetColors;
        },
        onPresetClick(colors) {
            this.$emit('preset-click', colors);
            this.showPresetColors = false;
        },
        getGradientString(angle, stops) {
            return `linear-gradient(${90 - angle}deg, ${stops.map(
                (stop) => `${stop.color} ${stop.offset * 100}%`,
            )})`;
        },
        genColorGroup(color) {
            const colorObj = {};
            colorObj.visible = false;
            if (typeof color === 'string' || !color || color.color) {
                colorObj.map = {};
                colorObj.color = color.color || color;
                colorObj.tab = this.cacheTab || 'color';
            } else if (color.stops) {
                colorObj.map = {};
                colorObj.color = null;
                colorObj.gradient = color;
                colorObj.tab = 'gradient';
            } else {
                colorObj.map = color;
                colorObj.color = null;
                colorObj.tab = 'map';
            }
            return Vue.observable(colorObj);
        },
    },
};
</script>
<style lang="less">
.eui-v2-editor-color-panel {
    display: block;
    user-select: none;
    border-radius: 4px;
    // 这里是为了让 label 中的调色 icon 可以居中
    padding: 12px 0 16px;

    &__label {
        padding: 0 16px;
        position: relative;
        font-size: 13px;
        line-height: 20px;
        color: #33383e;
        font-weight: 500;
        margin-bottom: 10px;
    }

    &__more {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;

        .eui-v2-icon {
            display: block;
            font-size: 14px;
            color: #636c78;

            &:hover {
                color: #33383e;
            }
        }

        &[disabled] {
            cursor: not-allowed;
            .eui-v2-icon {
                color: @disabled-color;
            }
        }
    }

    &__colors {
        padding: 0 16px;
        display: flex;
        margin: -1px -3px;
        margin-bottom: -6px;

        &--multi-colors {
            flex-wrap: wrap;
        }

        &--multi-colors &__item {
            flex-grow: 0;
            width: 21.9%;
            margin-bottom: 6px;
        }

        &__item {
            height: 24px;
            margin: 0 3px;
            flex-grow: 1;
            cursor: pointer;

            &__color {
                &::before {
                    content: '';
                    display: none;
                    position: absolute;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    background-color: transparent;
                    border-radius: 4px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    transition: 0.2s ease border;
                }

                &:hover {
                    &::before {
                        border-color: rgba(0, 0, 0, 0.25);
                    }
                }
            }
        }
    }

    &__status {
        width: 100%;
        border-radius: 4px;
        border: 1px dashed rgba(151, 151, 151, 1);
        text-align: center;
        padding: 6px 0;
        font-size: 12px;
        cursor: pointer;

        &.is-disabled {
            color: rgba(190, 195, 201, 1);
            background: rgba(240, 243, 244, 1);
            cursor: not-allowed;
        }
    }

    &__color-picker--3d {
        min-height: 500px;
    }
}

.eui-v2-color-panel-popup-preset {
    min-width: 210px;
    min-height: 200px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0;

    &[data-type='material'] {
        padding: 0;
    }

    &__label {
        font-size: 14px;
        line-height: 20px;
        border-bottom: 1px solid @border-color;
        font-weight: 500;
        padding: 10px 16px;
        color: #000;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -3px;
        padding: 4px 16px;

        &__colors {
            padding: 6px 3px;
            width: 33%;
            box-sizing: border-box;
            display: flex;
            flex-wrap: nowrap;

            &__color {
                width: 100%;
                height: 28px;
                border-radius: 4px;

                &:first-child &__inner {
                    border-top-left-radius: 4px;
                    border-bottom-left-radius: 4px;
                }

                &:last-child &__inner {
                    border-top-right-radius: 4px;
                    border-bottom-right-radius: 4px;
                }
                & &__inner {
                    cursor: pointer;
                    border-radius: 0;

                    &.border {
                        border-top: 1px solid @dark-border-color;
                        border-bottom: 1px solid @dark-border-color;

                        &:first-child {
                            border-left: 1px solid @dark-border-color;
                        }

                        &:last-child {
                            border-right: 1px solid @dark-border-color;
                        }
                    }
                }
            }
        }
    }
}
</style>
