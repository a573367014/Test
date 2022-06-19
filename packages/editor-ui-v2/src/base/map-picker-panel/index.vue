<template>
    <div class="eui-v2-map-picker">
        <!-- <image-select
            v-if="designMode"
            class="eui-v2-map-picker__image-select"
            :value="selectModel"
            :list="mapPresets"
            :list-height="235"
            :ossResizeUrl="ossResizeUrl"
            size="mini"
            @change="onSelect"
        >
            <FilePicker
                :accept="'image/png,image/jpeg,image/jpg'"
                v-on:change="onFileChange">
                <eui-v2-button tag="div" class="eui-v2-map-picker__upload" size="mini">
                    上传
                </eui-v2-button>
            </FilePicker>
        </image-select> -->
        <image-list
            class="eui-v2-map-picker__image-select"
            :value="selectModel.value"
            :style="{ height: '235px' }"
            :imageWidth="70"
            :imageHeight="50"
            :list="(mapPresets[0] && mapPresets[0].images) || []"
            :ossResizeUrl="ossResizeUrl"
            @change="onUrlChange"
        />
        <RangePicker
            class="eui-v2-map-picker__range-picker"
            :label="$tsl('贴图缩放')"
            :label-width="70"
            :sync-limit="false"
            v-show="innerMap.scaleVisible"
            v-model="innerMap.scale"
            :min="innerMap.minScale"
            :max="innerMap.maxScale"
            :formatter="(progree, value) => toFixed(value)"
            :inputFormatter="toFixed"
            :disabled="!innerMap.url"
            @change="onScaleChange"
        />
        <div class="eui-v2-map-picker__map-position" v-if="threeMode">
            <span>{{ $tsl('贴图位置') }}</span>
            <div class="eui-v2-map-picker__map-position-inner">
                <div class="eui-v2-map-picker__input-group">
                    <div class="eui-v2-map-picker__input">
                        <input
                            class="eui-v2-map-picker__input-inner"
                            type="number"
                            min="-1000"
                            max="1000"
                            v-focusSelect
                            :value="translateFormat(innerMap.x)"
                            @input="
                                innerMap.x = reversTranslateFormat($event.target.value);
                                handleTransformChange();
                            "
                        />
                        <span
                            class="eui-v2-map-picker__input-label"
                            @mousedown="handleLabelMousedown($event, 'x')"
                        >
                            x
                        </span>
                    </div>
                    <div class="eui-v2-map-picker__input">
                        <input
                            class="eui-v2-map-picker__input-inner"
                            type="number"
                            min="-1000"
                            max="1000"
                            v-focusSelect
                            :value="translateFormat(innerMap.y)"
                            @input="
                                innerMap.y = reversTranslateFormat($event.target.value);
                                handleTransformChange();
                            "
                        />
                        <span
                            class="eui-v2-map-picker__input-label"
                            @mousedown="handleLabelMousedown($event, 'y')"
                        >
                            y
                        </span>
                    </div>
                </div>
                <div class="eui-v2-map-picker__input">
                    <DegreeInput
                        ref="degreeInput"
                        v-model="innerMap.rotate"
                        :disk="false"
                        @change="handleTransformChange"
                        @onBlur="isInputActive = false"
                    />
                    <span
                        class="eui-v2-map-picker__input-label"
                        @mousedown="handleLabelMousedown($event, 'rotate')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import RangePicker from '../../components/range-picker';
import ImageList from '../../base/image-list';
import DegreeInput from '../../base/degree-input';
import { toFixed } from '../../utils/to-fixed';
import focusSelect from '../../utils/directives/focus-select';
import { mapPropsMixin } from './map-props-mixin';
import { i18n } from '../../i18n';

const ARAE_SIZE = 200;
const TRANSLATE_MIN = -10;
const TRANSLATE_MAX = 10;
const ROTATE_MAX = 180;
const ROTATE_MIN = -180;
const translateFormat = (v) => toFixed(v * 100, 0);
const reversTranslateFormat = (v) => toFixed(v / 100, 3);

