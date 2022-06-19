<style lang="less">
.eui-v2-font-family-panel {
    position: relative;
    padding: 0;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    border: none;

    &__body {
        overflow-y: auto;
        overflow-x: visible;
    }

    &__footer {
        &__tip {
            padding: 16px;
            font-size: 12px;
            line-height: 22px;
            a {
                color: @primary-color;
                text-decoration: none;
            }

            &--normal {
                color: #606770;
                background: white;
            }

            &--warning {
                color: #876030;
                background: #fff9f2;
            }

            &--error {
                color: #e54937;
                background: #fdefee;
            }
        }
    }

    &__tabs {
        padding: 12px;
        .eui-v2-tab-btn {
            padding: 4px 0;
        }
        .eui-v2-tab-content {
            font-size: 12px;
            line-height: 20px;
        }
        .toggle-tabs-bar {
            padding: 2px;
        }
        .toggle-tabs-bar {
            border-radius: 4px;
        }
    }

    &__scroll {
        position: relative;

        &.has-label {
            padding-top: 32px;
        }
    }

    &__sticky {
        position: static;
        & &__label {
            position: sticky;
            position: -webkit-sticky;
            left: 0;
            top: 0;
        }
    }

    &__label {
        position: absolute;
        white-space: nowrap;
        width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
        background-color: @hover-background-color;

        font-size: 13px;
        line-height: 18px;
        padding: 7px 15px;
        box-sizing: border-box;
        z-index: 1;
        left: 0;
        top: 0;
        user-select: none;
    }

    &__list {
        padding: 8px 0;

        &--search {
            padding: 0;
        }

        &__item {
            position: relative;
            width: 100%;
            height: 40px;
            cursor: pointer;
            z-index: 0;

            &.activated,
            &:hover {
                background-color: @hover-background-color;

                .eui-v2-font-family-panel__list__item {
                    &__text,
                    &__text__icon {
                        display: block;
                    }
                    &__text__icon {
                        display: block;
                        box-shadow: 0 0 10px 10px @hover-background-color;
                        background-color: @hover-background-color;
                    }
                }
            }

            &.disabled {
                cursor: not-allowed;
                opacity: 0.8;

                &.activated,
                &:hover {
                    background-color: transparent;
                }
            }

            &__text {
                transition: 0.3s;
                width: 100%;
                height: 100%;

                background-repeat: no-repeat;
                background-position: 9px center;
                background-size: auto 23px;

                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;

                font-size: 20px;
                line-height: 23px;
                box-sizing: border-box;
                &.hover {
                    background-position: -9px center;
                    &.has-icon {
                        width: calc(100% - 40px);
                        &__icon {
                            right: -8px;
                        }
                    }
                }
                &__icon {
                    display: none;
                    position: absolute;
                    width: 28px;
                    height: 19px;

                    top: 11px;
                    right: 15px;

                    background-repeat: no-repeat;
                    background-size: contain;
                    background-position: center;
                    box-shadow: 0 0 10px 10px #fff;
                    background-color: #fff;

                    &--expried {
                        display: block;
                        width: 36px;
                        height: 17px;
                        font-size: 12px;
                        font-family: PingFangSC-Regular, PingFang SC;
                        font-weight: 400;
                        color: rgba(180, 184, 191, 1);
                        line-height: 17px;
                        font-style: normal;
                        text-align: right;

                        &::before {
                            content: '已过期';
                        }
                    }
                }
            }
        }
    }
    &__tooltip {
        padding: 10px 15px;
        border: 1px solid @border-color;
        font-size: 14px;
        border-radius: 4px;

        &::before {
            content: '';
            width: 0;
            height: 0;
            position: absolute;
            border-style: solid;
            border-width: 5px 0 5px 5px;
            border-color: transparent transparent transparent @border-color;

            right: -5px;
            top: 50%;
            transform: translateY(-50%);
        }

        &::after {
            content: '';
            width: 0;
            height: 0;
            position: absolute;
            border-style: solid;
            border-width: 5px 0 5px 5px;

            right: -4px;
            top: 50%;
            transform: translateY(-50%);
        }

        &.normal {
            background-color: white;

            &::after {
                border-color: transparent transparent transparent white;
            }
        }

        &.warning {
            background-color: #fff7d9;

            &::after {
                border-color: transparent transparent transparent #fff7d9;
            }
        }

        &__preview {
            height: 69px;
        }
    }
}
</style>

