<template>
    <div class="eui-v2-editor-element-bar">
        <ButtonsBar block>
            <Button
                class="eui-v2-editor-element-btn"
                block
                icon-type="only"
                fill="clear"
                :tooltip="lock ? $tsl('解锁图层') : $tsl('锁定图层')"
                tooltip-side="top"
                @click="toggleLock"
                :color="lock ? 'error' : 'normal'"
            >
                <Icon :name="lock ? 'edit-bar-lock' : 'edit-bar-unlock'" />
            </Button>

            <!-- 因为点击事件后会跟popup里的关闭事件冲突导致visible被二次修改 -->
            <Button
                v-if="!layerPopupVisible"
                class="eui-v2-editor-element-btn"
                block
                icon-type="only"
                fill="clear"
                :tooltip="layerPopupVisible ? '' : $tsl('图层顺序')"
                tooltip-side="top"
                :disabled="lock || isTempGroup || isCrop"
                @click.stop="toggleLayerPopup"
            >
                <Icon name="edit-bar-layer" />
            </Button>
            <Button
                v-else
                class="eui-v2-editor-element-btn actived"
                block
                icon-type="only"
                fill="clear"
                :tooltip="layerPopupVisible ? '' : $tsl('图层顺序')"
                tooltip-side="top"
                :disabled="lock || isTempGroup || isCrop"
            >
                <Icon name="edit-bar-layer" />
            </Button>

            <Popup
                placement="bottom-center"
                :allow-directions="['top', 'bottom']"
                :visible.sync="layerPopupVisible"
            >
                <span class="eui-v2-editor-element-bar__layer-nail"></span>
                <template slot="content">
                    <div class="eui-v2-editor-element-bar__layer">
                        <div v-if="!isSelector" class="eui-v2-editor-element-bar__layer__label">
                            {{ $tsl('画布对齐') }}
                        </div>
                        <div v-if="!isSelector" class="eui-v2-editor-element-bar__layer__align">
                            <eui-v2-buttons-bar class="mini-buttons" block>
                                <eui-v2-buttons-bar
                                    class="mini-buttons-left"
                                    justify="flex-start"
                                    block
                                >
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('左对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentLeft')"
                                    >
                                        <Icon name="align-left" />
                                    </eui-v2-button>
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('水平居中对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentCenter')"
                                    >
                                        <Icon name="align-center" />
                                    </eui-v2-button>
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('右对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentRight')"
                                    >
                                        <Icon name="align-right" />
                                    </eui-v2-button>
                                </eui-v2-buttons-bar>

                                <div class="mini-buttons-divider"></div>

                                <eui-v2-buttons-bar
                                    class="mini-buttons-right"
                                    justify="flex-end"
                                    block
                                >
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('上对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentTop')"
                                    >
                                        <Icon name="align-top" />
                                    </eui-v2-button>
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('垂直居中对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentMiddle')"
                                    >
                                        <Icon name="align-middle" />
                                    </eui-v2-button>
                                    <eui-v2-button
                                        icon-type="only"
                                        fill="clear"
                                        :tooltip="$tsl('下对齐')"
                                        tooltip-side="bottom"
                                        @click="align('alignmentBottom')"
                                    >
                                        <Icon name="align-bottom" />
                                    </eui-v2-button>
                                </eui-v2-buttons-bar>
                            </eui-v2-buttons-bar>
                        </div>

                        <div class="eui-v2-editor-element-bar__layer__label">
                            {{ $tsl('图层顺序') }}
                        </div>
                        <div class="eui-v2-editor-element-bar__layer__ctrl">
                            <div class="eui-v2-editor-element-bar__layer__btn" @click="moveDown">
                                <Icon name="layer-down" />
                            </div>

                            <div class="eui-v2-editor-element-bar__layer__slider">
                                <div class="eui-v2-editor-element-bar__layer__slider__wrap">
                                    <div class="eui-v2-editor-element-bar__layer__slider__mask">
                                        <span
                                            class="eui-v2-editor-element-bar__layer__slider__step"
                                            v-for="n in segments + 1"
                                            :key="n"
                                            :style="{
                                                left: (barWidth * (n - 1)) / segments + 'px',
                                                display:
                                                    currLayer === n - 1 ? 'none' : 'inline-block',
                                                height: '5px',
                                            }"
                                        />
                                    </div>
                                    <div
                                        class="eui-v2-editor-element-bar__layer__slider__button"
                                        :style="{
                                            left: btnOffset + 'px',
                                        }"
                                        @mousedown="beginScale"
                                        @touchstart="beginScale"
                                    ></div>
                                </div>
                            </div>

                            <div class="eui-v2-editor-element-bar__layer__btn" @click="moveUp">
                                <Icon name="layer-up" />
                            </div>
                        </div>
                    </div>
                </template>
            </Popup>

            <Popup
                v-if="!hideFlip"
                placement="bottom-center"
                :allow-directions="['top', 'bottom']"
                :visible.sync="flipPopupVisible"
            >
                <Button
                    class="eui-v2-editor-element-btn"
                    :class="{ actived: flipPopupVisible }"
                    block
                    icon-type="only"
                    fill="clear"
                    :tooltip="$tsl('翻转')"
                    tooltip-side="top"
                    @click="toFlip"
                    :disabled="lock"
                >
                    <Icon name="edit-bar-flip" />
                </Button>

                <template slot="content">
                    <eui-v2-dropdown-menus class="eui-v2-editor-filp-dropdown-menus">
                        <eui-v2-dropdown-menu class="eui-v2-editor-filp-btn" @click="flip('x')">
                            <Icon name="flip-horizontal" slot="start" />
                            {{ $tsl('水平翻转') }}
                        </eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu class="eui-v2-editor-filp-btn" @click="flip('y')">
                            <Icon name="flip-vertical" slot="start" />
                            {{ $tsl('垂直翻转') }}
                        </eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </Popup>

            <Button
                class="eui-v2-editor-element-btn"
                block
                icon-type="only"
                fill="clear"
                :tooltip="$t('duplicate')"
                tooltip-side="top"
                @click="clone"
                :disabled="disabledCopy"
            >
                <Icon name="edit-bar-copy" />
            </Button>

            <Button
                class="eui-v2-editor-element-btn"
                block
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('删除')"
                tooltip-side="top"
                :disabled="lock"
                @click="remove"
            >
                <Icon name="edit-bar-delete" />
            </Button>
        </ButtonsBar>
    </div>