export default {
    components: {
        RangePicker,
        ImageList,
        DegreeInput,
    },

    directives: {
        focusSelect,
    },

    mixins: [mapPropsMixin],

    model: {
        event: 'change',
        prop: 'map',
    },

    data() {
        return {
            innerMap: {
                scale: this.map.scale || 1,
                minScale: this.map.minScale || 0.5,
                maxScale: this.map.maxScale || 2,
                url: this.map.url || '',
                rotate: this.map.rotate || 0,
                x: this.map.x || 0,
                y: this.map.y || 0,
                type: '',
                scaleVisible: this.map.scaleVisible === undefined ? true : this.map.scaleVisible,
            },
            isInputActive: false,
        };
    },

    computed: {
        selectModel() {
            return {
                value: this.innerMap.url,
                type: this.innerMap.type,
            };
        },
    },

    watch: {
        map: {
            deep: true,
            handler(val) {
                if (this.isInputActive) {
                    return;
                }

                Object.keys(this.innerMap).forEach((key) => {
                    if (val[key] !== undefined) {
                        this.innerMap[key] = val[key];
                    }
                });
            },
        },
    },

    methods: {
        $tsl: i18n.$tsl,
        onFileChange(files) {
            this.$emit('import', files[0]);
        },
        onSelect(val) {
            this.innerMap.url = val.value;
            this.innerMap.value = val.value;
            this.innerMap.type = val.type;
            this.$emit('change', this.innerMap);
        },
        onUrlChange(val) {
            this.innerMap.url = val;
            this.$emit('change', this.innerMap);
        },
        onScaleChange() {
            if (this.innerMap.url) {
                this.$emit('change', this.innerMap);
            }
        },
        handleTransformChange() {
            this.$emit('change', this.innerMap);
        },
        handleLabelMousedown(event, attr) {
            let initalX = event.pageX;
            const isRotate = attr === 'rotate';
            const handleMousemove = (event) => {
                const diffX = event.pageX - initalX;
                if (diffX) {
                    const max = isRotate ? ROTATE_MAX : TRANSLATE_MAX;
                    const min = isRotate ? ROTATE_MIN : TRANSLATE_MIN;
                    const val = this.innerMap[attr] + (diffX / ARAE_SIZE) * (max - min);
                    let validVal = Math.max(Math.min(val, max), min);
                    if (isRotate) {
                        validVal = toFixed(validVal, 0);
                        this.$refs.degreeInput.inputValue = validVal;
                    }

                    this.innerMap[attr] = validVal;
                    initalX = event.pageX;
                    this.handleTransformChange();
                }
            };
            const handleMouseup = () => {
                document.body.removeEventListener('mousemove', handleMousemove);
                document.body.removeEventListener('mouseup', handleMouseup);
            };
            document.body.addEventListener('mousemove', handleMousemove);
            document.body.addEventListener('mouseup', handleMouseup);
        },
        translateFormat,
        reversTranslateFormat,
        toFixed,
    },
};
</script>

<style lang="less">
.eui-v2-map-picker {
    position: relative;
    box-sizing: content-box;
    padding-top: 14px;
    color: #000;

    &__range-picker.three-range-picker {
        box-sizing: border-box;
        width: 100%;
        height: auto;
        padding: 12px 14px;
        border-top: 1px solid rgba(211, 216, 221, 1);
        border-radius: 0 0 4px 4px;
        background: #fff;
    }

    &__image-select {
        padding: 0 14px;
    }

    &__upload.eui-v2-button {
        position: relative;
        margin-left: 8px;
        width: 70px;
        background: #f8fafc;

        flex-shrink: 0;
        input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            text-indent: -999px;
            opacity: 0;
            cursor: pointer;
        }
    }

    &__map-position {
        display: flex;
        padding: 10px 16px 12px;

        align-items: baseline;
        justify-content: space-between;

        &-inner {
            display: flex;
        }
    }

    &__input {
        width: 44px;
        text-align: center;

        &-group {
            margin-right: 8px;
            display: flex;

            .eui-v2-map-picker__input {
                & + .eui-v2-map-picker__input {
                    .eui-v2-map-picker__input-inner {
                        border-left: none;
                    }
                }
                &:first-child {
                    .eui-v2-map-picker__input-inner {
                        border-radius: 4px 0 0 4px;
                    }
                }

                &:last-child {
                    .eui-v2-map-picker__input-inner {
                        border-radius: 0 4px 4px 0;
                    }
                }
            }
        }

        &-label {
            display: block;
            min-width: 10px;
            min-height: 18px;
            font-size: 10px;
            color: #626a77;
            cursor: ew-resize;
        }

        &-inner {
            box-sizing: border-box;
            width: 100%;
            height: 28px;
            border: 1px solid @border-color;
            font-size: 14px;
            text-align: center;
            outline: none;
            color: #000;
            cursor: pointer;

            &:focus {
                cursor: text;
            }
        }

        input[type='number'] {
            background-color: transparent;

            -moz-appearance: textfield;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none;
        }
    }

    .eui-v2-degree-input--padding-horizontal {
        padding-left: 0;
        .eui-v2-degree-input__control-container {
            .eui-v2-degree-input__uint {
                border: 1px solid @border-color;
                border-radius: 4px;
                padding: 4px;
            }
        }
    }
}
</style>
