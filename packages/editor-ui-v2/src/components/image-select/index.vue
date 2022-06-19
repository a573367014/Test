<template>
    <div class="eui-v2-image-select">
        <div class="eui-v2-image-select__select">
            <Select
                :value="innerValue.type"
                :options="types"
                @change="onTypeChange"
                :size="size"
                autoClose
            />
            <slot />
        </div>
        <image-list
            class="eui-v2-image-select__image-list"
            v-model="innerValue.value"
            :list="images"
            :image-width="imageWidth"
            :image-height="imageHeight"
            :style="{ height: listHeight + 'px' }"
            :wide="wide"
            :ossResizeUrl="ossResizeUrl"
            @change="onImageSelect"
        />
    </div>
</template>

<script>
// 该组件仅用于 3d 文字，该组件功能待合并至新的通用 image-select 组件中
import Select from '../../base/select';
import ImageList from '../../base/image-list';
import { i18n } from '../../i18n';

export default {
    components: {
        Select,
        ImageList,
    },

    model: {
        event: 'change',
        prop: 'value',
    },

    props: {
        clear: {
            type: Boolean,
            default: false,
        },
        list: {
            type: Array,
            default: () => [
                {
                    name: i18n.$tsl('无'),
                    value: 'null',
                    images: [],
                },
            ],
        },
        value: {
            type: Object,
            default: () => ({
                type: 'null',
                value: '',
            }),
        },
        listHeight: {
            type: [Number, String],
            default: 0,
        },
        wide: {
            type: Boolean,
            default: false,
        },
        imageWidth: {
            type: Number,
            default: 70,
        },
        imageHeight: {
            type: Number,
            default: 50,
        },
        ossResizeUrl: {
            type: Boolean,
            default: false,
        },
        size: {
            type: String,
            default: 'small',
        },
    },

    data() {
        const value = this.value.value;
        let type = this.value.type;
        if (!type) {
            if (value) {
                const item = this.list.find((item) => item.images.includes(value));
                type = (item && item.value) || (this.list[0] && this.list[0].value) || '';
            }
            type = type || (this.list[0] && this.list[0].value) || '';
        }

        return {
            innerValue: {
                type,
                value,
            },
        };
    },

    computed: {
        types() {
            return this.list;
        },
        images() {
            if (!this.list.length) {
                return [];
            }
            return (this.list.find((item) => item.value === this.innerValue.type) || this.list[0])
                .images;
        },
    },

    watch: {
        value: {
            deep: true,
            handler(val) {
                Object.keys(this.innerValue).forEach((key) => {
                    if (val[key] !== undefined) {
                        this.innerValue[key] = val[key];
                    }
                });
            },
        },
    },

    methods: {
        onImageSelect() {
            this.$emit('change', this.innerValue);
        },
        onTypeChange(val) {
            this.innerValue.type = val;
            this.$emit('change-type', this.innerValue);
        },
    },
};
</script>

<style lang="less">
.eui-v2-image-select {
    .eui-v2-pop-label {
        margin-top: 0;
    }
    &__select {
        display: flex;
        .eui-v2-select {
            flex: 1;
        }
    }
    &__image-list {
        margin-top: 10px;
    }
}
</style>
