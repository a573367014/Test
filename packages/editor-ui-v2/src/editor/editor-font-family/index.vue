<style lang="less">
.eui-v2-editor-font-family {
    &__hint {
        width: 100%;
        left: 0;
        top: 100%;
        border-radius: 2px;
        background: #fffad5;
        user-select: none;
        line-height: 24px;
        font-size: 12px;
        color: #666666;
        display: flex;
        justify-content: center;
        align-items: center;

        .certificate-url {
            margin-left: 4px;
            cursor: pointer;
            color: #33383e;
            &:hover {
                text-decoration: underline;
                color: #000;
            }
        }

        .certificate-icon {
            cursor: pointer;
            position: relative;
            .eui-v2-icon {
                font-size: 14px;
                position: relative;
                color: #33383e;
                top: 3px;
                left: 1px;
            }
            &:hover {
                .eui-v2-icon {
                    color: #000;
                }
                .editor-download-tooltips__content {
                    display: block;
                }
            }
        }

        .editor-download-tooltips__content {
            display: none;
            vertical-align: middle;
            padding: 6px 8px;
            background-color: #333;
            border-radius: 2px;
            white-space: nowrap;
            font-size: 13px;
            line-height: 18px;
            color: white;
            position: absolute;
            right: -15px;
            top: 26px;
            z-index: 2;

            &::before {
                content: '';
                width: 0;
                height: 0;
                border-style: solid;
                position: absolute;
                border-width: 5px;
                border-color: transparent transparent #333 transparent;
                top: -10px;
                right: 16px;
            }
        }
    }

    .eui-v2-button {
        line-height: 18px;
        border: none;
    }

    &__team {
        margin: 11px 10px 2px;

        &__dropdown {
            max-height: 200px;
        }
    }

    &__empty {
        padding: 72px 0 0;
        text-align: center;
        color: #8d949e;
        font-size: 12px;
        line-height: 17px;

        img {
            width: 72px;
            height: 72px;
            display: block;
            margin: 0 auto;
        }
    }
}
</style>

<template>
    <div class="eui-v2-editor-font-family">
        <DropdownFontFamily
            block
            @change="onFontFamilyChange"
            :height="400"
            :placeholder-height="476"
            :font="currentFont"
            :fonts-list="fontsList"
            :lang.sync="lang"
            :langs="langs"
            :editor="editor"
            :loading="isFontLoading"
            :font-family-mixed="fontFamilyMixed"
            :search.sync="search"
            :autoClose="false"
            :editorFontList="editorFontList"
            @active="$emit('active', $event)"
            @inactive="$emit('inactive', $event)"
        >
            <template #pre="pre">
                <div class="eui-v2-editor-font-family__team" v-if="pre.lang === 'team' && !search">
                    <DropdownButton block :loading="teamLoading">
                        {{ currentBrandName }}
                        <template #dropdown="dropdown">
                            <eui-v2-dropdown-menus
                                class="eui-v2-editor-font-family__team__dropdown"
                            >
                                <div v-for="team in teams" :key="team.id">
                                    <eui-v2-dropdown-menu size="label">
                                        {{ team.name }}
                                    </eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu
                                        size="small"
                                        v-for="brand in team.brands"
                                        :key="brand.id"
                                        :activated="currentBrand && currentBrand.id === brand.id"
                                        @click="selectBrand(brand, dropdown)"
                                    >
                                        {{ brand.name }}
                                    </eui-v2-dropdown-menu>
                                </div>
                            </eui-v2-dropdown-menus>
                        </template>
                    </DropdownButton>
                </div>
            </template>
            <template #end="end">
                <div
                    class="eui-v2-editor-font-family__empty"
                    v-if="(end.lang === 'team' || search) && fontsList.length === 0"
                >
                    <img src="https://st-gdx.dancf.com/assets/20191208-085830-22a2.png" />
                    <span v-if="search">很抱歉，没找到您要搜索的结果</span>
                    <span v-else-if="end.lang === 'team'">当前品牌暂无品牌字体</span>
                </div>
            </template>
        </DropdownFontFamily>

        <!-- <div
            class="eui-v2-editor-font-family__hint"
            v-if="showHintText && hintText">
            <span v-html="hintText"></span>
            <a
                class="certificate-url"
                target="_blank"
                :href="currentFont.license.url"
                v-if="showLicense">字体许可证</a>
            <div
                class="certificate-icon"
                v-if="showLicense">
                <a target="_blank" :href="currentFont.license.url">
                    <eui-v2-icon name="help-circle" />
                </a>
                <div class="editor-download-tooltips__content">
                    查看 Google Fonts 字体许可证
                </div>
            </div>
        </div> -->
        <Loading :showLoading="isFontLoading" :loadingPosition="loadingPosition" />
    </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep';
