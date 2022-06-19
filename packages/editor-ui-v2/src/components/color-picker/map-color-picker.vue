<template>
    <div :class="bem('')">
        <div :class="bem('main')">
            <div :class="bem('preview')" ref="preview">
                <div :class="bem('preview__box')" :style="[imageBoxStyle, backgroundStyle]" />
                <FilePicker accept="image/png,image/jpeg,image/jpg" @change="handleFileChange">
                    <div :class="bem('upload')">
                        <div :class="bem('upload__btn')">{{ $tsl('上传图案') }}</div>
                    </div>
                </FilePicker>
            </div>
            <div :class="bem('fill-type')">
                <Select
                    :options="fillTypes"
                    :value="fillType"
                    placement="top-center"
                    :popClass="bem('fill-select__pop')"
                    :menuClass="bem('fill-select__menu')"
                    @select="handleChangeFillType"
                >
                    <template #toggle="{ label, open }">
                        <div :class="[bem('fill-select'), 'eui-v2-control']" @click="open">
                            <span :class="bem('fill-select__label')">{{ label }}</span>
                            <Icon name="arrow-down" />
                        </div>
                    </template>
                </Select>
                <Input
                    :disabled="disableScale"
                    block
                    :class="[
                        bem('fill-size'),
                        'eui-v2-control',
                        disableScale && 'eui-v2-control--disable',
                    ]"
                    :value="scaleText"
                    ref="scaleInput"
                    @focus="handleScaleFocus"
                    @blur="handleScaleBlur"
                />
            </div>
        </div>
    </div>
</template>
<script>
import Select from './select.vue';
import Input from '../../base/input/index.vue';
import FilePicker from '../../base/file-picker/index.vue';
import { defaultMapPreset, FILL_TYPE_MAP, FILL_TYPE_CONFIG } from './const';
import Icon from '../../base/icon/index.vue';
import mapMixin from './map-mixin';
import { scaleValueRule } from '../../common/rules';
import { toFixed } from '../../utils/to-fixed';
import { loadImage } from '../../utils';
import { i18n } from '../../i18n';