<template>
    <DropdownMenus class="eui-v2-font-family-panel" @mouseleave="onLeavePanel()">
        <div
            class="eui-v2-font-family-panel__body"
            @scroll="onScroll"
            ref="listBody"
            :style="{ height: `${height}px` }"
        >
            <div class="eui-v2-font-family-panel__tabs">
                <ToggleTab v-if="!search" :value="lang" :tabs="langs" @change="selectLang" />
            </div>

            <slot name="pre" :lang="lang" />

            <popup-base
                :classes="tooltipClass"
                :placement="tooltipPlacement"
                :force-placement="forcePlacement"
                :boundaries-padding="10"
                :reference="hoverElement"
            >
                <div>
                    <div
                        class="eui-v2-font-family-panel__scroll"
                        :class="{
                            'has-label': !!list.title,
                            'eui-v2-font-family-panel__sticky': search,
                        }"
                        v-for="(list, index) in fontsList"
                        :key="`${list.title}${index}`"
                        @mousemove="onHoverFontList(list)"
                    >
                        <div
                            v-if="list.title"
                            :ref="'fontLabel' + index"
                            class="eui-v2-font-family-panel__label"
                        >
                            {{ list.title }}
                        </div>
                        <div
                            class="eui-v2-font-family-panel__list"
                            :class="{ 'eui-v2-font-family-panel__list--search': search }"
                        >
                            <div
                                class="eui-v2-font-family-panel__list__item"
                                v-for="font in list.fonts"
                                :key="font.id"
                                :class="{
                                    disabled: font.disabled,
                                }"
                                @click="selectFont(font)"
                                @mouseenter="onHoverFont(font, $event)"
                                @mouseleave="onLeaveFont(font, $event)"
                            >
                                <div
                                    ref="textItem"
                                    class="eui-v2-font-family-panel__list__item__text"
                                    :class="{
                                        hover: currentHoverClassId === font.id,
                                        'has-icon': !!font.tipIcon,
                                    }"
                                    :style="font | previewImage"
                                >
                                    <i
                                        v-if="font.isExpried"
                                        class="eui-v2-font-family-panel__list__item__text__icon eui-v2-font-family-panel__list__item__text__icon--expried"
                                    />
                                    <i
                                        v-if="font.tipIcon"
                                        :style="font.tipIcon | backgroundImage"
                                        class="eui-v2-font-family-panel__list__item__text__icon"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <template v-if="showFontToolTip" slot="popup">
                    <slot name="tooltip" v-bind="hoverFont">
                        <img
                            v-if="hoverFont.tooltipPreview"
                            class="eui-v2-font-family-panel__tooltip__preview"
                            :src="hoverFont.tooltipPreview.url"
                            :style="tooltipPreviewSize"
                        />
                        <span v-else>
                            {{ hoverFont.tooltip }}
                        </span>
                    </slot>
                </template>
            </popup-base>
            <slot name="end" :lang="lang" />
        </div>

        <div class="eui-v2-font-family-panel__footer">
            <slot
                name="footer"
                :showFooterTip="showFooterTip"
                :hoverFontList="hoverFontList"
                :hoverFont="hoverFont"
            >
                <div
                    class="eui-v2-font-family-panel__footer__tip"
                    v-if="showFooterTip"
                    :class="footerTipClass"
                >
                    <span v-html="getHoverTip(hoverFontEntity.tip)" />
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="hoverFontEntity.tipUrl"
                        v-if="hoverFontEntity.tipUrl"
                    >
                        了解更多
                    </a>
                </div>
            </slot>
        </div>
    </DropdownMenus>
</template>

<script>
import DropdownMenus from '../../base/dropdown-menus';
import PopupBase from '../../base/popup-base';
import ToggleTab from '../toggle-tab';
import { i18n } from '../../i18n';

