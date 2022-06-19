<template>
    <div class="eui-v2-editor-background eui-v2-panel-form" v-if="layout">
        <div class="eui-v2-panel-form__label">
            {{ $tsl('画布背景') }}
            <slot name="label-right" />
        </div>

        <toggle-tab
            class="eui-v2-editor-background-color-tabs"
            :value="bgType"
            :class="disabledClass"
            :tabs="[
                {
                    content: $tsl('颜色'),
                    name: 'color',
                },
                {
                    content: $tsl('图片'),
                    name: 'image',
                },
            ]"
            @change="tabChange"
        ></toggle-tab>

        <div v-show="bgType === 'image'">
            <div>
                <div v-if="layout.$backgroundImageInfo" class="eui-v2-panel-form__item">
                    <div class="eui-v2-editor-background__preview" ref="preview">
                        <div
                            class="eui-v2-editor-background__preview--wrapper"
                            :style="previewBoxCss"
                        >
                            <div :style="previewImageStyle[0]">
                                <img
                                    class="eui-v2-editor-background__preview--image"
                                    :src="layout.$backgroundImageInfo.url"
                                    :style="previewImageStyle[1]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="eui-v2-panel-form__item">
                    <Button
                        class="eui-v2-panel-btn"
                        block
                        :disabled="isEditing"
                        @click="onPickImage"
                    >
                        {{ layout.$backgroundImageInfo ? $tsl('替换背景图') : $tsl('上传背景图') }}
                    </Button>
                </div>
                <div
                    class="eui-v2-panel-form__item"
                    v-if="layout.$backgroundImageInfo && enableTag"
                >
                    <eui-v2-dropdown-button class="eui-v2-editor-background__dropdown-button">
                        {{ tag }}
                        <template #dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu
                                    v-for="item in imageCategories"
                                    :key="item.value"
                                    @click="selectCategory(item.value, dropdown)"
                                >
                                    {{ item.name }}
                                </eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
                <div v-if="layout.$backgroundImageInfo" class="eui-v2-editor-background-img-tools">
                    <div class="eui-v2-panel-form__item eui-v2-panel-form__item--row">
                        <div class="eui-v2-panel-form__item--col">
                            <Button
                                class="eui-v2-panel-btn"
                                block
                                :disabled="isEditing"
                                @click="onCrop"
                            >
                                <Icon name="bg-tool-crop" />
                                <span>{{ $tsl('裁剪') }}</span>
                            </Button>
                        </div>
                        <div class="eui-v2-panel-form__item--col" v-if="!hideMatting">
                            <Button
                                class="eui-v2-panel-btn"
                                block
                                :disabled="isGif || isEditing || disabledMatting"
                                @click="onBgMatting"
                            >
                                <Icon name="bg-tool-cutout" />
                                <span>{{ $tsl('抠图') }}</span>
                            </Button>
                        </div>
                    </div>
                    <div
                        class="eui-v2-panel-form__item eui-v2-panel-form__item--row"
                        :class="disabledClass"
                    >
                        <div class="eui-v2-panel-form__item--col">
                            <Popup
                                placement="bottom-end"
                                :visible="panelVisible"
                                @update:visible="onVisibleChange"
                                :allow-directions="['top', 'bottom']"
                            >
                                <Button
                                    class="eui-v2-panel-btn"
                                    block
                                    :disabled="isEditing || !enableColorMix"
                                    @click="togglePanelVisible"
                                >
                                    <Icon name="bg-tool-adjust" />
                                    <span>{{ $tsl('调色') }}</span>
                                </Button>
                                <div
                                    class="eui-v2-editor-background--color-panel"
                                    slot="content"
                                    v-if="enableColorMix"
                                >
                                    <Tabs :value="tab" :tabs="tabs" @change="tab = $event" />
                                    <div
                                        v-if="tab === 'preset'"
                                        class="eui-v2-editor-background--color-panel__preset"
                                    >
                                        <ul
                                            class="eui-v2-editor-background--color-panel__preset__content"
                                        >
                                            <li
                                                v-for="(item, i) in colors"
                                                @click="backgroundPalette(item)"
                                                :class="{
                                                    'has-border': item === '#FFFFFF' || item === '',
                                                }"
                                                :style="'background-color:' + item"
                                                :key="i"
                                            >
                                                {{ item === '' ? $tsl('原图') : '' }}
                                            </li>
                                        </ul>

                                        <div class="eui-v2-editor-background--color-panel__alpha">
                                            {{ $tsl('调色强度') }}
                                            <RangeSlider
                                                :max="1"
                                                :min="0"
                                                :value="1 - opacity"
                                                @change="changeOpacity"
                                            />
                                            <span
                                                class="eui-v2-editor-background--color-panel__alpha--tip"
                                            >
                                                {{ opacityStr }}
                                            </span>
                                        </div>
                                    </div>

                                    <div v-if="tab === 'picker'">
                                        <ColorPickerPanel
                                            format="hex8"
                                            :value="backgroundColor"
                                            :cmyk-mode="cmykMode"
                                            :show-straw="enableStraw"
                                            :straw-activated.sync="strawActivated"
                                            @click-straw="clickStraw"
                                            @input="backgroundPalette"
                                        />
                                    </div>
                                    <div v-else-if="tab === 'team'">
                                        <BrandColorPanel
                                            class="eui-v2-color-picker__brand"
                                            @change="backgroundPalette"
                                            :teamService="teamService"
                                        />
                                    </div>
                                </div>
                            </Popup>
                        </div>

                        <div class="eui-v2-panel-form__item--col">
                            <Button
                                class="eui-v2-editor-background__hover eui-v2-panel-btn"
                                block
                                :disabled="isEditing"
                            >
                                <Icon name="bg-tool-flip" />
                                <span>{{ $tsl('翻转') }}</span>
                                <div
                                    v-show="!isEditing"
                                    class="eui-v2-editor-background__hover__popup"
                                >
                                    <DropdownMenus>
                                        <DropdownMenu @click="onFlip('x')">
                                            <Icon name="flip-horizontal" slot="start" />
                                            {{ $tsl('水平翻转') }}
                                        </DropdownMenu>
                                        <DropdownMenu @click="onFlip('y')">
                                            <Icon name="flip-vertical" slot="start" />
                                            {{ $tsl('垂直翻转') }}
                                        </DropdownMenu>
                                    </DropdownMenus>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-show="bgType === 'color'"
            class="eui-v2-editor-background-color-editor"
            :class="disabledClass"
        >
            <EditorColorPanel
                type="background"
                enable-alpha
                format="hex8"
                :editor="editor"
                label=""
                :colors="[backgroundColor]"
                :cmyk-mode="cmykMode"
                :options="options"
                :show-straw="enableStraw"
                :straw-activated.sync="strawActivated"
                @click-straw="clickStraw"
                @change="setBackgroundColor"
            />
        </div>
    </div>