export default {
    name: 'eui-v2-map-color-picker',
    components: {
        Select,
        Input,
        FilePicker,
        Icon,
    },
    mixins: [mapMixin],
    props: {
        editor: {
            type: Object,
            default: () => {},
        },
    },
    data() {
        return {
            inputScale: 1,
            imageBoxStyle: {
                width: '100%',
                height: '100%',
            },
            fillTypes: Object.keys(FILL_TYPE_CONFIG).map((key) => ({
                name: FILL_TYPE_CONFIG[key].name,
                value: key,
            })),
        };
    },
    computed: {
        scaleText() {
            return this.fillType === FILL_TYPE_MAP.TILED ? this.scale : '1x';
        },
        fillType() {
            return this.map.type || FILL_TYPE_MAP.TILED;
        },
        scale() {
            return toFixed(this.map.scale || this.map.scaleX || 1, 1) + 'x';
        },
        backgroundStyle() {
            const { map, fillType } = this;
            if (!map || !map.image) return {};
            const repeat = fillType === FILL_TYPE_MAP.TILED ? 'repeat' : 'no-repeat';
            const style = {
                backgroundImage: `url(${map.image})`,
                backgroundRepeat: repeat,
                backgroundSize: '',
                backgroundPosition: 'center',
            };
            if (fillType === FILL_TYPE_MAP.FILL) {
                style.backgroundSize = 'cover';
            } else if (fillType === FILL_TYPE_MAP.FIT) {
                style.backgroundSize = 'contain';
            } else if (fillType === FILL_TYPE_MAP.CROP) {
                style.backgroundSize = '100% 100%';
            } else if (fillType === FILL_TYPE_MAP.TILED || !fillType) {
                const vwRatio = parseFloat(this.imageBoxStyle.width) / this.currentElement.width;
                style.backgroundSize = `${(map.scaleX || map.scale) * map.width * vwRatio}px ${
                    (map.scaleY || map.scale) * map.height * vwRatio
                }px`;
                style.backgroundPosition = '';
            }
            return style;
        },
        disableScale() {
            return this.fillType !== FILL_TYPE_MAP.TILED;
        },
        currentElement() {
            return this.editor?.currentElement;
        },
        elementSize() {
            const size = { width: 1, height: 1 };
            if (this.currentElement) {
                size.width = this.currentElement.width;
                size.height = this.currentElement.height;
            }
            return size;
        },
    },
    mounted() {
        this.imageBoxStyle = this.calImageBoxStyle();
    },
    methods: {
        $tsl: i18n.$tsl,
        async onChange(map) {
            const innerMap = {
                scale: map.scale || map.scaleX || 1,
                minScale: map.minScale || 0.5,
                maxScale: map.maxScale || 2,
                image: map.image || '',
                rotate: map.rotate || 0,
                x: map.x || 0,
                y: map.y || 0,
                type: map.type,
                width: map.width,
                height: map.height,
                scaleVisible: map.scaleVisible === undefined ? true : map.scaleVisible,
            };
            this.$emit('change', { ...innerMap });
        },
        handleChangeFillType(value) {
            this.onChange({ ...this.map, type: value });
        },
        async handleSelectSwatch(map) {
            if (!map.width) {
                const image = await loadImage(map.image);
                map.width = image.width;
                map.height = image.height;
            }
            this.onChange({ ...this.map, image: map.image, width: map.width, height: map.height });
        },
        handleScaleBlur(_, e) {
            const scale = scaleValueRule(e.target.value) ? e.target.value : this.cacheScaleStr;
            this.onChange({ ...this.map, scale: parseFloat(scale) });
            this.$refs.scaleInput.$forceUpdate();
        },
        handleScaleFocus() {
            this.cacheScaleStr = this.scale;
        },
        async handleFileChange(files) {
            try {
                const image = await this.uploadImage(files[0]);
                this.onChange({
                    ...this.map,
                    image: image.url,
                    width: image.width,
                    height: image.height,
                });
            } catch (e) {
                console.error(e);
            }
        },
        // 计算图框样式
        calImageBoxStyle() {
            const { width: elmWidth, height: elmHeight } = this.elementSize;
            const { width, height } = this.$refs.preview.getBoundingClientRect();
            const stdDirect = elmWidth / elmHeight > width / height ? 'w' : 'h';
            if (stdDirect === 'w') {
                const ratio = width / elmWidth;
                return {
                    width: width + 'px',
                    height: elmHeight * ratio + 'px',
                };
            }
            const ratio = height / elmHeight;
            return {
                width: elmWidth * ratio + 'px',
                height: height + 'px',
            };
        },
    },
};
</script>
<style lang="less">
@import '../../styles/mixin.less';

.eui-v2-map-color-picker {
    &__main {
        padding: 0 16px 12px;
    }

    &__preview {
        position: relative;
        margin-bottom: 12px;
        width: 100%;
        height: 140px;
        border-radius: 4px;
        .transparent-background(12px, 0.6);

        &__box {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border: 1px solid rgba(0, 0, 0, 0.4);
        }
    }

    &__upload {
        visibility: hidden;
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.6);
        cursor: pointer;

        &__btn {
            width: 96px;
            height: 32px;
            border: 1px solid #fff;
            border-radius: 4px;
            font-weight: 500;
            font-size: 14px;
            line-height: 30px;
            text-align: center;
            color: #fff;
        }
    }

    &__preview:hover &__upload {
        visibility: visible;
        border-radius: 4px;
    }

    &__fill-type {
        display: flex;
    }

    &__fill-select {
        margin-right: 8px;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        &__label {
            margin-right: 4px;
        }

        &__menu {
            width: 180px;
        }
        &__pop {
            transform: translateY(38px);
        }

        &&--disabled {
            color: #bec3c9;
            cursor: not-allowed;
            &:hover {
                background: #f1f2f4;
            }
        }
    }

    &__fill-size {
        width: 56px;
        height: 32px;
        border: none;
        > input {
            padding: 5px 12px;
            border: none;
            outline: none;
            text-align: center;
        }
    }
}
</style>
