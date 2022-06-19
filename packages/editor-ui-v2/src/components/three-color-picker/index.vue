<template>
    <ColorPicker
        class="eui-v2-three-color-picker"
        :format="format"
        :color="color"
        :map="map"
        :map-presets="mapPresets"
        :gradient="gradient"
        :gradient-enable-alpha="gradientEnableAlpha"
        :gradient-presets="gradientPresets"
        :gradient-max-stop="gradientMaxStop"
        :gradient-stop-draggable="gradientStopDraggable"
        :tab="tab"
        :tabs="tabs"
        :enable-alpha="enableAlpha"
        :cmyk-mode="cmykMode"
        :editor="editor"
        :ossResizeUrl="ossResizeUrl"
        :design-mode="designMode"
        :showStraw="showStraw"
        :strawActivated="strawActivated"
        :options="options"
        threeMode
        @click-straw="$emit('click-straw', $event)"
        @update:tab="$emit('update:tab', $event)"
        @import="$emit('import', $event)"
        @change="$emit('change', $event)"
    >
        <template #default="tab">
            <slot :tab="tab" />
            <div class="eui-v2-three-color-picker__footer" v-if="material || normalMap">
                <div class="eui-v2-three-color-picker__section" v-if="material">
                    <RangePicker
                        :label="$tsl('粗糙度')"
                        :labelWidth="70"
                        :min="0"
                        :max="1"
                        v-model="material.roughnessStrength"
                        :inputFormatter="toFixed"
                        @change="handleMateiralChange"
                    />
                    <RangePicker
                        :label="$tsl('金属度')"
                        :labelWidth="70"
                        :min="0"
                        :max="1"
                        v-model="material.metalStrength"
                        :inputFormatter="toFixed"
                        @change="handleMateiralChange"
                    />
                </div>
                <template v-if="normalMap">
                    <div class="eui-v2-three-color-picker__normal-map-section">
                        <Checkbox
                            v-model="normalMap.enabled"
                            @change="handleNormalMapChange({ enabled: $event })"
                        >
                            <span>{{ $tsl('凹凸贴图') }}</span>
                        </Checkbox>
                        <Popup
                            classes="three-map-pop"
                            placement="left-end"
                            :visible.sync="panelVisible"
                        >
                            <i
                                v-show="normalMap.enabled"
                                class="eui-v2-three-color-picker__normal-map-preview"
                                :style="{ backgroundImage: 'url(' + normalMap.url + ')' }"
                                @click="panelVisible = !panelVisible"
                            />
                            <div slot="content" class="eui-v2-three-color-picker__normal-map-list">
                                <ImageSelect
                                    :value="{ value: normalMap.url, type: normalMap.type }"
                                    :list="normalMapPresets"
                                    :image-width="54"
                                    :image-height="50"
                                    :list-height="355"
                                    :gap-x="4"
                                    :gap-y="4"
                                    :ossResizeUrl="ossResizeUrl"
                                    @change="
                                        handleNormalMapChange({
                                            url: $event.value,
                                            type: $event.type,
                                        })
                                    "
                                />
                            </div>
                        </Popup>
                    </div>
                    <div class="eui-v2-three-color-picker__section" v-show="normalMap.enabled">
                        <RangePicker
                            :label="$tsl('凹凸强度')"
                            :labelWidth="70"
                            :min="0"
                            :max="2"
                            v-model="material.normalStrength"
                            :inputFormatter="toFixed"
                            @change="handleMateiralChange"
                        />
                        <RangePicker
                            :label="$tsl('贴图缩放')"
                            :labelWidth="70"
                            :min="0.5"
                            :max="3"
                            v-model="material.scale"
                            :inputFormatter="toFixed"
                            @change="handleMateiralChange"
                        />
                    </div>
                </template>
            </div>
        </template>
    </ColorPicker>
</template>

<script>
import Popup from '../../base/popup';
import ColorPicker from '../color-picker';
import RangePicker from '../range-picker';
import Checkbox from '../../base/checkbox';
import ImageSelect from '../image-select';
import { toFixed } from '../../utils/to-fixed';
import { i18n } from '../../i18n';

export default {
    components: {
        Popup,
        Checkbox,
        ImageSelect,
        ColorPicker,
        RangePicker,
    },
    model: {
        prop: 'color',
        event: 'change-color',
    },

    props: {
        tabs: {
            type: Array,
            default() {
                return ['color', 'gradient', 'map'];
            },
        },
        format: {
            type: String,
            default: 'hex',
        },
        tab: {
            type: String,
            default: '',
        },
        material: {
            type: Object,
            default: () => ({}),
        },
        normalMap: {
            type: Object,
            default: () => ({}),
        },
        normalMapPresets: {
            type: Array,
            default: () => [],
        },
        color: {
            type: String,
            default: '',
        },
        mapPresets: {
            type: Array,
            default: () => [],
        },
        map: {
            type: Object,
            default: () => ({}),
        },
        gradient: {
            type: Object,
            default: () => ({}),
        },
        gradientPresets: {
            type: Array,
            default: () => [],
        },
        gradientMaxStop: {
            type: Number,
            default: 2,
        },
        gradientStopDraggable: {
            type: Boolean,
            default: true,
        },
        gradientEnableAlpha: {
            type: Boolean,
            default: false,
        },
        enableAlpha: {
            type: Boolean,
            default: false,
        },
        rangeFormat: {
            type: Function,
            default: (progress, value) => toFixed(value),
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        autoSelect: {
            type: Boolean,
            default: true,
        },
        editor: {
            type: Object,
            default: null,
        },
        ossResizeUrl: {
            type: Boolean,
            default: true,
        },
        designMode: {
            type: Boolean,
            default: false,
        },
        showStraw: {
            type: Boolean,
            default: false,
        },
        strawActivated: {
            type: Boolean,
            default: false,
        },
        options: {
            type: Object,
            default: () => ({}),
        },
    },

    data() {
        return {
            panelVisible: false,
        };
    },

    methods: {
        $tsl: i18n.$tsl,
        handleMateiralChange() {
            this.$emit('change', {
                type: 'material',
                data: this.material,
            });
        },
        handleNormalMapChange(data) {
            this.$emit('change', {
                type: 'normalMap',
                data: Object.assign({}, this.normalMap, data),
            });
        },
        toFixed,
    },
};
</script>

<style lang="less">
@import '../../styles/variables.less';

.eui-v2-three-color-picker {
    &__footer {
        border-top: 1px solid @border-color;
    }

    &__section {
        padding: 12px 0;
    }

    &__normal-map-section {
        display: flex;
        height: 40px;
        padding: 0 16px;
        border-top: 1px solid #dfe3ed;
        border-radius: 0 0 4px 4px;
        background: #f8fafc;

        align-items: center;
        justify-content: space-between;
    }

    &__normal-map-preview {
        width: 28px;
        height: 22px;
        border-radius: 2px;
        background-size: contain;
        cursor: pointer;
    }

    &__normal-map-list {
        width: 265px;
        padding: 13px 14px;
        box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
        border-radius: 4px;
        background: #fff;
    }
}
</style>