</template>

<script>
import { cloneDeep, get, isObject, isString, set, noop } from 'lodash';
import tinycolor from 'tinycolor2';
import { inject, ref, computed } from '@vue/composition-api';
import { EDITOR_UI_PROVIDER_KEY, defaultConfig } from '../../base/config-provider/provide';

import Button from '../../base/button';
import EditorColorPanel from '../../components/editor-color-panel';
import ColorPickerPanel from '../../base/color-picker-panel';
import BrandColorPanel from '../../base/brand-color-panel';
import RangeSlider from '../../base/range-slider';
import Popup from '../../base/popup';
import Tabs from '../../components/color-picker/tabs';
import ToggleTab from '../../components/toggle-tab';
import DropdownMenus from '../../base/dropdown-menus';
import DropdownMenu from '../../base/dropdown-menu';
import Icon from '../../base/icon';
import strawMixin from '../../utils/editor-straw-mixin';
import transformMathUtils from '@gaoding/editor-utils/transform-math';
import { getBackgroundImageStyle, getBackgroundGradientStyle } from './utils';
import { LRUMap } from 'lru_map';
import { i18n } from '../../i18n';

const PRESET_COLORS = [
    '',
    '#000000',
    '#737373',
    '#D9D9D9',
    '#FFFFFF',
    '#A72A2A',
    '#A76E0E',
    '#518625',
    '#191F8A',
    '#49178B',
    '#E65353',
    '#FFD835',
    '#70BC59',
    '#607AF4',
    '#976BEE',
    '#FFECBC',
    '#E9FBBD',
    '#D9DDFF',
    '#F6DEFF',
    '#FFDAE3',
];

const metaInfoMap = new LRUMap(80);

