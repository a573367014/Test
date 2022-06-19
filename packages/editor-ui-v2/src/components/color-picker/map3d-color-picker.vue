<template>
    <div :class="bem('')">
        <div :class="bem('header')">
            <Select
                v-if="presets.length"
                :options="typeOptions"
                :value="currentPreset && currentPreset.name"
                @select="handleSelectPresetType"
            />
            <FilePicker
                :class="bem('upload')"
                :accept="'image/png,image/jpeg,image/jpg'"
                @change="onFileChange"
            >
                <Button tag="div" size="mini" :class="bem('upload__btn')">
                    <div :class="bem('upload__btn__inner')">
                        <Icon :class="bem('upload__btn__icon')" name="add2021" />
                        {{ $tsl('上传') }}
                    </div>
                </Button>
            </FilePicker>
        </div>
        <image-list
            :class="bem('image-select')"
            :value="selectModel.value"
            :imageWidth="55"
            :imageHeight="40"
            :list="imageList"
            @change="onUrlChange"
            ossResizeUrl
        />
        <div :class="bem('prop-group')">
            <div :class="bem('prop-item')">
                <input
                    class="eui-v2-control"
                    type="number"
                    min="-1000"
                    max="1000"
                    v-focusSelect
                    :value="display('x')"
                    @input="handlePropChange('x', $event.target.value)"
                />
                <span
                    :class="bem('prop-item__label')"
                    @mousedown="handleLabelMousedown($event, 'x')"
                >
                    {{ $tsl('X轴') }}
                </span>
            </div>
            <div :class="bem('prop-item')">
                <input
                    class="eui-v2-control"
                    type="number"
                    min="-1000"
                    max="1000"
                    v-focusSelect
                    :value="display('y')"
                    @input="handlePropChange('y', $event.target.value)"
                />
                <span
                    :class="bem('prop-item__label')"
                    @mousedown="handleLabelMousedown($event, 'y')"
                >
                    {{ $tsl('Y轴') }}
                </span>
            </div>
            <div :class="bem('prop-item')">
                <DegreeInput
                    :class="bem('degree-input')"
                    ref="degreeInput"
                    v-model="innerMap.rotate"
                    :disk="false"
                    @change="handlePropChange('rotate', $event)"
                    @onBlur="isInputActive = false"
                />
                <span
                    :class="bem('prop-item__label')"
                    @mousedown="handleLabelMousedown($event, 'rotate')"
                >
                    {{ $tsl('角度') }}
                </span>
            </div>
            <div :class="bem('prop-item')">
                <input
                    class="eui-v2-control"
                    :value="display('scale')"
                    @blur="handleScaleBlur"
                    @keypress.enter="handleScaleBlur"
                />
                <span
                    :class="bem('prop-item__label')"
                    @mousedown="handleLabelMousedown($event, 'scale')"
                >
                    {{ $tsl('贴图大小') }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import ImageList from '../../base/image-list';
import DegreeInput from '../../base/degree-input';
import { toFixed } from '../../utils/to-fixed';
import focusSelect from '../../utils/directives/focus-select';
import Select from './select';
import Button from '../../base/button';
import FilePicker from '../../base/file-picker';
import Icon from '../../base/icon';
import mapMixin from './map-mixin';
import { scaleValueRule } from '../../common/rules';
import { i18n } from '../../i18n';

const ARAE_SIZE = 200;
const TRANSLATE_MIN = -10;
const TRANSLATE_MAX = 10;
const ROTATE_MAX = 180;
const ROTATE_MIN = -180;

const offsetFormat = {
    displayFormat: (v) => toFixed(v * 100, 0),
    storeFormat: (v) => toFixed(v / 100, 3),
};

const propsConfig = {
    x: offsetFormat,
    y: offsetFormat,
    scale: {
        displayFormat: (v) => toFixed(v, 1) + 'x',
        storeFormat: (v, lastMap) => {
            const scale = scaleValueRule(v, 0.5, 3) ? parseFloat(v) : lastMap.scale;
            return toFixed(scale, 1);
        },
    },
    rotate: {
        displayFormat: (v) => v,
        storeFormat: (v) => v,
    },
};

export default {
    name: 'eui-v2-map3d-color-picker',
    components: {
        ImageList,
        DegreeInput,
        Select,
        Button,
        FilePicker,
        Icon,
    },
    directives: {
        focusSelect,
    },
    mixins: [mapMixin],
    props: {
        presets: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            innerMap: {
                scale: this.map.scale || 1,
                minScale: this.map.minScale || 0.5,
                maxScale: this.map.maxScale || 2,
                image: this.map.image || '',
                rotate: this.map.rotate || 0,
                x: this.map.x || 0,
                y: this.map.y || 0,
                type: '',
                width: this.map.width,
                height: this.map.height,
                scaleVisible: this.map.scaleVisible === undefined ? true : this.map.scaleVisible,
            },
            isInputActive: false,
            currentPreset: this.presets[0] || {},
        };
    },
    computed: {
        imageList() {
            return (
                (this.currentPreset &&
                    this.currentPreset.list &&
                    this.currentPreset.list.map((item) => item.image).filter((v) => v)) ||
                []
            );
        },
        typeOptions() {
            if (!this.presets) return [];
            return this.presets.map((preset) => ({ name: preset.name, value: preset.name }));
        },
        selectModel() {
            return {
                value: this.innerMap.image,
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
        presets(presets) {
            const currentPreset = presets.find((preset) => preset.name === this.currentPreset.name);

            this.currentPreset = currentPreset || presets[0];
        },
    },

    methods: {
        $tsl: i18n.$tsl,
        async onFileChange(files) {
            try {
                const image = await this.uploadImage(files[0]);
                this.innerMap.image = image.url;
                this.innerMap.width = image.width;
                this.innerMap.height = image.height;
                this.$emit('change', this.innerMap);
            } catch (e) {
                console.error(e);
            }
        },
        onUrlChange(val) {
            this.innerMap.image = val;
            this.$emit('change', this.innerMap);
        },
        handleScaleBlur(e) {
            this.handlePropChange('scale', e.target.value);
            this.$forceUpdate();
        },
        handlePropChange(name, value) {
            this.innerMap[name] = propsConfig[name].storeFormat(value, this.innerMap);
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

                    initalX = event.pageX;
                    this.handlePropChange(attr, propsConfig[attr].displayFormat(validVal));
                }
            };
            const handleMouseup = () => {
                document.body.removeEventListener('mousemove', handleMousemove);
                document.body.removeEventListener('mouseup', handleMouseup);
            };
            document.body.addEventListener('mousemove', handleMousemove);
            document.body.addEventListener('mouseup', handleMouseup);
        },
        handleSelectPresetType(opt) {
            this.currentPreset = this.presets.find((p) => p.name === opt);
        },
        display(name) {
            return propsConfig[name].displayFormat(this.innerMap[name]);
        },
    },
};
</script>

