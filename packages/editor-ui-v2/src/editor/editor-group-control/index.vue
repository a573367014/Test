<template>
    <div class="eui-v2-editor-group-control eui-v2-panel-form">
        <div class="eui-v2-panel-form__item">
            <eui-v2-button
                class="eui-v2-editor-group-control-btn"
                color="info"
                block
                tooltip-side="bottom"
                :disabledTooltip="
                    isGroup && !elem.splitenable ? $tsl('付费素材不支持拆分使用') : ''
                "
                :disabled="disabled || groupButtonDisabled"
            >
                <span class="eui-v2-editor-group-control-btn-text" @click="toggleGroup">
                    {{ toggleGroupButtonText }}
                </span>

                <!-- more -->
                <template v-if="showLinkList">
                    <span class="eui-buttons-bar__divide"></span>
                    <eui-v2-popup :visible.sync="popupVisible" placement="bottom-center">
                        <span
                            class="eui-v2-editor-group-control-btn-icon"
                            @click.stop="onClickPopup"
                        >
                            <eui-v2-icon name="arrow-down" />
                        </span>
                        <div
                            slot="content"
                            class="eui-v2-editor-group-control-btn-more eui-v2-dropdown-menus"
                            @click.stop="onOpenBatchSDK"
                        >
                            <eui-v2-icon name="link-list-lock"></eui-v2-icon>
                            {{ $tsl('创建关联列表') }}
                        </div>
                    </eui-v2-popup>
                </template>
            </eui-v2-button>
        </div>

        <div v-if="showLinkButton" class="eui-v2-panel-form__item">
            <eui-v2-button
                color="info"
                block
                :disabled="disabled || groupButtonDisabled"
                @click="toggleLinkElements"
            >
                {{ linkElementText }}
            </eui-v2-button>
        </div>

        <div v-if="isSelector" class="eui-v2-panel-form__item">
            <eui-v2-buttons-bar class="mini-buttons" block>
                <eui-v2-buttons-bar block>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('左对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentLeft')"
                    >
                        <Icon name="align-left" />
                    </eui-v2-button>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('水平居中对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentCenter')"
                    >
                        <Icon name="align-center" />
                    </eui-v2-button>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('右对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentRight')"
                    >
                        <Icon name="align-right" />
                    </eui-v2-button>
                </eui-v2-buttons-bar>

                <div class="mini-buttons-divider"></div>

                <eui-v2-buttons-bar block>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('上对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentTop')"
                    >
                        <Icon name="align-top" />
                    </eui-v2-button>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('垂直居中对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentMiddle')"
                    >
                        <Icon name="align-middle" />
                    </eui-v2-button>
                    <eui-v2-button
                        icon-type="only"
                        fill="clear"
                        :tooltip="$tsl('下对齐')"
                        tooltip-side="bottom"
                        :disabled="disabled"
                        class="alignment-btn"
                        @click="align('alignmentBottom')"
                    >
                        <Icon name="align-bottom" />
                    </eui-v2-button>
                </eui-v2-buttons-bar>
            </eui-v2-buttons-bar>

            <eui-v2-buttons-bar class="flip-buttons" block>
                <eui-v2-button
                    class="eui-v2-editor-group-control-flip-btn"
                    icon-type="left"
                    block
                    fill="clear"
                    :disabled="!allowDistribution"
                    @click="align('distributionCenter')"
                >
                    <Icon name="arrange-horizontal" />
                    {{ $tsl('水平分布') }}
                </eui-v2-button>

                <eui-v2-button
                    class="eui-v2-editor-group-control-flip-btn"
                    icon-type="left"
                    block
                    fill="clear"
                    :disabled="!allowDistribution"
                    @click="align('distributionMiddle')"
                >
                    <Icon name="arrange-vertical" />
                    {{ $tsl('垂直分布') }}
                </eui-v2-button>
            </eui-v2-buttons-bar>
        </div>

        <!-- linkList 引导 -->
        <!-- <div class="eui-v2-editor-group-control-guide" v-if="guideVisible && showLinkList">
            <span>{{ $tsl('点击试试新功能') }}</span>
            <eui-v2-icon
                name="close-presentation"
                @click.native="guideVisible = false"
            ></eui-v2-icon>
            <div class="eui-v2-editor-group-control-guide-arrow"></div>
        </div> -->
    </div>
