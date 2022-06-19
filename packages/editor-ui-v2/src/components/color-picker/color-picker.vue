<template>
    <div :class="bem()">
        <div :class="bem('main')">
            <div :class="bem('main__title')">{{ $tsl('颜色') }}</div>
            <color-picker-tabs
                v-if="usedTabs.length > 1"
                :value="tab"
                :tabs="usedTabs"
                @change="handleTabChange"
            />
            <PureColorPicker
                v-if="currentPanel === 'color'"
                ref="purePicker"
                :color="value"
                :showStraw="showStraw"
                :threeMode="threeMode"
                :cmykMode="printProvide.isPrint"
                @open-straw="handleOpenStraw"
                @change="(v) => onChange('color', v)"
                :enablePalette="enablePalette"
            />
            <GradientColorPicker
                v-if="currentPanel === 'gradient'"
                ref="gradientPicker"
                :gradient="value"
                :showStraw="showStraw"
                :threeMode="threeMode"
                :cmykMode="printProvide.isPrint"
                @open-straw="handleOpenStraw"
                @change="(v) => onChange('gradient', v)"
                :enablePalette="enablePalette"
            />
            <MapColorPicker
                v-if="isMapPanel"
                ref="mapPicker"
                :map="value"
                :uploadImage="onImageImport"
                :editor="editor"
                @change="(v) => onChange('map', v)"
            />
            <Map3dColorPicker
                v-if="currentPanel === 'map' && threeMode"
                :map="value"
                :presets="presets"
                :uploadImage="onImageImport"
                @change="(v) => onChange('map', v)"
            />
            <EnvironmentLightMapPanel
                v-if="currentPanel === 'map' && isEnvironmentLight"
                :map="value"
                :presets="presets"
                :uploadImage="onImageImport"
                @change="(v) => onChange('map', v)"
            />
            <Swatches
                v-if="currentPanel === 'color' || currentPanel === 'gradient' || isMapPanel"
                :class="[bem('swatches'), isMapPanel && bem('map-swatches')]"
                :presets="presets"
                :preset-id.sync="currentPresetId"
                @select="handleSelectSwatch"
                @presetChange="handlePresetChange"
            />
        </div>
        <div v-if="threeMode" :class="bem('other')">
            <Material3DPanel
                :material="material"
                :normalMap="normalMap"
                @change="(v) => onChange(v.type, v.data)"
            />
        </div>
    </div>
</template>

<script>
import ColorPickerTabs from './tabs.vue';
import cloneDeep from 'lodash/cloneDeep';
import {
    COLOR_TYPE_MAP,
    defaultColorPreset,
    defaultGradientPreset,
    defaultMapPreset,
    defaultTabConfig,
    elementColorMap,
    environmentImages,
} from './const';
import PureColorPicker from './pure-color-picker.vue';
import GradientColorPicker from './gradient-color-picker.vue';
import MapColorPicker from './map-color-picker.vue';
import { getDocColors, uniqColors } from './utils';
import { isGradientColor, isMapColor, isPureColor } from '../../utils/color';
import uniqWith from 'lodash/uniqWith';
import tinycolor from 'tinycolor2';
import strawMixin from '../../utils/editor-straw-mixin';
import Swatches from './swatches.vue';
import { i18n } from '../../i18n';

