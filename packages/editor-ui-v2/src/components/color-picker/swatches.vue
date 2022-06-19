<template>
    <div :class="bem()">
        <Select
            ref="select"
            :options="presets"
            :value="currentPreset"
            valueKey="id"
            @select="handleBrandClick"
        />
        <div :class="bem('list')" v-if="!currentPreset.children">
            <ColorCube
                :class="bem('list__item')"
                v-for="(item, index) in currentList"
                :key="index"
                :color="item"
                @select="handleSelect"
            />
        </div>
        <template v-else>
            <div :class="bem('list-wrap')" v-if="currentList.length">
                <div v-for="item in currentList" :key="item.id">
                    <div :class="bem('list-label')">{{ item.name }}</div>
                    <div :class="bem('list')">
                        <ColorCube
                            v-for="color in item.list"
                            :key="color"
                            :class="bem('list__item')"
                            :color="color"
                            @select="handleSelect"
                        />
                    </div>
                </div>
            </div>
            <Empty v-else />
        </template>
    </div>
</template>
<script>
import cloneDeep from 'lodash/cloneDeep';
import ColorCube from './color-cube.vue';
import { defaultColorPreset } from './const';
import Select from './select.vue';
import Empty from './empty.vue';

export default {
    name: 'eui-v2-swatches',
    components: {
        ColorCube,
        Select,
        Empty,
    },
    props: {
        presets: {
            type: Array,
            default: () => [defaultColorPreset],
        },
        filter: {
            type: Function,
            default: null,
        },
        presetId: {
            type: [String, Number],
            default: '',
        },
    },
    computed: {
        currentPreset: {
            get() {
                const { presets } = this;
                return this.getCurrentPreset(presets);
            },
            set(preset) {
                this.$emit('update:presetId', preset.id);
                this.$emit('presetChange', preset);
            },
        },
        currentList() {
            const { list, children } = this.currentPreset;
            let currentList = [];

            if (children) {
                currentList = cloneDeep(children).map((item) => {
                    if (this.filter) item.list = this.filter(item.list);

                    return item;
                });
            }
            if (list) {
                currentList = list;
                if (this.filter) currentList = this.filter(this.currentPreset.list);
            }

            return currentList;
        },
    },
    created() {
        if (this.presetId) return;
        this.currentPreset = this.presets[0] || {};
    },
    methods: {
        handleSelect(v) {
            this.$emit('select', v);
        },
        handleBrandClick(id) {
            if (!id) return;
            const preset = this.presets.find((preset) => preset.id === id);

            this.currentPreset = preset;
        },
        getCurrentPreset(presets) {
            let _currentPreset;
            for (let i = 0; i < presets.length; i++) {
                const preset = presets[i];
                if (preset.id === this.presetId) {
                    _currentPreset = preset;
                    break;
                }
                if (preset.children) {
                    for (let j = 0; j < preset.children.length; j++) {
                        const childPreset = preset.children[j];
                        if (childPreset.id === this.presetId) {
                            _currentPreset = childPreset;
                            break;
                        }
                    }
                }
            }
            if (!_currentPreset) {
                this.$refs.select && this.$refs.select.reset();
                _currentPreset = presets[0] || {};
            }

            return _currentPreset;
        },
    },
};
</script>
<style lang="less">
.eui-v2-swatches {
    padding: 16px;
    border-top: 1px solid #e8eaec;

    &__list {
        margin-top: 8px;
        overflow: auto;
        max-height: 76px;
        width: calc(100% + 10px);
        display: flex;
        flex-wrap: wrap;

        &::-webkit-scrollbar {
            width: 4px;
            height: 1px;
        }

        &::-webkit-scrollbar-thumb {
            width: 4px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 21px;
        }

        &__item {
            margin: 0 7px 8px 0;

            &:nth-child(8n) {
                margin-right: 0;
            }
        }
    }

    &__list-wrap {
        width: calc(100% + 10px);
        max-height: 132px;
        overflow-y: scroll;
        overflow-x: hidden;
        &::-webkit-scrollbar {
            width: 4px;
            height: 1px;
        }

        &::-webkit-scrollbar-thumb {
            width: 4px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 21px;
        }
    }
    &__list-label {
        color: #909090;
        font-size: 12px;
    }
}
</style>