</template>

<script>
import { isGroup } from '@gaoding/editor-utils/element';
import Icon from '../../base/icon';
import { i18n } from '../../i18n';
import { get } from 'lodash';

export default {
    components: {
        Icon,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        showLink: {
            type: Boolean,
            default: false,
        },
        showLinkList: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            popupVisible: false,
            guideVisible: false,
        };
    },
    computed: {
        elem() {
            return this.editor.currentElement || {};
        },
        isGroup() {
            return isGroup(this.elem);
        },
        isSelector() {
            return this.elem.type === '$selector';
        },
        toggleGroupButtonText() {
            return this.isGroup ? i18n.$tsl('拆分组') : i18n.$tsl('成组');
        },
        allowDistribution() {
            return this.editor.selectedElements.length >= 3 && !this.disabled;
        },
        groupButtonDisabled() {
            return (
                this.editor.global.$tempGroup ||
                (this.isGroup && !this.elem.splitenable) ||
                this.editor.selectedElements.some((el) => el.type === 'watermark')
            );
        },
        canUnlinkElements() {
            if (this.isGroup) {
                const { currentSubElement } = this.editor;
                return this.editor.getLinkedElements(currentSubElement).length > 1;
            } else {
                const elements = this.editor.selectedElements;
                const linkId = get(elements, '0.linkId');
                return linkId && !elements.some((element) => element.linkId !== linkId);
            }
        },
        canLinkElements() {
            if (!this.isSelector) {
                return false;
            }

            return this.editor.getLinkElementsType(this.editor.selectedElements);
        },
        showLinkButton() {
            return this.isSelector && (this.canUnlinkElements || this.canLinkElements);
        },
        linkElementText() {
            const { canUnlinkElements } = this;
            return canUnlinkElements ? i18n.$tsl('解除关联') : i18n.$tsl('关联内容');
        },
        opacity() {
            if (this.isSelector) {
                const maxOpacity = Math.max.apply(
                    Math,
                    this.elem.elements.map((e) => e.opacity),
                );
                return maxOpacity * 100;
            }
            return this.elem.opacity * 100;
        },
    },
    mounted() {
        const { isSelector, isGroup } = this;

        if (isSelector || isGroup) {
            const usedLinkList = localStorage.getItem('usedLinkList');
            if (!usedLinkList) {
                this.guideVisible = true;
                localStorage.setItem('usedLinkList', true);
            }
        }
    },
    methods: {
        $tsl: i18n.$tsl,
        onClickPopup() {
            this.popupVisible = !this.popupVisible;
            this.guideVisible = false;
        },
        toggleGroup() {
            const elements = this.isGroup
                ? this.elem.elements || []
                : this.editor.getSelectedElements();

            if (this.isGroup) {
                this.editor.flatGroup(this.elem, false);
            } else {
                this.editor.addGroupByElements(
                    elements.filter((item) => !!item?.type),
                    {},
                    false,
                );
            }
        },
        onOpenBatchSDK() {
            this.popupVisible = false;
            const elements = this.elem.elements;

            this.editor.$events.$emit('openBatchSDK', elements);
        },
        align(dir) {
            this.editor.alignmentElements(dir);
        },
        toggleLinkElements() {
            const { canUnlinkElements } = this;

            if (canUnlinkElements) {
                const elements = this.isGroup
                    ? [this.editor.currentSubElement]
                    : this.editor.selectedElements;
                this.$emit('unlink-elements', elements);
                this.editor.unlinkElements(elements);
            } else {
                const elements = this.editor.selectedElements;
                this.$emit('link-elements', elements);
                this.editor.linkElements(elements);
            }
        },
        setOpacity(value) {
            const { selectedElements, changeElement } = this.editor;
            if (this.isSelector) {
                changeElement({ opacity: value }, selectedElements);
            } else {
                changeElement({ opacity: value }, this.elem);
            }
        },
    },
};
</script>

<style lang="less" src="./index.less"></style>
