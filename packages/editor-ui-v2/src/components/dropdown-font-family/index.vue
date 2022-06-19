<style lang="less">
@import '../../styles/variables.less';

.eui-v2-dropdown-font-family {
    position: relative;
    padding: 0;
    background: #f6f7f9;
    border-radius: 4px;

    &:hover,
    &.eui-v2-button--normal:active,
    &.eui-v2-button--normal.activated {
        background: @hover-dropdown-background-color;
    }

    &.eui-v2-dropdown-button {
        padding-right: 30px;
        border: none;
    }

    &__text {
        padding: 10px 0 10px 16px;
        min-height: 20px;
        max-width: 120px;
        box-sizing: border-box;
        border: none;
        outline: none;
        background-repeat: no-repeat;
        background-size: auto 19px;
        background-position: 13px center;
        background-color: transparent;

        &--preview {
            font-size: 0;
        }
    }

    &__fonts {
        width: 228px;
    }

    &.eui-v2-dropdown-font-withtip {
        padding-left: 16px;
    }
    .font-copy-tip-icon {
        position: absolute;
        top: 50%;
        left: 12px;
        height: 16px;
        width: 16px;
        transform: translateY(-50%);
    }

    .eui-v2-dropdown-button__suffix {
        right: 8px;
        height: 16px;
        width: 16px;
        .eui-v2-icon {
            height: 16px;
            width: 16px;
        }
    }
}
.eui-v2-dropdown-font-tip {
    transform: translateX(-9px);
}
.eui-v2-font-family-panel__footer__tip {
    padding: 12px 0;
    color: #d48620;
    background: #fffbf0;
    font-size: 12px;
    line-height: 19px;
    text-align: center;
    a {
        text-decoration: underline;
    }
}
</style>

<template>
    <DropDownButton
        class="eui-v2-dropdown-font-family"
        :class="isCertificateUrl || isREEJIFont ? 'eui-v2-dropdown-font-withtip' : ''"
        as-ref-width
        :height="placeholderHeight"
        :force-placement="forcePlacement"
        @onShow="(val) => (editor.options.scopePointerEventsEnable = !val)"
        type="grey"
        v-bind="$attrs"
        @active="dropdownActivated"
        @inactive="dropdownDeactivated"
    >
        <ToolTip
            classes="eui-v2-dropdown-font-tip"
            placement="bottom-start"
            :content="getFontCopyTip"
        >
            <a v-if="isCertificateUrl" :href="isCertificateUrl">
                <Icon class="font-copy-tip-icon" name="font-copy-tip" />
            </a>
            <Icon v-if="isREEJIFont" class="font-copy-tip-icon" name="font-copy-tip" />
        </ToolTip>
        <div
            v-if="!dropdownActive"
            class="eui-v2-dropdown-font-family__text"
            :style="previewBackground"
            :class="{ 'eui-v2-dropdown-font-family__text--preview': hasPreview }"
        >
            {{ previewText }}
        </div>

        <input
            v-else
            ref="input"
            class="eui-v2-dropdown-font-family__text"
            type="text"
            :value="innerSearch"
            @input="inputChange"
            @keyup.stop.prevent
            @click.stop
        />
        <template #suffix-icon>
            <Icon name="arrow-down" />
        </template>

        <template #dropdown="dropdown">
            <FontFamilyPanel
                class="eui-v2-dropdown-font-family__fonts"
                :fonts-list="fontsList"
                :lang="lang"
                :langs="langs"
                @update:lang="$emit('update:lang', $event)"
                :tooltip-placement="tooltipPlacement"
                :height="height"
                :force-placement="forcePlacement"
                :search="search"
                @fontHover="panelFontHover"
                @change="onSelectFont($event, dropdown)"
            >
                <template #pre="pre">
                    <slot name="pre" v-bind="pre" />
                </template>
                <template #end="end">
                    <slot name="end" v-bind="end" />
                </template>
                <template #footer>
                    <div
                        v-if="isCertificateUrl || isREEJIFont"
                        class="eui-v2-font-family-panel__footer__tip"
                    >
                        <p v-html="panelFooter"></p>
                    </div>
                </template>
            </FontFamilyPanel>
        </template>
    </DropDownButton>
</template>

<script>
import ToolTip from '../../base/tooltip';
import Icon from '../../base/icon';
import { i18n } from '../../i18n';

import FontFamilyPanel from './font-family-panel';
import DropDownButton from '../../base/dropdown-button';