export default {
    components: {
        PopupBase,
        DropdownMenus,
        ToggleTab,
    },
    filters: {
        previewImage: function (font) {
            const preview = font.preview;
            return {
                backgroundImage: preview ? `url(${preview.url})` : null,
            };
        },
        backgroundImage: function (url) {
            return {
                backgroundImage: `url(${url})`,
            };
        },
    },
    props: {
        fontsList: {
            type: Array,
            default: () => [],
        },
        tooltipPlacement: {
            type: String,
            default: 'left-center',
        },
        height: {
            type: Number,
            default: 400,
        },
        forcePlacement: {
            type: Boolean,
            default: false,
        },
        lang: {
            type: String,
            default: 'zh',
        },
        langs: {
            type: Array,
            default: () => {
                return [
                    {
                        content: i18n.$tsl('中文'),
                        name: 'zh',
                    },
                    {
                        content: i18n.$tsl('英文'),
                        name: 'en',
                    },
                ];
            },
        },
        search: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            currentHoverClassId: null,
            hideFontTip: false,
            hoverFont: null,
            hoverFontList: null,
            hoverElement: null,
            curFont: null,
        };
    },
    computed: {
        showFooterTip() {
            const { hoverFontList, hoverFont } = this;
            if (hoverFont && hoverFont.tip) {
                return hoverFont.tip;
            }
            return (
                hoverFontList &&
                (hoverFontList.tip || hoverFontList.tipUrl) &&
                this.getHoverTip(hoverFontList.tip)
            );
        },
        hoverFontEntity() {
            return this.hoverFont || this.hoverFontList;
        },
        footerTipClass() {
            const { hoverFontList, hoverFont } = this;
            let color = '';
            if (hoverFont && hoverFont.tipColor) {
                color = hoverFont.tipColor;
            } else if (hoverFontList && hoverFontList.tipColor) {
                color = hoverFontList && hoverFontList.tipColor;
            }
            return `eui-v2-font-family-panel__footer__tip--${color || 'normal'}`;
        },
        tooltipClass() {
            const { hoverFont } = this;
            if (!hoverFont) {
                return;
            }
            return ['eui-v2-font-family-panel__tooltip', hoverFont.tooltipClass || 'normal'];
        },
        tooltipPreviewSize() {
            const tooltipPreview = this.hoverFont.tooltipPreview;
            const style = {};

            if (tooltipPreview) {
                const { width, height } = tooltipPreview;
                if (typeof width !== 'undefined') {
                    style.width = width;
                }
                if (typeof height !== 'undefined') {
                    style.height = height;
                }
            }
            return style;
        },
        showFontToolTip() {
            const { hoverFont, hideFontTip } = this;
            return !hideFontTip && hoverFont && (hoverFont.tooltip || hoverFont.tooltipPreview);
        },
    },
    methods: {
        getHoverTip(tip) {
            return typeof tip !== 'function' ? tip : tip(this.curFont);
        },

        selectLang(lang) {
            this.$emit('update:lang', lang);
        },

        selectFont(font) {
            if (font.disabled) {
                return;
            }
            this.$emit('change', font);
        },

        onHoverFontList(fontList) {
            this.hoverFontList = fontList;
        },

        onHoverFont(font, event) {
            this.curFont = font;
            if (font.tooltip || font.tooltipPreview || font.tip) {
                this.hoverFont = font;
                this.hoverElement = { el: event.target };
            } else {
                this.hoverFont = null;
                this.hoverElement = null;
            }

            // 背景超出，从右展示
            let { offsetWidth } = event.target;
            const { width, height } = font.preview;
            const ratio = 23 / height;
            offsetWidth = offsetWidth - (font.tipIcon ? 40 : 9);

            if (width * ratio > offsetWidth) {
                this.currentHoverClassId = font.id;
            } else {
                this.currentHoverClassId = null;
            }

            this.$emit('fontHover', font);
        },
        onLeaveFont(font) {
            if (this.hoverFont && this.hoverFont.id === font.id) {
                // this.hoverFont = null;
                this.hoverElement = null;
            }
            this.currentHoverClassId = null;
        },

        onLeavePanel() {
            this.hoverFontList = null;
            this.hoverFont = null;
        },

        onScrollEnd() {
            this.hideFontTip = false;
        },

        onScroll($event) {
            const { fontsList } = this;
            const { scrollTop } = $event.target;
            const labelHeight = 32;
            if (this.search) {
                return;
            }

            for (let i = 0; i < fontsList.length; i++) {
                const labelEl = (this.$refs[`fontLabel${i}`] || [])[0];
                if (!labelEl) break;
                const { offsetTop, offsetHeight } = labelEl.parentElement;
                const top = offsetTop - scrollTop;
                if (top <= 0 && top + offsetHeight - labelHeight >= 0) {
                    const transitionY = -top;
                    labelEl.style.transform = `translateY(${transitionY}px)`;
                } else if (top >= 0) {
                    labelEl.style.transform = '';
                } else if (top > 0) {
                    break;
                }
            }

            this.hideFontTip = true;
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(this.onScrollEnd, 250);
        },
    },
};
</script>