<style lang="less">
.eui-v2-map3d-color-picker {
    position: relative;
    padding: 0 16px 24px;

    &__header {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
    }

    &__upload {
        margin-left: auto;

        &__btn {
            line-height: 17px;
            background-color: #f0f6ff;
            color: #2254f4;
            font-weight: 500;
            font-size: 12px;
            border: none;

            &:hover {
                color: #2254f4;
                background-color: #c7dbff;
            }

            &__inner {
                display: flex;
                align-items: center;
            }

            &__icon {
                margin-right: 2px;
                font-size: 14px;
            }
        }
    }

    &__image-select {
        margin-bottom: 16px;
    }

    &__prop {
        &-group {
            display: flex;
            justify-content: space-between;
        }
        &-item {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            > input {
                width: 55px;
                height: 28px;
                background: #f1f2f4;
                border-radius: 4px;
                text-align: center;
                color: #33383e;
                font-size: 14px;
                line-height: 20px;
                border: none;
                outline: none;
            }

            &__label {
                margin-top: 6px;
                text-align: center;
                font-size: 12px;
                line-height: 14px;
                color: #9da3ac;
                transform: scale(0.834);
                cursor: ew-resize;
            }
        }
    }

    &__degree-input {
        width: 55px;
        height: 28px;
        background: #f1f2f4;
        border-radius: 4px;
        font-size: 14px;
    }
}
</style>