export default {
    components: {
        FontFamilyPanel,
        DropDownButton,
        ToolTip,
        Icon,
    },
    model: {
        prop: 'font',
        event: 'change',
    },
    props: {
        editor: { type: Object, required: true },
        fontsList: {
            type: Array,
            default: () => [],
        },
        font: {
            type: Object,
            default: () => null,
        },
        lang: {
            type: String,
            default: 'zh',
        },
        tooltipPlacement: {
            type: String,
            default: 'left-center',
        },
        height: {
            type: Number,
            default: 300,
        },
        forcePlacement: {
            type: Boolean,
            default: false,
        },
        autoClose: {
            type: Boolean,
            default: true,
        },
        fontFamilyMixed: {
            type: Boolean,
            default: false,
        },
        placeholderHeight: {
            type: Number,
            default: 0,
        },
        langs: {
            type: Array,
            default: () => {
                return [
                    {
                        name: i18n.$tsl('中文'),
                        value: 'zh',
                    },
                    {
                        name: i18n.$tsl('英文'),
                        value: 'en',
                    },
                ];
            },
        },
        search: {
            type: String,
            default: '',
        },
        editorFontList: {
            type: Array,
            default: () => {
                return [];
            },
        },
    },
    data() {
        return {
            dropdownActive: false,
            innerSearch: '',
        };
    },
    computed: {
        _font() {
            let { font } = this;
            if (Array.isArray(font) && font.length === 1) {
                font = font[0];
            }
            return font;
        },
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        hasPreview() {
            const { _font } = this;
            return _font && _font.preview && _font.preview.url;
        },
        previewBackground() {
            const { _font, hasPreview } = this;
            return {
                backgroundImage: hasPreview ? `url(${_font.preview.url})` : null,
            };
        },
        previewText() {
            const { font, fontFamilyMixed } = this;

            if (fontFamilyMixed) {
                return '多种字体';
            }

            if (font) {
                return font.alias || font.name || font;
            }
            return '-';
        },
        panelFooter() {
            const license = this?.nowDealFont?.license;
            const { cannotLogo } = this;
            const html = {
                google: `查看<a target="_blank" :href="${license?.url}">Google Fonts 字体许可证</a>`,
                ddxs: `查看<a target="_blank" :href="${license?.url}"> 点点像素体 字体许可证</a>`,
                cannotLogo: '不可用于商标logo注册和包装设计',
            };

            if (cannotLogo) return html.cannotLogo;
            if (license?.type) return html[license?.type];
            return null;
        },
        isCertificateUrl() {
            const font = this.nowDealFont;
            const id = font?.authorization?.id || font?.authorization_id;

            if (id === 26 && font?.license?.url) {
                return font?.license?.url;
            }

            return false;
        },
        // 是否是锐体字体
        isREEJIFont() {
            const font = this.nowDealFont;
            return font
                ? !!(
                      font.family.toUpperCase().includes('REEJI') ||
                      font.family.toUpperCase().includes('BIGRUIXIANBLACK')
                  )
                : false;
        },
        // 是否是三极字体
        isSJFont() {
            const font = this.nowDealFont;
            return font ? !!font.family.toUpperCase().startsWith('SJ') : false;
        },
        // 是否是叶根友字体
        isYGYFont() {
            const font = this.nowDealFont;
            return font
                ? !!(
                      font.family.toUpperCase().includes('YEGENYO') ||
                      font.family.toUpperCase().includes('YGY')
                  )
                : false;
        },
        // 是否是站酷字体
        isZCOOLFont() {
            const font = this.nowDealFont;
            return font
                ? !!(
                      font.family.toUpperCase().includes('ZCOOL') ||
                      font.family.toUpperCase().includes('XIAOWEI') ||
                      font.family.toUpperCase().includes('HUXIAOBOKUHEI')
                  )
                : false;
        },
        cannotLogo() {
            const { isREEJIFont, isSJFont, isYGYFont, isZCOOLFont } = this;
            return isREEJIFont || isSJFont || isYGYFont || isZCOOLFont;
        },
        getFontCopyTip() {
            const { cannotLogo } = this;
            const license = this?.nowDealFont?.license;
            const tip = {
                google: '查看 Google Fonts 字体许可证',
                ddxs: '查看 点点像素体 字体许可证',
                cannotLogo: '不可用于商标logo注册和包装设计',
            };

            if (license?.type) return tip[license.type];
            if (cannotLogo) return tip.cannotLogo;
            return '';
        },
    },
    mounted() {
        this.nowDealFont = this.editorFontList.find((font) => font.name === this.elem.fontFamily);
        window.editorFontList = this.editorFontList;
    },
    methods: {
        panelFontHover(font) {
            this.nowDealFont = font;
        },
        onSelectFont(font, dropdown) {
            this.$emit('change', font);

            this.innerSearch = font.alias || font.name;

            if (this.autoClose) {
                dropdown.close();
            }
        },
        dropdownActivated(value) {
            this.$emit('active', value);
            this.dropdownActive = true;
            this.innerSearch = this.previewText;
            this.$nextTick(() => {
                const input = this.$refs.input;
                input.focus();
                input.setSelectionRange(0, this.previewText.length);
            });
        },
        dropdownDeactivated(value) {
            this.$emit('inactive', value);
            this.innerSearch = '';
            this.$emit('update:search', '');
            this.dropdownActive = false;
        },
        inputChange(e) {
            const value = e.target.value;
            this.innerSearch = value;
            this.$emit('update:search', value);
        },
    },
};
</script>