</template>

<script>
import ButtonsBar from '../../base/buttons-bar';
import Button from '../../base/button';
import Popup from '../../base/popup';
import Icon from '../../base/icon';
import { i18n } from '../../i18n';

import { getItemsMeta, batchAdjust } from './adjust';
import { compatibleEvent } from '@gaoding/editor-framework/src/utils/dom-event';

const BAR_WIDTH = 156;
function noop() {}

export default {
    components: {
        Popup,
        ButtonsBar,
        Button,
        Icon,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        onLock: { type: Function, default: noop },
        onClone: { type: Function, default: noop },
        onRemove: { type: Function, default: noop },
        onPopup: { type: Function, default: noop },
    },
    data() {
        return {
            segments: 0,
            currLayer: null,
            layerPopupVisible: false,
            flipPopupVisible: false,
            barWidth: BAR_WIDTH,
        };
    },
    computed: {
        element() {
            return this.editor.currentElement || this.editor.currentSubElement;
        },
        subElement() {
            return this.editor.currentSubElement;
        },
        offset() {
            if (this.segments === 0) {
                return 0;
            }

            return (this.currLayer / this.segments) * BAR_WIDTH;
        },
        btnOffset() {
            return this.offset - 6;
        },
        selectedElementsLength() {
            return this.editor.selectedElements && this.editor.selectedElements.length;
        },
        lock() {
            return this.selectedElementsLength > 0
                ? this.editor.selectedElements.some((selectedElem) => selectedElem.lock)
                : this.element.lock;
        },
        isTempGroup() {
            return this.editor.global.$tempGroup;
        },
        isCrop() {
            return (
                this.element.type === '$croper' ||
                this.element.type === '$masker' ||
                this.element.type === '$watermarker'
            );
        },
        isSelector() {
            const { element } = this;
            return element && element.type === '$selector';
        },
        multiSelected() {
            return this.selectedElementsLength > 1;
        },
        hideFlip() {
            const element = this.subElement || this.element;
            const blackList = [
                'table',
                'group',
                'chart',
                'watermark',
                '$selector',
                '$watermarker',
                '$croper',
                '$masker',
            ];
            return blackList.includes(element.type);
        },
        disabledCopy() {
            return this.lock || (this.element && this.element.type === '$watermarker');
        },
    },
    watch: {
        currLayer(newIndex, oldIndex) {
            // 忽略初始加载 Slider 时的 mutation
            if (oldIndex === null) {
                return;
            }

            if (this.multiSelected) {
                const { currentLayout, selectedElements } = this.editor;
                const adjustedElements = batchAdjust(
                    currentLayout.elements,
                    selectedElements,
                    newIndex - oldIndex,
                );
                currentLayout.elements = adjustedElements;

                this.editor.makeSnapshot({
                    tag: 'reorder_element',
                    parent: currentLayout,
                    elements: adjustedElements,
                    index: 0,
                });
            } else {
                const { currentElement, currentLayout, getOverlapElements } = this.editor;
                const overlapElements = getOverlapElements();
                const elementBelow = overlapElements[newIndex];

                const newLayerIndex = currentLayout.elements.indexOf(elementBelow);
                const oldLayerIndex = currentLayout.elements.indexOf(currentElement);
                this.editor.goElementIndex(currentElement, newLayerIndex - oldLayerIndex);
            }
        },
        layerPopupVisible(value) {
            this.editor.options.scopePointerEventsEnable = !value;
        },
        flipPopupVisible(value) {
            this.editor.options.scopePointerEventsEnable = !value;
        },
    },
    methods: {
        $t: i18n.t,
        $tsl: i18n.$tsl,
        align(dir) {
            const { height, width } = this.editor.currentLayout;
            const { element } = this;
            const actions = {
                alignmentTop: () => {
                    element.top = 0;
                },
                alignmentMiddle: () => {
                    element.top = height / 2 - element.height / 2;
                },
                alignmentBottom: () => {
                    element.top = height - element.height;
                },
                alignmentLeft: () => {
                    element.left = 0;
                },
                alignmentCenter: () => {
                    element.left = width / 2 - element.width / 2;
                },
                alignmentRight: () => {
                    element.left = width - element.width;
                },
            };
            actions[dir].call();
            this.editor.makeSnapshotByElement(element);
        },

        resetCrop() {
            const { editor } = this;

            if (this.isCrop) {
                editor.$events.$emit('element.editApply', this.element);
            }
        },

        toggleLock: function () {
            const editor = this.editor;
            this.resetCrop();
            this.onLock();
            if (this.selectedElementsLength > 0) {
                editor.selectedElements.forEach((elem) => {
                    if (!elem.lock) {
                        editor.$emit('element.applyEdit');
                    }
                    editor.changeElement(
                        {
                            lock: !elem.lock,
                        },
                        elem,
                    );
                });
                editor.currentElement.lock = !editor.currentElement.lock;
            } else {
                if (this.lock) {
                    this.unlockElement();
                } else {
                    this.lockElement();
                }
            }
        },

        lockElement() {
            const { editor, element } = this;
            editor.changeElement(
                {
                    lock: true,
                },
                element,
            );

            if (element.type === 'text') {
                element.$editing = false;
            }
        },

        unlockElement() {
            const { editor, element } = this;
            editor.changeElement(
                {
                    lock: false,
                },
                element,
            );
        },

        clone() {
            this.resetCrop();
            this.editor.cloneElement();
            this.onClone();
        },

        toFlip() {
            this.flipPopupVisible = !this.flipPopupVisible;
        },

        getElemAfterCrop() {
            const { editor, element } = this;
            if (this.isCrop) {
                editor.$events.$emit('element.editApply', element);
            }
            return element || {};
        },

        flip(dir) {
            this.resetCrop();

            const element = this.subElement || this.element;
            const { selectedElements, flipElement } = this.editor;

            if (this.isSelector) {
                selectedElements.forEach((elem) => {
                    flipElement(dir, elem);
                });
            } else {
                flipElement(dir, element);
            }
        },

        remove() {
            if (this.element.type === '$watermarker') {
                this.editor.$events.$emit('element.editCancel', this.editor.currentElement);
            }
            this.resetCrop();
            this.onRemove();
            this.editor.removeElement(null, null, true);
        },

        toggleLayerPopup() {
            this.layerPopupVisible = !this.layerPopupVisible;
            if (this.layerPopupVisible) {
                this.updateSlider();
                this.onPopup();
            }
        },

        updateSlider() {
            const { currentLayout, selectedElements } = this.editor;

            // 区分多选与单选更新
            if (this.multiSelected) {
                const { elements } = currentLayout;
                const { length, index } = getItemsMeta(elements, elements, selectedElements);
                // n 个节点之间存在 n - 1 个 segment
                this.segments = length - 1;
                this.currLayer = index;
            } else {
                const { currentElement, getOverlapElements } = this.editor;
                const overlapElements = getOverlapElements();
                this.segments = Math.max(overlapElements.length - 1, 0);
                this.currLayer = overlapElements.indexOf(currentElement);
            }
        },

        moveUp() {
            this.currLayer = Math.min(this.currLayer + 1, this.segments);
        },

        moveDown() {
            this.currLayer = Math.max(this.currLayer - 1, 0);
        },

        beginScale(e) {
            const { pageX: baseX } = compatibleEvent(e);
            const baseLayer = this.currLayer;

            const moveHandler = (e) => {
                e.preventDefault();
                if (this.segments === 0) {
                    return;
                }
                const { pageX } = compatibleEvent(e);

                const offset = pageX - baseX;

                const diff = Math.round((offset * this.segments) / BAR_WIDTH);

                const newLayer = Math.max(0, Math.min(this.segments, diff + baseLayer));

                this.currLayer = newLayer;
            };

            const cancelHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('mouseup', cancelHandler);
                document.removeEventListener('touchend', cancelHandler);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('touchmove', moveHandler);
            document.addEventListener('mouseup', cancelHandler);
            document.addEventListener('touchend', cancelHandler);
        },
    },
};
</script>

