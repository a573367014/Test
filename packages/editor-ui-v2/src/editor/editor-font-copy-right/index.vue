<style lang="less">
.eui-v2-editor-font-family {
    &__hint {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        left: 0;
        top: 100%;
        border-radius: 2px;
        background: #fffad5;
        user-select: none;
        line-height: 24px;
        font-size: 12px;
        color: #666;

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
            position: relative;
            cursor: pointer;
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
            color: #fff;
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
}
</style>

<template>
    <div class="eui-v2-editor-font-family__hint" v-if="hintText && currentFont.license">
        <span v-html="hintText"></span>
        <a
            class="certificate-url"
            target="_blank"
            :href="currentFont.license.url"
            v-if="showLicense"
        >
            字体许可证
        </a>
        <div class="certificate-icon" v-if="showLicense">
            <a target="_blank" :href="currentFont.license.url">
                <eui-v2-icon name="help-circle" />
            </a>
            <div class="editor-download-tooltips__content">
                {{ licenseHint }}
            </div>
        </div>
    </div>
</template>

<script>
import { getHintText, THREE_UNSUPPORT_FONT_LIST } from '../../utils/font-helper';
import { i18n } from '../../i18n';

export default {
    inject: {
        euiConfig: {
            default: () => ({}),
        },
        vipMode: {
            type: Boolean,
            default: true,
        },
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
    },
    computed: {
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        editorFontList() {
            return this.editor.options.fontList
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
        hintText() {
            const font = this.editorFontList.find((font) => font.name === this.elem.fontFamily);
            if (font) {
                const text = getHintText(font, this.vipMode);
                return this.euiConfig.fontTipCallback ? this.euiConfig.fontTipCallback(text) : text;
            }
            return '';
        },
        licenseHint() {
            const license = this?.currentFont?.license;
            if (!license) return;
            const { type } = license;
            const tip = {
                google: i18n.$tsl('查看 Google Fonts 字体许可证'),
                ddxs: i18n.$tsl('查看 点点像素体 字体许可证'),
            };

            return tip[type];
        },
        showLicense() {
            const font = this.editorFontList.find((font) => font.name === this.elem.fontFamily);
            const id = font?.authorization?.id || font?.authorization_id;

            if (id === 26 && font?.license?.url) {
                return true;
            }
            return false;
        },
    },
};
</script>
