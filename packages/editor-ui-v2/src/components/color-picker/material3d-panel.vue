<template>
    <div :class="bem('')" v-if="material || normalMap">
        <div :class="bem('section')" v-if="material">
            <RangePicker
                :class="bem('range')"
                :label="$tsl('粗糙质感')"
                :labelWidth="87"
                :min="0"
                :max="1"
                v-model="material.roughnessStrength"
                :inputFormatter="toFixed"
                @change="handleMateiralChange"
            />
            <RangePicker
                :class="bem('range')"
                :label="$tsl('金属质感')"
                :labelWidth="87"
                :min="0"
                :max="1"
                v-model="material.metalStrength"
                :inputFormatter="toFixed"
                @change="handleMateiralChange"
            />
        </div>
        <template v-if="normalMap">
            <div :class="bem('normal-map-section')">
                <Checkbox
                    v-model="normalMap.enabled"
                    checkedIcon="checked"
                    @change="handleToggleNormalMap"
                >
                    <span>{{ $tsl('凹凸贴图') }}</span>
                </Checkbox>
                <Popup classes="three-map-pop" placement="left-end" :visible.sync="panelVisible">
                    <i
                        v-show="normalMap.enabled"
                        :class="bem('normal-map__preview')"
                        :style="{ backgroundImage: 'url(' + normalMap.image + ')' }"
                        @click="panelVisible = !panelVisible"
                    />
                    <template #content>
                        <div :class="bem('normal-map')">
                            <Select
                                :value="currentPreset.name"
                                :options="
                                    normalMapPresets.map((preset) => ({
                                        name: preset.name,
                                        value: preset.name,
                                    }))
                                "
                                @select="handleSelectType"
                            />
                            <div :class="bem('normal-map__list-wrap')">
                                <image-list
                                    :class="bem('normal-map__list')"
                                    :imageWidth="55"
                                    :imageHeight="40"
                                    :list="(currentPreset && currentPreset.images) || []"
                                    @change="handleSelectNormalMap"
                                    ossResizeUrl
                                />
                            </div>
                        </div>
                    </template>
                </Popup>
            </div>
            <div :class="bem('section')" v-show="normalMap.enabled">
                <RangePicker
                    :class="bem('range')"
                    :label="$tsl('凹凸强度')"
                    :labelWidth="87"
                    :min="0"
                    :max="2"
                    v-model="material.normalStrength"
                    :inputFormatter="toFixed"
                    @change="handleMateiralChange"
                />
                <RangePicker
                    :class="bem('range')"
                    :label="$tsl('贴图缩放')"
                    :labelWidth="87"
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

<script>
import Popup from '../../base/popup';
import RangePicker from '../range-picker';
import Checkbox from '../../base/checkbox';
import ImageList from '../../base/image-list';
import { toFixed } from '../../utils/to-fixed';
import Select from './select';
import { threeNormalPresets } from './const';
import { i18n } from '../../i18n';

export default {
    name: 'eui-v2-material3d-panel',
    components: {
        Popup,
        Checkbox,
        RangePicker,
        ImageList,
        Select,
    },
    props: {
        material: {
            type: Object,
            default: () => ({}),
        },
        normalMap: {
            type: Object,
            default: () => {},
        },
    },

    data() {
        return {
            panelVisible: false,
            normalMapPresets: threeNormalPresets,
            currentPreset: threeNormalPresets[0],
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
        onNormalMapChange(data) {
            this.$emit('change', {
                type: 'normalMap',
                data: Object.assign({}, this.normalMap, data),
            });
        },
        toFixed,
        handleToggleNormalMap(checked) {
            const data = {
                enabled: checked,
                image: this.normalMap.image || this.currentPreset?.images[0],
            };
            this.onNormalMapChange(data);
        },
        handleSelectNormalMap(image) {
            this.onNormalMapChange({ image });
        },
        handleSelectType(item) {
            this.currentPreset = this.normalMapPresets.find((p) => p.name === item.value);
        },
    },
};
</script>

<style lang="less">
@import '../../styles/variables.less';

.eui-v2-material3d-panel {
    padding-bottom: 4px;

    &__range {
        padding: 7px 24px 7px 16px;
        .eui-v2-range-picker {
            &__label {
                line-height: 18px;
                font-weight: normal;
            }

            &__control {
                padding: 0;
                color: #33383e;
                font-size: 14px;
                line-height: 1;
            }
        }
    }

    &__section {
        padding: 8px 0;
    }

    &__normal-map-section {
        display: flex;
        padding: 10px 16px 2px;
        border-top: 1px solid #e8eaec;
        border-radius: 0 0 4px 4px;

        align-items: center;
        justify-content: space-between;

        .eui-v2-checkbox {
            padding-left: 30px;
            font-size: 13px;
            line-height: 22px;

            &__inner {
                width: 18px;
                height: 18px;
                border: 1px solid #e8eaec;
                font-size: 17px;
                .eui-v2-icon {
                    color: white;
                    font-size: 18px;
                }
            }

            &--checked {
                .eui-v2-checkbox__inner {
                    border: none;
                    background-color: #2254f4;
                }
            }
        }
    }

    &__normal-map-preview {
        width: 28px;
        height: 22px;
        border-radius: 2px;
        background-size: contain;
        cursor: pointer;
    }

    &__normal-map {
        width: 276px;
        padding: 16px;
        background-color: white;
        box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.16), 0px 1px 8px rgba(0, 0, 0, 0.06),
            0px 4px 12px rgba(0, 0, 0, 0.08);
        border-radius: 6px;

        &__list {
            &-wrap {
                overflow: auto;
                margin-top: 6px;
                width: 265px;
                max-height: 335px;
            }
        }

        &__preview {
            width: 28px;
            height: 28px;
            border: 2px solid #f1f2f4;
            border-radius: 4px;
            background-size: cover;
            cursor: pointer;
        }
    }
}
</style>