export default {
    name: 'eui-v2-color-picker',
    components: {
        ColorPickerTabs,
        PureColorPicker,
        GradientColorPicker,
        MapColorPicker,
        Swatches,
        Map3dColorPicker: () =>
            import(/* webpackChunkName: "map3d-color-picker" */ './map3d-color-picker.vue'),
        Material3DPanel: () =>
            import(/* webpackChunkName: "material3d-panel" */ './material3d-panel.vue'),
        EnvironmentLightMapPanel: () =>
            import(
                /* webpackChunkName: "environment-light-map-panel" */ './environment-light-map-panel.vue'
            ),
    },
    mixins: [strawMixin],
    inject: {
        printProvide: {
            default: {},
        },
        currentColorPreset: {
            default: {},
        },
        effectManager: {
            default: {},
        },
        teamService: {
            default: {},
        },
        uploadService: {
            default: {},
        },
    },
    props: {
        enableDefaultPresetColor: {
            type: Boolean,
            default: true,
        },
        enablePalette: {
            type: Boolean,
            default: true,
        },
        value: {
            type: [String, Object],
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
        editor: {
            type: Object,
            default: () => {},
        },
        threeMode: {
            type: Boolean,
            default: false,
        },
        material: {
            type: Object,
            default: () => {},
        },
        normalMap: {
            type: Object,
            default: () => {},
        },
        showStraw: {
            type: Boolean,
            default: true,
        },
    },

    data() {
        return {
            tab: COLOR_TYPE_MAP.COLOR,
            tabConfig: defaultTabConfig,
            colorCache: {},
            presets: [],
            lastTab: '',
            currentPresetId: '',
        };
    },
    computed: {
        usedTabs() {
            const { type } = this;
            const activeTabs = elementColorMap[type] || [];
            return activeTabs
                .map((tab) => {
                    const tabItem = this.tabConfig[tab];
                    if (!tabItem) return null;
                    return {
                        name:
                            typeof tabItem.name === 'function' ? tabItem.name(this) : tabItem.name,
                        value: tab,
                    };
                })
                .filter((v) => v);
        },
        currentPanel() {
            const { tab, value } = this;
            if (tab === COLOR_TYPE_MAP.COLOR && isPureColor(value)) return 'color';
            if (tab === COLOR_TYPE_MAP.GRADIENT && isGradientColor(value)) return 'gradient';
            if (tab === COLOR_TYPE_MAP.MAP && isMapColor(value)) return 'map';
            return null;
        },
        isEnvironmentLight() {
            return this.type === 'text-environment-light';
        },
        isMapPanel() {
            const { currentPanel, threeMode, isEnvironmentLight } = this;
            return currentPanel === 'map' && !threeMode && !isEnvironmentLight;
        },
        currentBrandId: {
            get() {
                const { currentBrand } = this.teamService;
                return currentBrand && currentBrand.id;
            },
            async set(id) {
                const brands = (await this.teamService.getBrands()) || [];
                const currentBrand = brands.find((brand) => brand.id === Number(id));

                this.teamService.currentBrand = currentBrand;
            },
        },
    },
    watch: {
        value(value) {
            this.reactTabState(value);
        },
        presets(presets) {
            this.$emit('presetChange', presets);
        },
    },
    async created() {
        const tab = await this.reactTabState(this.value);
        this.lastTab = tab;

        this.currentPresetId = this.currentColorPreset.id;
    },
    mounted() {},
    beforeDestroy() {
        this.$emit('destroy');

        this.editor.$events.$emit('updateColorPreset', this.currentPresetId);
    },
    methods: {
        $tsl: i18n.$tsl,
        /**
         * 根据value值判断tab类型
         */
        getTabWithValue(value) {
            const tabs = Object.keys(this.tabConfig);
            for (let i = 0; i < tabs.length; i++) {
                const tab = this.tabConfig[tabs[i]];
                if (tab.rule(value)) {
                    return tabs[i];
                }
            }
        },
        /**
         * 根据value切换tab
         */
        async reactTabState(value) {
            const tab = this.getTabWithValue(value);
            if (tab) {
                const tab = this.getTabWithValue(this.value);
                this.tab = tab;
                await this.updateSwatches(tab);
                this.cacheTabColor(this.value);
                return tab;
            }
        },
        onChange(type, data) {
            this.$emit('change', { type, data });
        },
        async handleTabChange(tab) {
            // this.currentPresetId = ''; // 切换tab时重置颜色列表选中态
            // 计算切换后显示的颜色
            const defaultValue = cloneDeep(
                this.colorCache[tab] || this.getDefaultPresets(tab).list[0],
            );
            // 如果从纯色切换到渐变，渐变位置1颜色为纯色缓存
            if (
                !this.colorCache[tab] &&
                this.lastTab === COLOR_TYPE_MAP.COLOR &&
                tab === COLOR_TYPE_MAP.GRADIENT
            ) {
                defaultValue.stops[0].color = this.colorCache[COLOR_TYPE_MAP.COLOR];
            } else if (tab === COLOR_TYPE_MAP.MAP && !defaultValue.type) {
                // defaultValue.type = FILL_TYPE_MAP.FILL;
            }
            this.onChange(tab, defaultValue);
            this.lastTab = tab;
        },
        handleOpenStraw(e) {
            this.clickStraw(e);
        },
        onImageImport(file) {
            if (!file || !this.uploadService) {
                return;
            }
            if (!/jpg|png|jpeg/.test(file.type)) {
                this.$message.info(i18n.$tsl('仅支持jpg，png图片'));
                return;
            }
            if (file.size > 12 * 1024 * 1024) {
                this.$message.info(i18n.$tsl('仅支持小于{size}的图片', { size: '12M' }));
                return;
            }
            return this.uploadService.uploadImage(file);
        },
        async updateSwatches(tab) {
            this.presets = await this.getPresets(tab);
            return this.presets;
        },
        // 缓存选项卡颜色
        async cacheTabColor(value) {
            value = cloneDeep(value);
            if (this.tab === COLOR_TYPE_MAP.MAP && !value.scale) {
                value.scale = value.scaleX || 1;
            }
            this.colorCache = { ...this.colorCache, [this.tab]: value };
        },
        // 获取品牌颜色预设
        async getPresets(type) {
            const docColors = getDocColors(this.editor);
            // 品牌色暂时只有纯色
            if (type === COLOR_TYPE_MAP.COLOR) {
                const teamPresets = await this.getTeamColorPresets(type);
                const docPureColors = uniqWith(
                    docColors.filter((color) => isPureColor(color)),
                    tinycolor.equals,
                );
                // docPureColors = docPureColors.filter(color => color !== this.value);
                const presetsResult = [
                    {
                        id: i18n.$tsl('文档颜色'),
                        name: i18n.$tsl('文档颜色'),
                        list: docPureColors,
                    },
                    ...teamPresets,
                ];
                if (this.enableDefaultPresetColor) presetsResult.push(defaultColorPreset);
                return presetsResult;
            } else if (type === COLOR_TYPE_MAP.GRADIENT) {
                const teamPresets = await this.getTeamColorPresets(type);
                const presets = [...teamPresets];
                const docGradientColors = uniqColors(docColors);
                // docGradientColors = docGradientColors.filter(color => !isEqualGradient(color, this.value));
                if (this.enableDefaultPresetColor) presets.push(defaultGradientPreset);
                presets.unshift({
                    id: i18n.$tsl('文档颜色'),
                    name: i18n.$tsl('文档颜色'),
                    list: docGradientColors,
                });
                return presets;
            } else if (type === COLOR_TYPE_MAP.MAP) {
                if (!this.effectManager) return [];
                if (this.isEnvironmentLight) {
                    return [
                        {
                            name: i18n.$tsl('环境贴图'),
                            list: environmentImages.map((image) => ({ image })),
                        },
                    ];
                }
                const textureType = this.threeMode ? 'three_texture' : '2d_texture';
                const textures = await this.effectManager.loadTextures(textureType);
                if (!textures || !textures.length) {
                    if (this.enableDefaultPresetColor) return [defaultMapPreset];
                    return [];
                }
                return textures.map((textture) => {
                    return {
                        id: textture.id,
                        name: textture.name,
                        list: textture.images.map((url) => ({ image: url })),
                    };
                });
            }
            return [];
        },
        // 获取团队颜色预设
        async getTeamColorPresets(type = '') {
            const teams =
                this.teamService &&
                this.teamService.getTeamsWithBrandMaterials &&
                (await this.teamService.getTeamsWithBrandMaterials(2));
            const presets = [];
            if (!teams) return [];

            teams.forEach((team) => {
                if (!(team.brands && team.brands.length)) return;

                team.brands.forEach((brand) => {
                    const preset = {
                        id: `brand_${brand.id}`,
                        brandId: brand.id,
                        name: brand.name,
                        children: [],
                    };

                    if (brand.colors && brand.colors.length) {
                        preset.children = brand.colors
                            .map((material) => ({
                                id: type + brand.id + material.id,
                                brandId: brand.id,
                                name: material.name,
                                list: material.data || [],
                            }))
                            .filter((child) => child.list.length);
                    }

                    presets.push(preset);
                });
            });

            return presets;
        },
        /**
         * 根据tab获取默认预设
         */
        getDefaultPresets(tab) {
            if (tab === COLOR_TYPE_MAP.COLOR) return defaultColorPreset;
            if (tab === COLOR_TYPE_MAP.GRADIENT) return defaultGradientPreset;
            if (tab === COLOR_TYPE_MAP.MAP) return defaultMapPreset;
            return { list: [] };
        },
        handleSelectSwatch(color) {
            if (this.tab === COLOR_TYPE_MAP.COLOR) {
                this.$refs.purePicker.handleColorInput(color);
            }
            if (this.tab === COLOR_TYPE_MAP.GRADIENT) {
                this.$refs.gradientPicker.handleSelectSwatch(color);
            }
            if (this.tab === COLOR_TYPE_MAP.MAP) {
                this.$refs.mapPicker.handleSelectSwatch(color);
            }
        },
        async handlePresetChange(preset) {
            const { id, brandId } = preset;
            if (brandId) {
                this.currentBrandId = brandId;
            }

            this.currentPresetId = id;
            this.$emit('presetChange', preset);
        },
    },
};
</script>

<style lang="less">
@import '../../styles/variables.less';

.eui-v2-color-picker {
    // position: fixed;
    // right: 24px;
    // top: 100px;
    min-height: 470px;
    width: 276px;
    display: inline-block;
    font-size: 14px;
    user-select: none;

    &__main,
    &__other {
        box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.16), 0px 1px 8px rgba(0, 0, 0, 0.06),
            0px 4px 12px rgba(0, 0, 0, 0.08);
        border-radius: 6px;
        background: #fff;
    }

    &__main {
        &__title {
            padding: 12px 16px;
            font-weight: 600;
            font-size: 14px;
            line-height: 20px;
            color: #33373e;
        }
    }

    &__other {
        margin-top: 8px;
    }

    &__map-swatches .eui-v2-swatches__list__item {
        margin: 0 8px 8px 0;
        width: 34px;
        height: 34px;

        &:nth-child(6n) {
            margin-right: 0px;
        }

        > div {
            background-size: 180%;
        }
    }
}
</style>