export default {
    components: {
        Button,
        EditorColorPanel,
        Popup,
        ColorPickerPanel,
        BrandColorPanel,
        Tabs,
        ToggleTab,
        RangeSlider,
        DropdownMenus,
        DropdownMenu,
        Icon,
    },
    mixins: [strawMixin],
    inject: {
        teamService: {
            type: Object,
            default() {
                return null;
            },
        },
        onMatting: {
            type: Function,
            default() {
                return () => {};
            },
        },
        onTabChange: {
            type: Function,
            default() {
                return () => {};
            },
        },
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        useImage: {
            type: Boolean,
            default: false,
        },
        pickImage: {
            type: Function,
            default: noop,
        },
        enableStraw: {
            type: Boolean,
            default: true,
        },
        enableTag: {
            type: Boolean,
            default: false,
        },
        enableColorMix: {
            type: Boolean,
            default: true,
        },
    },
    setup() {
        const config = inject(EDITOR_UI_PROVIDER_KEY, ref(defaultConfig));
        return {
            disabledClass: computed(() =>
                !config.value.enableBackgroundPanelStylePart
                    ? config.value.stylePartyDisabledClass
                    : '',
            ),
        };
    },
    data() {
        return {
            imageCategories: [
                { value: '', name: '无标签' },
                { value: 'mainImg', name: '主图' },
                { value: 'QRCODE', name: '二维码' },
                { value: 'backImg', name: '背景图' },
                { value: 'autoMatting', name: '抠图' },
            ],
            bgType: null,
            panelVisible: false,
            colors: PRESET_COLORS,
            tab: 'picker',
            preview: {
                width: 0,
                height: 0,
            },
            colorCache: '#fff',
            imageCache: null,
            hideMatting: process.env.VUE_APP_HIDE_MATTING === 'true' || this.$isTablet,
        };
    },
    computed: {
        tag() {
            const { category = '' } = this.layout.background?.image;
            const { imageCategories } = this;
            const item = imageCategories.filter((p) => p.value === category)[0];
            return item ? item.name : '';
        },
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        disabledMatting() {
            const url = get(this, 'layout.$backgroundImageInfo.url');
            return (
                !url ||
                url.includes('data:image/gif') ||
                /\.gif/i.test(url) ||
                url.includes('data:image/svg') ||
                /\.svg/i.test(url)
            );
        },
        options() {
            return this.teamService;
        },
        layout() {
            return this.editor.currentLayout;
        },
        isEditing() {
            return this.layout.$backgroundEditing;
        },
        isGif() {
            return this.layout.isGif || this.layout.isApng;
        },
        backgroundImageInfo() {
            return this.layout.$backgroundImageInfo || {};
        },
        opacity() {
            return this.backgroundImageInfo.opacity === undefined
                ? 1
                : this.backgroundImageInfo.opacity;
        },
        opacityStr() {
            return Math.round((1 - this.opacity) * 100) + '%';
        },
        scale() {
            const ratio = Math.min(
                this.preview.width / this.layout.width,
                this.preview.height / this.layout.height,
            );

            return ratio;
        },
        backgroundColor() {
            const { background } = this.layout;
            return background.gradient || background.color || '#00000000';
        },
        previewLayoutSize() {
            const { width, height } = this.layout;
            return {
                width: width * this.scale,
                height: height * this.scale,
            };
        },
        previewBoxCss() {
            const { opacity, backgroundColor, previewLayoutSize } = this;
            const style = {
                opacity,
                width: previewLayoutSize.width + 'px',
                height: previewLayoutSize.height + 'px',
            };
            if (isObject(backgroundColor)) {
                Object.assign(style, getBackgroundGradientStyle(backgroundColor));
            } else if (isString(backgroundColor)) {
                style.backgroundColor = tinycolor(backgroundColor).toString('rgb') || 'transparent';
            }
            return style;
        },
        previewImageStyle() {
            return getBackgroundImageStyle(this.layout.$backgroundImageInfo, this.scale);
        },
        hasTeam() {
            const teamService = this.teamService;
            if (teamService && teamService.teams) {
                const teams = teamService.teams;
                return teams.filter((team) => team.brands && team.brands.length > 0).length > 0;
            }
            return false;
        },
        tabs() {
            const tabs = [
                { name: i18n.$tsl('预设颜色'), value: 'preset' },
                { name: i18n.$tsl('调色盘'), value: 'picker' },
            ];
            if (this.hasTeam) {
                tabs.push({ name: i18n.$tsl('品牌'), value: 'team' });
            }
            return tabs;
        },
    },
    watch: {
        'layout.background': {
            handler() {
                this.resetBgType();
            },
            deep: true,
        },
        'layout.metaInfo': {
            handler(metaInfo) {
                if (!this.layout?.$backgroundImage) return;
                const materials = get(metaInfo, 'materials', []).filter((item) => {
                    return item.type === 'background';
                });

                metaInfoMap.set(this.layout.$backgroundImage, materials);
            },
            immediate: true,
        },
    },
    mounted() {
        this.initLayoutData();
    },
    methods: {
        selectCategory(category, dropdown) {
            dropdown.close();
            const background = { ...this.layout.background };
            background.image.category = category;
            this.editor.changeLayout({
                background,
            });
        },
        $tsl: i18n.$tsl,
        removeBackgroundMetaInfo() {
            if (this.layout && !this.layout.$backgroundImageInfo) {
                const exBgMetainfo = get(this.layout, 'metaInfo.materials', []).filter((item) => {
                    return item.type !== 'background';
                });

                set(this.layout, 'metaInfo.materials', exBgMetainfo);
                set(this.layout, 'background.watermarkEnable', false);
                this.editor.changeLayout({ metaInfo: { ...this.layout.metaInfo } });
            }
        },
        initLayoutData() {
            if (this.layout) {
                this.bgType = get(this.layout, 'background.image') ? 'image' : 'color';
                this.colorCache =
                    get(this.layout, 'background.gradient') ||
                    get(this.layout, 'background.color', '');
            }
            this.resetBgType();
        },

        resetBgType() {
            this.bgType = get(this.layout, 'background.image') ? 'image' : 'color';
            if (this.bgType === 'image' && !this.preview.width) {
                this.$nextTick(() => {
                    this.setPreviewSize();
                });
            }
        },

        setPreviewSize() {
            if (this.$refs.preview) {
                this.preview = {
                    width: this.$refs.preview.offsetWidth || 0,
                    height: this.$refs.preview.offsetHeight || 0,
                };
            }
        },

        clearBackgroundImage() {
            this.editor.changeLayout(
                { background: { ...this.layout.background, image: null } },
                this.layout,
            );
        },

        tabChange(val) {
            if (val === this.bgType) {
                return;
            }
            this.bgType = val;
            const { layout } = this;
            this.editor.hideBackgrounCroper(layout);

            let materials;
            switch (val) {
                case 'color':
                    this.imageCache = this.layout.$backgroundImageInfo;
                    this.clearBackgroundImage();
                    this.setBackgroundColor(this.colorCache);
                    this.removeBackgroundMetaInfo();
                    break;
                case 'image':
                    if (this.imageCache) {
                        this.editor.changeLayout(
                            { background: { ...this.layout.background, image: this.imageCache } },
                            this.layout,
                        );
                    }

                    if (this.imageCache?.url) {
                        materials = metaInfoMap.get(this.imageCache.url);

                        // 切回图片要把metainfo设置回来
                        materials &&
                            set(this.layout, 'metaInfo.materials', [
                                ...get(this.layout, 'metaInfo.materials', []),
                                ...materials,
                            ]);

                        this.editor.changeLayout({ metaInfo: this.layout.metaInfo }, this.layout);
                    }
                    break;
            }
            this.onTabChange(val);
        },

        onCrop() {
            this.editor.showBackgrounCroper(this.layout);
        },

        onBgMatting() {
            this.onMatting(this.layout.$backgroundImageInfo.url);
            this.editor.focusLayoutBackground(this.layout);
        },

        onFlip(dir) {
            const layout = this.layout;
            const { $backgroundImageInfo } = layout;
            const transform = $backgroundImageInfo.transform;

            transform.scale[dir] *= -1;
            if (dir === 'x') {
                transform.position.x *= -1;
                transform.rotation = transformMathUtils.degToRad(
                    transformMathUtils.radToDeg(transform.rotation) * -1,
                );
            }

            if (dir === 'y') {
                transform.position.y *= -1;
                transform.rotation = transformMathUtils.degToRad(
                    transformMathUtils.radToDeg(transform.rotation) * -1,
                );
            }

            this.layout.background.image.transform = transform;
            this.editor.changeLayout(
                {
                    background: cloneDeep(this.layout.background),
                },
                this.layout,
            );
        },

        changeOpacity(v) {
            const background = cloneDeep(this.layout.background);
            background.image.opacity = 1 - v;
            this.editor.changeLayout({ background }, this.layout);
        },

        onPickImage() {
            if (this.useImage) {
                Promise.resolve()
                    .then(() => {
                        return this.pickImage();
                    })
                    .then(({ material, metaInfo, origin }) => {
                        if (!material) {
                            return;
                        }
                        const { url, width, height } = material.preview;
                        const { isGif, isApng } = material;
                        if (metaInfo) {
                            metaInfo.type = 'background';
                        }

                        this.changeBackgroundImage(
                            { url, width, height, isGif, isApng },
                            true,
                            metaInfo,
                            origin,
                        );
                    });
            } else {
                this.editor.pickImage(noop, (file) => {
                    Promise.resolve()
                        .then(() => {
                            return this.pickImage(file);
                        })
                        .then((image) => {
                            if (!image) {
                                return;
                            }
                            this.changeBackgroundImage(image, true);
                        });
                });
            }
        },
        changeBackgroundImage(imageData, firstChange = false, metaInfo) {
            const { width, height, isGif, isApng } = imageData;

            if (get(this.layout, 'metaInfo.thirdParty.inpaint.url')) {
                set(this.layout, 'metaInfo.thirdParty.inpaint', undefined);
            }
            if (get(this.layout, 'metaInfo.thirdParty.matting')) {
                set(this.layout, 'metaInfo.thirdParty.matting', undefined);
            }

            const materials = get(this.layout, 'metaInfo.materials', []).filter(
                (material) => !['image', 'background', 'background_image'].includes(material.type),
            );

            if (metaInfo) {
                materials.push(metaInfo);
            }

            const resourceType = isGif ? 'gif' : isApng ? 'apng' : 'image';
            const backgroundImage = Object.assign({}, this.$backgroundImageInfo || {}, imageData, {
                resourceType,
                naturalWidth: width,
                naturalHeight: height,
            });

            if (firstChange) {
                const ratio = Math.max(this.layout.width / width, this.layout.height / height);
                backgroundImage.imageTransform = {
                    a: ratio,
                    b: 0,
                    c: 0,
                    d: ratio,
                    tx: 0,
                    ty: 0,
                };
                backgroundImage.top = 0;
                backgroundImage.left = 0;
                backgroundImage.width = this.layout.width;
                backgroundImage.height = this.layout.height;
                backgroundImage.transform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
            }

            const bg = { ...this.layout.background, image: backgroundImage };
            this.editor.changeLayout({ background: bg }, this.layout);

            // changeLayout 有过滤materials，在放在后面
            set(this.layout, 'metaInfo.materials', materials);
            this.editor.changeLayout({ metaInfo: this.layout.metaInfo }, this.layout);
        },

        // 背景图调色
        backgroundPalette(val) {
            const background = cloneDeep(this.layout.background);
            // 原图
            if (val === '') {
                background.image.opacity = 1;
                this.editor.changeLayout({ background }, this.layout);
            }
            // 图片
            else if (typeof val === 'string') {
                background.color = val;
                background.gradient = null;

                const opacity =
                    typeof background.image.opacity === 'number' ? background.image.opacity : 1;
                background.image.opacity = opacity ? 0.7 : background.image.opacity;
                this.editor.changeLayout({ background }, this.layout);
            }
        },

        clearLayoutCache() {
            this.imageCache = null;
        },

        // 设置纯色背景图片
        setBackgroundColor(color) {
            const background = this.layout.background;
            if (color.type === 'gradient') {
                background.gradient = color.data;
                background.color = null;
            } else if (color.type === 'color') {
                background.color = color.data;
                background.gradient = null;
            }
            this.editor.changeLayout({ background: { ...background } }, this.layout);
        },

        togglePanelVisible() {
            this.panelVisible = !this.panelVisible;
            this.curAlpha = Math.round((1 - this.opacity) * 100);
            this.tab = 'preset';
        },

        onVisibleChange(value) {
            if (!this.strawActivated) {
                this.panelVisible = value;
            }
        },
    },
};
</script>