<style lang="less">
.eui-v2-editor-element-bar {
    position: relative;
    display: flex;
    padding: 4px 10px;
    background: #f6f7f9;
    border-radius: 4px;
    border: none;

    .eui-v2-buttons-bar {
        justify-content: space-between !important;
    }

    .eui-v2-editor-element-btn {
        display: block;
        padding: 0;
        outline: 0;
        height: 32px;
        width: 32px;
        border: none;
        cursor: pointer;
        .eui-v2-button__container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            border-radius: 4px;
        }

        .eui-v2-icon {
            height: 20px;
            width: 20px;
        }

        &:hover,
        &.actived {
            .eui-v2-button__container {
                background: rgba(0, 0, 0, 0.08);
            }
        }
    }

    &__layer {
        width: 252px;
        padding: 16px;
        background: #ffffff;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        transform: translateY(8px);

        &-nail {
            position: absolute;
            top: 0;
            left: 50%;
            height: 32px;
            width: 32px;
            transform: translateX(-50%);
        }

        &__label {
            width: 100%;
            margin-bottom: 12px;
            line-height: 20px;
            font-size: 12px;
            font-weight: 500;
            color: #9da3ac;
            text-align: left;
            cursor: default;
        }

        &__ctrl {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 8px;
        }

        &__btn {
            height: 20px;
            width: 20px;
            cursor: pointer;

            .eui-v2-icon {
                height: 20px;
                width: 20px;
            }

            &:hover {
                opacity: 0.8;
            }
        }

        &__slider {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-grow: 1;

            &__wrap {
                position: relative;
            }

            &__mask {
                display: inline-block;
                position: relative;
                background: fade(#6b6b6d, 20%);
                border-radius: 15px;
                width: 156px;
                height: 2px;
                vertical-align: middle;
            }

            &__step {
                display: inline-block;
                position: absolute;
                left: 7px;
                width: 1px;
                height: 5px;
                margin-top: -1px;
                background: #7f8792;
                transform: translateY(-100%);
            }

            &__button {
                position: absolute;
                top: 0;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #ffffff;
                box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
                transform: translateY(4px);
                cursor: pointer;
            }
        }
    }
}

.eui-v2-editor-element-bar__layer__align {
    .mini-buttons {
        margin-bottom: 12px;

        .mini-buttons-divider {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 12px;
            width: 1px;
            height: 100%;
            background: #dadfe5;
        }
        .eui-v2-button__container {
            font-size: 20px;
        }

        .eui-v2-button {
            padding: 0;
        }

        .mini-buttons-left {
            .eui-v2-button {
                margin-left: 0 !important;
                margin-right: 12px !important;
                &:last-child {
                    margin-right: 0 !important;
                }
            }
        }

        .mini-buttons-right {
            .eui-v2-button {
                margin-left: 12px !important;
                margin-right: 0 !important;
                &:first-child {
                    margin-left: 0 !important;
                }
            }
        }
    }
}

.eui-v2-editor-filp-dropdown-menus {
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    border: none;
    transform: translateY(8px);
    .eui-v2-dropdown-menu__start {
        margin-right: 14px;
        height: 20px;

        .eui-v2-icon {
            height: 20px;
            width: 20px;
        }
    }
    .eui-v2-editor-filp-btn {
        padding-left: 14px;
        padding-right: 30px;
        height: 32px;
    }
    .eui-v2-dropdown-menu__content {
        line-height: 1;
    }
}
</style>
