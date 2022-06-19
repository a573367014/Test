<template>
    <div :class="bem('')">
        <div :class="bem('header')">
            <Select
                v-if="presets.length"
                :options="typeOptions"
                :value="currentPreset && currentPreset.name"
                @select="handleSelectPresetType" />
            <FilePicker
                :class="bem('upload')"
                :accept="'image/png,image/jpeg,image/jpg'"
                @change="onFileChange">
                <Button tag="div" size="mini" :class="bem('upload__btn')">
                    <div :class="bem('upload__btn__inner')">
                        <Icon :class="bem('upload__btn__icon')" name="add2021" />
                        上传
                    </div>
                </Button>
            </FilePicker>
        </div>
        <image-list
            :class="bem('image-select')"
            :value="selectModel.value"
            :imageWidth="55"
            :imageHeight="40"
            ossResizeUrl
            :list="imageList"
            @change="onUrlChange"
        />
    </div>
</template>

<script>
import ImageList from '../../base/image-list';
import Select from './select';
import Button from '../../base/button';
import FilePicker from '../../base/file-picker';
import Icon from '../../base/icon';
import mapMixin from './map-mixin';

export default {
    name: 'eui-v2-environment-light-map-panel',
    components: {
        ImageList,
        Select,
        Button,
        FilePicker,
        Icon,
    },
    mixins: [mapMixin],
    props: {
        presets: {
            type: Array,
            default: () => []
        }
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
                scaleVisible: this.map.scaleVisible === undefined ? true : this.map.scaleVisible
            },
            currentPreset: this.presets[0] || {},
        };
    },
    computed: {
        imageList() {
            return this.currentPreset &&
            this.currentPreset.list &&
                this.currentPreset.list.map(item => item.image);
        },
        typeOptions() {
            if(!this.presets) return [];
            return this.presets.map(preset => ({ name: preset.name, value: preset.name }));
        },
        selectModel() {
            return {
                value: this.innerMap.image,
                type: this.innerMap.type
            };
        }
    },
    watch: {
        map: {
            deep: true,
            handler(val) {
                if(this.isInputActive) {
                    return;
                }

                Object.keys(this.innerMap).forEach(key => {
                    if(val[key] !== undefined) {
                        this.innerMap[key] = val[key];
                    }
                });
            }
        },
        presets(presets) {
            this.currentPreset = presets[0];
        }
    },

    methods: {
        async onFileChange(files) {
            try {
                const image = await this.uploadImage(files[0]);
                this.innerMap.image = image.url;
                this.innerMap.width = image.width;
                this.innerMap.height = image.height;
                this.$emit('change', this.innerMap);
            }
            catch(e) {
                console.error(e);
            }
        },
        onUrlChange(val) {
            this.innerMap.image = val;
            this.$emit('change', this.innerMap);
        },
        handleSelectPresetType(opt) {
            this.currentPreset = this.presets.find(p => p.name === opt.value);
        },
    },
};
</script>

<style lang="less">
.eui-v2-environment-light-map-panel {
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
            background-color: #F0F6FF;
            color: #2254F4;
            font-weight: 500;
            font-size: 12px;
            border: none;

            &:hover {
                color:  #2254F4;
                background-color: #C7DBFF;
            }

            &__inner {
                display: flex;
                align-items: center;
            }

            &__icon {
                margin-right: 2px;
            }
        }
    }

    &__image-select {
        margin-bottom: 16px;
    }
}

</style>