<style lang="less">
.eui-v2-editor-background {
    &__dropdown-button {
        width: 100%;
        border: none;
        background-color: #f6f7f9;
        &:hover {
            background-color: #e8eaec;
        }
        &.activated {
            background-color: #f6f7f9;
            color: inherit;
        }
    }
    &__preview {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        width: 100%;
        height: 84px;
        padding: 10px 0;
        background: #f6f7f9;
        border-radius: 4px;
        border: none;
        overflow: hidden;

        &--wrapper {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 10px;
            bottom: 10px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0.85);
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
            border-radius: 4px;
        }

        &--image {
            width: 100%;
            height: 100%;
            position: relative;
            background-size: 100% 100%;
            pointer-events: none;
        }
    }

    &--color-panel {
        border: 1px solid @border-color;
        width: 256px;
        background: white;
        box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
        border-radius: 4px;
        transform: translateX(16px);

        .eui-v2-color-picker-header {
            margin-top: 16px;
        }

        .eui-v2-tabs {
            &__header {
                border-bottom: none;

                .eui-v2-tab {
                    font-size: 14px;
                    line-height: 20px;
                }

                &.eui-v2-tabs--single {
                    justify-content: left;
                }
            }

            &__line {
                display: none;
            }
        }

        &__preset {
            box-sizing: border-box;

            &__content {
                padding: 0 12px;
                display: flex;
                flex-wrap: wrap;
                margin: 0;

                li {
                    cursor: pointer;
                    box-sizing: border-box;
                    list-style: none;
                    width: 42px;
                    height: 42px;
                    border-radius: 2px;
                    margin: 2px;
                    line-height: 42px;
                    text-align: center;
                    font-size: 12px;
                    color: #000;
                    user-select: none;
                    &.has-border {
                        line-height: 40px;
                        border: 1px solid @border-color;
                        text-overflow: ellipsis;
                        padding: 0 8px;
                        overflow: hidden;
                    }
                }
            }
        }
        &__alpha {
            font-size: 14px;
            color: @normal-color;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px 27px;
            user-select: none;

            .eui-v2-range-slider {
                flex: 1;
                margin-left: 21px;
            }

            &--tip {
                color: @gray-color;
                width: 49px;
                text-align: right;
                top: -1px;
            }
        }
    }

    .eui-v2-panel-form__label {
        color: #9da3ac;
    }

    .eui-v2-editor-color-panel {
        border: 1px solid @border-color;
    }

    .eui-v2-editor-color-panel__colors {
        padding: 0 10px;
    }

    .eui-v2-panel-btn {
        height: 40px;
        color: #33383e;
        background: #f6f7f9;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        padding: 0 12px;

        .eui-v2-button__container {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            line-height: 40px;

            span {
                margin-left: 8px;
                max-width: 60px;
                text-overflow: ellipsis;
                overflow: hidden;
            }
        }

        .eui-v2-icon {
            font-size: 18px;
        }

        &:disabled {
            opacity: 0.7;
            .eui-v2-editor-background__hover__popup {
                display: none !important;
            }
        }
        &:disabled:hover {
            background: #f6f7f9;
        }

        &:hover {
            background: #e8eaec;
        }
    }

    &__hover {
        position: relative;
        z-index: 10;
        &__popup {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            width: max-content;
            padding: 4px 0 0 0;
        }

        &:hover {
            .eui-v2-editor-background__hover__popup {
                display: block;
            }
        }

        &:active {
            color: @normal-color;
            border-color: @normal-color;
        }
    }

    .eui-v2-editor-background__hover__popup {
        .eui-v2-icon {
            margin-right: 0;
        }
    }

    .eui-v2-editor-background-color-tabs {
        margin-bottom: 12px;
        .eui-v2-tab {
            padding: 5px 0;
        }
    }

    .eui-v2-editor-background-color-editor {
        .eui-v2-editor-color-panel {
            padding: 0 !important;
            border: none !important;

            &__label {
                display: none !important;
                height: 0 !important;
            }
        }

        .eui-v2-editor-color-panel__colors {
            margin: 0;
            padding: 8px;
            background: #f6f7f9;
            border-radius: 4px;
        }

        .eui-v2-editor-color-panel__colors__item {
            height: 24px;
            border-radius: 2px;
        }
    }
}
</style>