import Loading from '../editor-loading';
import DropdownFontFamily from '../../components/dropdown-font-family';
import DropdownButton from '../../base/dropdown-button';
import {
    getFontsByLang,
    getFonts,
    getHintText,
    insertFontsLicense,
    THREE_UNSUPPORT_FONT_LIST,
    checkFontRisk,
    checkFree,
    tips,
} from '../../utils/font-helper';
import { i18n } from '../../i18n';

const defaultBusinessIcon = 'https://st0.dancf.com/csc/208/configs/system/20190911-164143-081a.png';
const defaultVipIcon =
    'https://st-gdx.dancf.com/gaodingx/213/configs/system/20200320-100202-1f28.png';
const defaultSvipIcon =
    'https://st-gdx.dancf.com/gaodingx/213/configs/system/20200322-130934-5ba1.png';
export default {
    components: {
        DropdownFontFamily,
        Loading,
        DropdownButton,
    },
    inject: {
        teamService: {
            type: Object,
            default: () => null,
        },
        euiConfig: {
            default: () => ({}),
        },
        vipMode: {
            type: Boolean,
            default: true,
        },
    },
    props: {
        editor: { type: Object, required: true },
        effectFonts: { type: Array, default: () => [] },
        platformId: {
            type: [Number, Object],
            default: null,
        },
        showHintText: {
            type: Boolean,
            default: false,
        },
        businessIcon: {
            type: String,
            default: '',
        },
        vipIcon: {
            type: String,
            default: '',
        },
        svipIcon: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            lang: 'zh',
            isFontLoading: false,
            loadingPosition: null,
            search: '',
        };
    },
    computed: {
        innerBusinessIcon() {
            if (!this.vipMode) {
                return '';
            }
            return this.businessIcon || this.euiConfig.businessIcon || defaultBusinessIcon;
        },
        innerVipIcon() {
            if (!this.vipMode) {
                return '';
            }
            return this.vipIcon || this.euiConfig.vipIcon || defaultVipIcon;
        },
        innerSvipIcon() {
            if (!this.vipMode) {
                return '';
            }
            return this.svipIcon || this.euiConfig.svipIcon || defaultSvipIcon;
        },
        teams() {
            const { teamService } = this;
            if (teamService && teamService.teams) {
                return teamService.teams.filter((team) => team.brands && team.brands.length > 0);
            }
            return [];
        },
        currentBrand: {
            set(brand) {
                if (this.teamService) {
                    this.teamService.currentBrand = brand;
                }
            },
            get() {
                if (this.teamService) {
                    return this.teamService.currentBrand;
                }
                return null;
            },
        },
        currentBrandName() {
            const { currentBrand, teamLoading } = this;
            if (teamLoading) {
                return i18n.$tsl('正在加载中...');
            }
            if (!currentBrand) {
                return i18n.$tsl('请选择品牌');
            }
            return currentBrand.name;
        },
        teamLoading() {
            const { teamService } = this;
            return teamService && teamService.loadingTeamsWithBrands;
        },
        langs() {
            const langs = [
                {
                    content: i18n.$tsl('中文'),
                    name: 'zh',
                },
                {
                    content: i18n.$tsl('英文'),
                    name: 'en',
                },
            ];
            if (this.teams.length > 0) {
                langs.push({ content: i18n.$tsl('品牌'), name: 'team' });
            }
            return langs;
        },
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        elements() {
            if (this.elem.type === '$selector') {
                return this.elem.elements;
            }
            return [this.elem];
        },
        isStyledText() {
            return this.elem.type === 'styledText';
        },
        hintText() {
            const font = this.editorFontList.find((font) => font.name === this.elem.fontFamily);
            if (font) {
                const text = getHintText(font, this.vipMode);
                return this.euiConfig.fontTipCallback ? this.euiConfig.fontTipCallback(text) : text;
            }

            return '';
        },
        // showLicense() {
        //     const font = this.editorFontList.find(font => font.name === this.elem.fontFamily);
        //     const id = font?.authorization?.id || font?.authorization_id;

        //     if(id === 26 && font?.license?.url) {
        //         return font?.license?.url;
        //     }

        //     return false;
        // },
        // 是否是锐体字体
        isREEJIFont() {
            const font = this.editorFontList.find((font) => font.name === this.elem.fontFamily);
            return !font.family.toUpperCase().includes('REEJI');
        },

        fontListOfEffect() {
            if (this.elem.type !== 'styledText') return [];

            return this.effectFonts
                .filter((effectFont) =>
                    effectFont.effects.find((effect) => effect.id === this.currentEffectId),
                )
                .map((effectFont) => {
                    effectFont.font.effectFontId = effectFont.id;
                    const effect = effectFont.effects.find((e) => e.id === this.currentEffectId);
                    effectFont.font.tooltipPreview = effect.preview;
                    return effectFont.font;
                });
        },

        editorFontList() {
            let fontList = this.editor.options.fontList;
            fontList = insertFontsLicense(fontList);

            return fontList
                .filter((font) => {
                    if (
                        this.elem.type === 'threeText' &&
                        THREE_UNSUPPORT_FONT_LIST.includes(font.name)
                    ) {
                        return false;
                    }

                    return true;
                })
                .map((font) => {
                    const data = { ...font };
                    if (this.elem.type === 'styledText') {
                        const effectFont = this.effectFonts.find((ef) => ef.font_id === font.id);
                        let effect;
                        if (effectFont) {
                            effect = effectFont.effects.find((e) => e.id === this.currentEffectId);
                        }
                        Object.assign(data, {
                            effectFontId: effectFont ? effectFont.id : null,
                            tooltipPreview: effect ? effect.preview : null,
                            tooltip: !effect ? i18n.$tsl('不支持此样式') : null,
                            tooltipClass: !effect ? 'warning' : '',
                        });
                    }
                    return data;
                });
        },

        fontsList() {
            const { lang, currentBrand, search } = this;
            if (this.search) {
                return this.getFontsByRegEx();
            }
            if (lang === 'team') {
                return this.getTeamFonts(currentBrand);
            }
            const fontList = this.getFontsByLang(this.lang);

            if (this.euiConfig.isFree) {
                return fontList.filter((list) => {
                    return list.propName === 'usedFonts' || list.propName === 'freeFonts';
                });
            }

            fontList.forEach((item) => {
                const tempTip = item.tip;
                item.tip = (...rest) => {
                    const text = tempTip && tempTip(...rest);
                    return this.euiConfig.fontTipCallback
                        ? this.euiConfig.fontTipCallback(text, ...rest)
                        : text;
                };
            });
            return fontList;
        },

        usedFonts() {
            return this.getUsedFontList().map((font) => {
                const data = { ...font };
                if (this.elem.type === 'styledText') {
                    const effectFont = this.effectFonts.find((ef) => ef.font_id === font.id);
                    let effect;
                    if (effectFont) {
                        effect = effectFont.effects.find((e) => e.id === this.currentEffectId);
                    }
                    Object.assign(data, {
                        effectFontId: effectFont ? effectFont.id : null,
                        tooltipPreview: effect ? effect.preview : null,
                        tooltip: !effect ? i18n.$tsl('不支持此样式') : null,
                    });
                }
                return data;
            });
        },
        currentFont() {
            const { fontFamilyMixed, elem, editor } = this;
            if (fontFamilyMixed) {
                return null;
            }

            let fontFamily;
            if (elem.type === '$selector') {
                fontFamily = elem.elements[0].fontFamily;
            } else if (editor.currentSelection) {
                fontFamily = editor.currentSelection.fontFamily;
            } else {
                fontFamily = editor.currentElement.fontFamily;
            }
            return this.editorFontList.find(
                (font) => fontFamily === font.name || fontFamily === font.family,
            );
        },
        fontFamilyMixed() {
            const { elem, currentSelection, editor } = this;
            if (elem.type === '$selector') {
                const fontFamily = elem.elements[0].fontFamily;
                return elem.elements.some((element) => element.fontFamily !== fontFamily);
            } else if (editor.currentSelection) {
                return editor.currentSelection.fontFamilyMixed;
            } else if (elem.fontFamilyMixed) {
                return elem.fontFamilyMixed;
            } else {
                return false;
            }
        },
        currentEffectId() {
            if (!this.elem || this.elem.type !== 'styledText') return null;
            return this.elem.effectStyle.id;
        },
    },
    mounted() {
        this.init();
        this.editor.$events.$on('element.loaded', this.onFontLoaded);
        this.editor.$events.$on('element.loadError', this.onFontLoaded);
    },
    beforeDestroy() {
        this.editor.$events.$off('element.loaded', this.onFontLoaded);
        this.editor.$events.$off('element.loadError', this.onFontLoaded);
    },
    methods: {
        init() {
            const { teamService } = this;
            if (teamService) {
                teamService.getTeamsWithBrandMaterials(2);
            }
        },
        onFontLoaded() {
            this.isFontLoading = false;
        },
        getElementPosition() {
            const { shellRect, containerRect, zoom, currentElement: curElem } = this.editor;
            const offsetX = containerRect.left + shellRect.left;
            const offsetY = containerRect.top + shellRect.top;
            const left = curElem.left * zoom + offsetX + (curElem.width * zoom - 54) / 2;
            const top = curElem.top * zoom + offsetY + (curElem.height * zoom - 22) / 2;
            this.loadingPosition = {
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
            };
        },
        onFontFamilyChange(font) {
            const { elements } = this;
            elements.forEach((elem) => {
                const weight = font.weight || elem.fontWeight;
                const style = font.style || elem.fontStyle;

                if (
                    elem &&
                    !['threeText', 'styledText'].includes(elem.type) &&
                    font.name !== elem.fontFamily
                ) {
                    this.isFontLoading = true;
                    this.getElementPosition();
                }

                if (this.isStyledText) {
                    this.editor.changeElement(
                        {
                            fontFamily: font.name,
                            effectStyle: {
                                ...elem.effectStyle,
                                effectFontId: font.effectFontId,
                            },
                        },
                        elem,
                    );
                } else {
                    this.editor.changeElement(
                        {
                            fontFamily: font.name,
                            fontWeight: weight,
                            fontStyle: style,
                        },
                        elem,
                    );
                }
            });

            this.$emit('change', font);
        },

        getFontsByLang(lang) {
            const { editorFontList, usedFonts, platformId, fontListOfEffect } = this;

            return getFontsByLang(lang, editorFontList, usedFonts, fontListOfEffect, {
                vipIcon: this.innerVipIcon,
                svipIcon: this.innerSvipIcon,
                businessIcon: this.innerBusinessIcon,
                vipMode: this.vipMode,
            });
        },

        getFontsByRegEx() {
            let { editorFontList, usedFonts, platformId, fontListOfEffect, search } = this;
            // 去空格、处理特殊字符
            search = search.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regEx = new RegExp(search, 'i');
            const vip = search.toLowerCase() === 'vip' || search === '会员';
            const free = search === '免费' || search === '免费字体';
            const gdFonts = getFonts(
                (font) => {
                    const { name, alias, family } = font;
                    return (
                        vip || free || regEx.test(name) || regEx.test(alias) || regEx.test(family)
                    );
                },
                editorFontList,
                [],
                fontListOfEffect,
                {
                    vipIcon: this.innerVipIcon,
                    svipIcon: this.innerSvipIcon,
                    businessIcon: this.innerBusinessIcon,
                    vipMode: this.vipMode,
                },
            );
            return gdFonts.filter((fonts, index) => {
                fonts.title = index ? '' : i18n.$tsl('搜索结果');
                if (vip) {
                    return fonts.propName === 'vipFonts';
                }
                if (free) {
                    return fonts.propName === 'freeFonts';
                }
                return true;
            });
        },

        getUsedFontList(layouts) {
            layouts = layouts || this.editor.layouts;
            const fontsMap = {};

            const textElements = [].concat(
                ...layouts.map((layout) => {
                    return layout.elements.reduce((result, element) => {
                        if (/text/i.test(element.type)) {
                            result.push(element);
                            return result;
                        } else if (element.type === 'group') {
                            const subTextElements = element.elements.filter(
                                (element) => element.type === 'text',
                            );
                            return result.concat(subTextElements);
                        } else {
                            return result;
                        }
                    }, []);
                }),
            );

            const options = this.editor.options;
            const rBreakLine = /<br>|\r|\n/g;

            textElements.forEach((element) => {
                const { contents = [{}], fontFamily } = element;

                contents.forEach((item) => {
                    const font =
                        options.fontsMap[item.fontFamily] ||
                        options.fontsMap[fontFamily] ||
                        options.fontList[0];

                    if (!font || (item.content && !item.content.replace(rBreakLine, ''))) return;
                    const family = font.family || font.name;

                    if (!fontsMap[family]) {
                        fontsMap[family] = cloneDeep(font);
                    }
                });
            });

            return Object.keys(fontsMap).map((k) => fontsMap[k]);
        },

        selectBrand(brand, dropdown) {
            this.currentBrand = brand;
            if (dropdown) {
                dropdown.close();
            }
        },

        getTeamFonts(brand) {
            if (brand.fonts) {
                const fonts = [];
                brand.fonts.forEach((font) => {
                    const isFree = checkFree(font);
                    const isRisk = checkFontRisk(font);
                    if (!isRisk && !isFree && this.vipMode) {
                        font.tip = tips.vip.content;
                        font.tipColor = tips.vip.color;
                        font.tipIcon = this.innerVipIcon;
                    } else if (isRisk) {
                        font.tip = tips.business.content;
                        font.tipColor = tips.business.color;
                        font.tipIcon = this.innerBusinessIcon;
                    }
                    fonts.push(font);
                });
                if (fonts.length) {
                    return [
                        {
                            fonts,
                        },
                    ];
                }
            }
            return [];
        },
    },
};
</script>
