<template>
    <div class="eui-v2-material-picker">
        <image-select
            class="eui-v2-material-picker__image-select"
            v-model="innerMaterial"
            :list="presets"
            :image-height="70"
            :ossResizeUrl="ossResizeUrl"
            @change="onImageSelect"
        />
    </div>
</template>

<script>
import ImageSelect from '../../components/image-select';

export default {
    components: {
        ImageSelect
    },

    model: {
        prop: 'material',
        event: 'change'
    },

    props: {
        presets: {
            type: Array,
            default: () => []
        },
        material: {
            type: Object,
            default: () => ({})
        },
        ossResizeUrl: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            panelVisible: false,
            innerMaterial: {
                type: '',
                value: ''
            },
        };
    },

    watch: {
        material: {
            deep: true,
            handler(val) {
                Object.keys(this.innerMaterial).forEach(key => {
                    if(val[key] !== undefined) {
                        this.innerMaterial[key] = val[key];
                    }
                });
            }
        }
    },

    methods: {
        togglePanelVisible() {
            this.panelVisible = !this.panelVisible;
        },
        onImageSelect() {
            this.$emit('change', this.innerMaterial);
        }
    },
};
</script>

<style lang="less">

.eui-v2-material-picker {
    position: relative;
    padding: 11px 14px 0;

    &__image-select {
        .eui-v2-image-list {
            margin-top: 21px;
        }
    }
}

</style>
