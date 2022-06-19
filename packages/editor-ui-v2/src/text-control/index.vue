<template>
    <div class="eui-v2-text-control" :class="{ 'eui-v2-text-vertical': isVerticalMode }">
        <ButtonsBar class="eui-v2-text-control-row" block fill="outline" justify="space-between">
            <Button
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('加粗')"
                tooltip-side="bottom"
                block
                :activated="elemStyle.fontWeight >= 700"
                :disabled="isStyledText || isThreeText || disabled"
                @click="toggleBold"
            >
                <Icon class="eui-v2-text-control-icon" name="text-tool-fill_bold" />
            </Button>

            <Button
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('斜体')"
                tooltip-side="bottom"
                block
                :activated="elemStyle.fontStyle === 'italic'"
                :disabled="isStyledText || isThreeText || disabled"
                @click="toggleItalic"
            >
                <Icon class="eui-v2-text-control-icon" name="text-tool-ic_italy" />
            </Button>

            <Button
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('下划线')"
                tooltip-side="bottom"
                block
                :activated="elemStyle.textDecoration === 'underline'"
                :disabled="isStyledText || isThreeText || disabled"
                @click="toggleUnderline"
            >
                <Icon class="eui-v2-text-control-icon" name="text-tool-fill_underline" />
            </Button>

            <Button
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('删除线')"
                tooltip-side="bottom"
                block
                :activated="elemStyle.textDecoration === 'line-through'"
                :disabled="isStyledText || isThreeText || disabled"
                @click="toggleLineThrough"
            >
                <Icon class="eui-v2-text-control-icon" name="text-tool-fill_deleteline" />
            </Button>
        </ButtonsBar>

        <ButtonsBar class="eui-v2-text-control-row" fill="outline" block justify="space-between">
            <Button
                v-for="(name, key) in alignsText"
                :key="key"
                icon-type="only"
                fill="clear"
                :tooltip="name"
                tooltip-side="bottom"
                block
                :activated="textAlign === key"
                @click="toggleAlignStyle(key)"
            >
                <Icon
                    class="eui-v2-text-control-icon eui-v2-text-align-icon"
                    :name="`text-tool-fill_${key}`"
                />
            </Button>
        </ButtonsBar>

        <ButtonsBar
            id="textButtonBar"
            class="eui-v2-text-control-row eui-v2-list-buttons-bar"
            fill="outline"
            block
            justify="space-between"
        >
            <Button
                icon-type="only"
                fill="clear"
                :tooltip="$tsl('文字竖版')"
                tooltip-side="bottom"
                block
                :activated="isVerticalMode"
                :disabled="isThreeText || disabled"
                @click="toggleWritingMode"
            >
                <Icon class="eui-v2-text-control-icon" name="text-tool-fill_textorientation" />
            </Button>

            <DropdownButton
                class="eui-v2-text-control__letter-spacing eui-v2-text-control__dropdown-btn"
                fill="clear"
                :asRefWidth="false"
                placement="bottom-end"
                popupClass="eui-v2-text-control__dropdown-btn-popup"
                :tooltip="$tsl('间距')"
                :disabled="disabled"
                :allowDirections="['top', 'bottom']"
                :activated="false"
                reference="#textButtonBar"
                @onShow="(val) => (editor.options.scopePointerEventsEnable = !val)"
                block
                justify="space-between"
            >
                <template slot="diy">
                    <Icon
                        class="eui-v2-text-control-icon letter-spacing-icon"
                        name="text-tool-ic_spacing"
                    />
                </template>

                <template #dropdown>
                    <div class="eui-v2-text-control-slider">
                        <RangePicker
                            :label="$tsl('字间距')"
                            :max="maxLetterSpacing"
                            :min="minLetterSpacing"
                            :value="letterSpacing"
                            :space="1"
                            @change="setField('letterSpacing', $event)"
                        />
                        <RangePicker
                            :label="$tsl('行间距')"
                            :min="0.5"
                            :max="2.5"
                            :space="0.1"
                            :value="lineHeight"
                            :input-formatter="lineHeightFormatter"
                            @change="setField('lineHeight', $event)"
                        />
                    </div>
                </template>
            </DropdownButton>

            <DropdownButton
                fill="clear"
                :tooltip="$tsl('文字变形')"
                :disabled="disabled || isSelector"
                :activated="isDeformation"
                :allowDirections="['top', 'bottom']"
                class="eui-v2-text-defor-btn eui-v2-text-control__dropdown-btn"
                block
            >
                <template slot="diy">
                    <Icon class="eui-v2-text-control-icon" name="text-tool-fill_shape" />
                </template>

                <template #dropdown="dropdown">
                    <ThreeDeformationPopup
                        v-if="isThreeText"
                        :element="elem"
                        :editor="editor"
                        @close="deformationClear(dropdown)"
                    />
                    <DeformationPopup
                        v-else
                        :element="elem"
                        :editor="editor"
                        @close="deformationClear(dropdown)"
                    />
                </template>
            </DropdownButton>

            <Button
                icon-type="only"
                fill="clear"
                tooltip-side="bottom"
                :tooltip="$tsl('列表格式')"
                :disabled="!isText || disabled"
                :activated="!!listStyle"
                block
                @click="switchListStyles"
            >
                <Icon
                    class="eui-v2-text-control-icon eui-v2-text-list-icon"
                    :name="getListStyleIcon()"
                />
            </Button>
        </ButtonsBar>

        <ButtonsBar
            v-if="autoAdaptiveEnable"
            class="eui-v2-text-control-row"
            fill="outline"
            block
        ></ButtonsBar>
        <ButtonsBar
            v-if="uxmsMode"
            class="eui-v2-text-control-row eui-v2-list-buttons-bar"
            fill="outline"
            block
            justify="space-between"
        >
            <DropdownButton
                class="eui-v2-text-control__dropdown-btn"
                block
                icon-type="only"
                fill="clear"
                tooltip-side="bottom"
                :tooltip="$tsl('文字边距')"
                :disabled="isDeformation || isThreeText || isSelector || disabled"
            >
                <template slot="diy">
                    <Icon class="eui-v2-text-control-icon" name="text-margin" />
                </template>
                <template #dropdown>
                    <div slot="content" class="eui-v2-padding-panel__popup">
                        <div class="eui-v2-padding-panel__popup__line-box" />
                        <div class="eui-v2-padding-panel__popup--col">
                            <div
                                class="eui-v2-padding-panel__popup--row eui-v2-padding-panel__popup--row--center"
                            >
                                <input
                                    type="number"
                                    v-dragger="onPaddingDrag(0)"
                                    :value="padding[0]"
                                    @change="setPadding(0, $event)"
                                />
                            </div>
                            <div
                                class="eui-v2-padding-panel__popup--row eui-v2-padding-panel__popup--row--between"
                            >
                                <input
                                    type="number"
                                    v-dragger="onPaddingDrag(3)"
                                    :value="padding[3]"
                                    @change="setPadding(3, $event)"
                                />
                                <div class="eui-v2-padding-panel__popup__label">
                                    {{ $tsl('文字间距') }}
                                </div>
                                <input
                                    type="number"
                                    v-dragger="onPaddingDrag(1)"
                                    :value="padding[1]"
                                    @change="setPadding(1, $event)"
                                />
                            </div>
                            <div
                                class="eui-v2-padding-panel__popup--row eui-v2-padding-panel__popup--row--center"
                            >
                                <input
                                    type="number"
                                    v-dragger="onPaddingDrag(2)"
                                    :value="padding[2]"
                                    @change="setPadding(2, $event)"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </DropdownButton>
            <DropdownButton
                class="input-layout eui-v2-text-control__dropdown-btn"
                fill="clear"
                :tooltip="$tsl('文字排版')"
                :disabled="!isText || disabled"
                :asRefWidth="false"
                block
            >
                <template slot="diy">
                    <Icon class="eui-v2-text-control-icon" name="duo-hange" />
                </template>

                <template #dropdown>
                    <div class="text-typesetting-select__popup">
                        <div class="text-typesetting-select">
                            <DropdownMenus class="e-ui-input-style-menus">
                                <DropdownMenu
                                    v-for="(item, key) in inputStyleData"
                                    :key="key"
                                    :activated="getInputStyleItem().text === item.text"
                                    @click="toggleInputStyle(key)"
                                >
                                    <Icon :name="item.icon" />
                                    {{ item.text }}
                                </DropdownMenu>
                            </DropdownMenus>
                            <div class="text-typesetting-select__preview">
                                <img :src="getInputStyleItem().previewUrl" />
                            </div>
                        </div>
                    </div>
                </template>
            </DropdownButton>
            <Button class="eui-v2-text-control-blockblock" fill="clear" />
            <Button class="eui-v2-text-control-blockblock" fill="clear" />
        </ButtonsBar>
    </div>
</template>

<script>
// import { dropRight } from 'lodash';

// TODO 弹框 CSS ::after 三角标及 outer click 处理
import DropdownButton from '../base/dropdown-button';
import DropdownMenus from '../base/dropdown-menus';
import DropdownMenu from '../base/dropdown-menu';
import RangePicker from '../components/range-picker';
import Button from '../base/button';
import ButtonsBar from '../base/buttons-bar';
import Icon from '../base/icon';

import DeformationPopup from './deformation/normal-popup';
import ThreeDeformationPopup from './deformation/three-popup';
import { dragger } from '../directives/dragger';
import { i18n } from '../i18n';

export default {
    components: {
        DropdownButton,
        DropdownMenus,
        DropdownMenu,
        RangePicker,
        Button,
        ButtonsBar,
        DeformationPopup,
        ThreeDeformationPopup,
        Icon,
    },
    directives: {
        dragger,
    },
    inject: {
        uxmsMode: {
            type: Boolean,
            default: false,
        },
    },
    props: {
        editor: { type: Object, required: true },
        disabled: { type: Boolean, default: false },
        autoAdaptiveEnable: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            showLineHeightSlider: false,
            showLetterSpacingSlider: false,
            showTextAlign: false,
            pushUp: false,
            inputStyleData: [
                {
                    value: 0b01,
                    icon: 'duo-hange',
                    text: i18n.$tsl('固定宽度'),
                    previewUrl:
                        'https://st0.dancf.com/csc/2514/configs/system/20210219-160924-d7df.gif',
                },
                {
                    value: 0b11,
                    icon: 'dan-hange',
                    text: i18n.$tsl('自适应'),
                    previewUrl:
                        'https://st0.dancf.com/csc/2514/configs/system/20210219-160821-7dee.gif',
                },
                {
                    value: 0b00,
                    icon: 'fixed-size',
                    text: i18n.$tsl('固定宽高'),
                    previewUrl:
                        'https://st0.dancf.com/csc/2514/configs/system/20210219-175738-8168.gif',
                },
                {
                    value: 0b00,
                    adjustsFontSize: true,
                    icon: 'fixed-size-auto',
                    text: i18n.$tsl('固定宽高 (自动字号)'),
                    previewUrl:
                        'https://st0.dancf.com/csc/2514/configs/system/20210219-160700-b7ef.gif',
                },
            ],
            inputStyleIndex: -1,
            listStyleData: {
                '': i18n.$tsl('无'),
                disc: i18n.$tsl('无序列表'),
                decimal: i18n.$tsl('数字序号'),
            },
        };
    },
    computed: {
        // 文字竖版
        isVerticalMode() {
            return this.currElem.writingMode && this.currElem.writingMode.includes('vertical');
        },
        isStyledText() {
            if (!this.currElem) return false;
            let elems = [this.currElem];
            if (this.currElem.type === '$selector') {
                elems = this.currElem.elements;
            }
            return elems.some((elem) => elem.type === 'styledText');
        },
        isThreeText() {
            if (!this.currElem) return false;
            let elems = [this.currElem];
            if (this.currElem.type === '$selector') {
                elems = this.currElem.elements;
            }
            return elems.some((elem) => elem.type === 'threeText');
        },
        isDeformation() {
            const type = this.elem?.deformation?.type;
            return type !== undefined && type !== 'none';
        },
        isText() {
            const { currElements } = this;
            return currElements.some((elem) => elem.type === 'text');
        },
        isSerialListStyle() {
            return this.listStyle === 'disc';
        },
        isDecimalListStyle() {
            return this.listStyle === 'decimal';
        },

        currElem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        elemStyle() {
            const { currentSelection } = this.editor;
            return currentSelection || this.currElem || {};
        },
        alignsText() {
            const result = {
                left: !this.isVerticalMode ? i18n.$tsl('左对齐') : i18n.$tsl('上对齐'),
                center: !this.isVerticalMode ? i18n.$tsl('居中对齐') : i18n.$tsl('垂直居中'),
                right: !this.isVerticalMode ? i18n.$tsl('右对齐') : i18n.$tsl('下对齐'),
                justify: i18n.$tsl('两端对齐'),
            };

            return result;
        },
        textAlign() {
            const { selectedElements } = this.editor;
            if (this.isSelector) {
                const selectedAlign = selectedElements.map((item) => item.textAlign);
                const diffArr = Array.from(new Set(selectedAlign));
                return diffArr.length === 1 ? diffArr[0] : null;
            } else {
                return this.currElem.textAlign;
            }
        },
        textAlignIcon() {
            const textAlign = this.textAlign;
            const icons = {
                left: 'text-align-left',
                center: 'text-align-center',
                right: 'text-align-right',
                justify: 'text-align-justify',
            };

            return icons[textAlign] || icons.left;
        },
        textAlignText() {
            const textAlign = this.textAlign;
            return this.alignsText[textAlign] || this.alignsText.left;
        },
        isSelector() {
            return this.currElem && this.currElem.type === '$selector';
        },
        letterSpacing() {
            if (this.isSelector) {
                return Math.max.apply(
                    Math,
                    this.currElem.elements.map((e) => e.letterSpacing),
                );
            } else {
                return this.currElem.letterSpacing;
            }
        },
        lineHeight() {
            if (this.isSelector) {
                return Math.max.apply(
                    Math,
                    this.currElem.elements.map((e) => e.lineHeight),
                );
            }
            return this.currElem.lineHeight;
        },
        minLetterSpacing() {
            if (this.isSelector) {
                const maxFontSize = Math.max.apply(
                    Math,
                    this.currElem.elements.map((e) => e.fontSize),
                );
                return Math.max(-maxFontSize, -50);
            }

            return Math.max(-this.currElem.fontSize, -50);
        },
        maxLetterSpacing() {
            if (this.isSelector) {
                const maxFontSize = Math.max.apply(
                    Math,
                    this.currElem.elements.map((e) => e.fontSize),
                );
                return Math.max(maxFontSize, 50);
            }

            return Math.max(this.currElem.fontSize, 50);
        },
        listStyle() {
            const { selectedElements } = this.editor;
            if (this.isSelector) {
                const listStyles = selectedElements.map((item) => item.listStyle);
                const diffArr = Array.from(new Set(listStyles));
                return diffArr.length === 1 ? diffArr[0] : null;
            } else {
                return this.currElem.listStyle;
            }
        },
        currElements() {
            const { currElem, isSelector } = this;
            if (isSelector && currElem) {
                return currElem.elements;
            } else if (currElem) {
                return [currElem];
            } else {
                return [];
            }
        },
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        padding() {
            const { currElem } = this;
            return currElem.padding;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        getListStyleIcon() {
            const iconMap = {
                disc: 'text-tool-fill_disc',
                decimal: 'text-tool-fill_number',
            };
            return iconMap[this.listStyle] || 'text-tool-fill_disc';
        },
        deformationClear(dropdown) {
            dropdown.close();
        },
        lineHeightFormatter(value) {
            return Number((value - 0).toFixed(2));
        },
        toggleInputStyle(key) {
            this.currElements.forEach((elem) => {
                const autoAdaptive = this.inputStyleData[key].value;
                const adjustsFontSize = this.inputStyleData[key].adjustsFontSize;
                const props = {
                    autoAdaptive,
                    adjustsFontSize: !!adjustsFontSize,
                    resize: autoAdaptive === 0 ? 7 : 5,
                };

                // 单行切换多行容易导致宽度不足文本换行
                if (elem.autoAdaptive > 1 && autoAdaptive <= 1) {
                    props.width = elem.width + 4;
                }
                this.editor.changeElement(props, elem);
            });
            this.$forceUpdate(); // 由于adjustsFontSize不是obervalbe属性
        },
        toggleAlignStyle(textAlign) {
            this.currElements.map((elem) => this.editor.changeElement({ textAlign }, elem));
        },
        setPadding(index, event) {
            let value = parseInt(event.target.value);
            if (isNaN(value)) {
                value = 0;
            }

            this.changePadding(index, value);
        },

        switchListStyles() {
            const listStyles = Object.keys(this.listStyleData);
            const currentListStyle = this.currElements[0].listStyle;

            let nextIndex = listStyles.indexOf(currentListStyle) + 1;
            if (nextIndex < 0 || nextIndex >= listStyles.length) nextIndex = 0;

            this.currElements.forEach((elem) =>
                this.editor.changeElement(
                    {
                        listStyle: listStyles[nextIndex],
                    },
                    elem,
                ),
            );
        },

        setField(field, value) {
            const { selectedElements, changeElement } = this.editor;
            if (this.isSelector) {
                changeElement({ [field]: value }, selectedElements);
            } else {
                changeElement({ [field]: value }, this.currElem);
            }
        },
        switchAlign(align) {
            const { selectedElements, changeElement } = this.editor;
            if (this.isSelector) {
                changeElement({ textAlign: align }, selectedElements);
            } else {
                changeElement({ textAlign: align }, this.currElem);
            }
        },
        updateListPosition() {
            const align = document.querySelector('.align-left');
            if (!align) {
                return;
            }
            const elementRect = align.getBoundingClientRect();
            const needResize = window.innerHeight - elementRect.bottom < 150;
            // 距离底部过小时定位至上方
            this.pushUp = needResize;
        },
        toggleSlider(sliderType) {
            if (this.disabled) {
                return;
            }

            if (sliderType === 'lineHeight') {
                this.showLineHeightSlider = !this.showLineHeightSlider;
                this.showLetterSpacingSlider = false;
                this.showTextAlign = false;
            } else if (sliderType === 'textAlign') {
                this.updateListPosition();
                this.showTextAlign = !this.showTextAlign;
                this.showLineHeightSlider = false;
                this.showLetterSpacingSlider = false;
            } else {
                this.showLineHeightSlider = false;
                this.showTextAlign = false;
                this.showLetterSpacingSlider = !this.showLetterSpacingSlider;
            }
        },
        hideSlider(sliderType) {
            switch (sliderType) {
                case 'lineHeight':
                    this.showLineHeightSlider = false;
                    break;
                case 'textAlign':
                    this.showTextAlign = false;
                    break;
                case 'letterSpacing':
                    this.showLetterSpacingSlider = false;
            }
        },
        toggleBold() {
            if (this.isSelector) {
                this.currElem.elements.map((elem) => this.editor.toggleBold(elem));
            } else {
                this.editor.toggleBold();
            }
        },
        toggleItalic() {
            if (this.isSelector) {
                this.currElem.elements.map((elem) => this.editor.toggleItalic(elem));
            } else {
                this.editor.toggleItalic();
            }
        },
        toggleUnderline() {
            if (this.isSelector) {
                this.currElem.elements.map((elem) => this.editor.toggleUnderline(elem));
            } else {
                this.editor.toggleUnderline();
            }
        },
        toggleLineThrough() {
            if (this.isSelector) {
                this.currElem.elements.map((elem) => this.editor.toggleThrough(elem));
            } else {
                this.editor.toggleThrough();
            }
        },
        toggleWritingMode() {
            const { selectedElements, changeElement } = this.editor;
            const { writingMode } = this.currElem;
            if (this.isSelector) {
                const horizontal = selectedElements.some(
                    ({ writingMode }) => writingMode === 'horizontal-tb',
                );
                const vertical = selectedElements.some(
                    ({ writingMode }) => writingMode === 'vertical-rl',
                );
                // 存在两种状态时，默认切换为横向
                if (horizontal && vertical) {
                    changeElement(
                        {
                            writingMode: 'horizontal-tb',
                        },
                        selectedElements,
                    );
                } else {
                    const mode = horizontal ? 'vertical-rl' : 'horizontal-tb';
                    changeElement(
                        {
                            writingMode: mode,
                        },
                        selectedElements,
                    );
                }
            } else {
                changeElement(
                    {
                        writingMode:
                            writingMode !== 'horizontal-tb' ? 'horizontal-tb' : 'vertical-rl',
                    },
                    this.currElem,
                );
            }
        },
        changePadding(index, value) {
            value = Math.max(0, value);
            const { currElem, editor } = this;
            const padding = [...currElem.padding];
            padding[index] = value;
            editor.changeElement({ padding }, currElem);
        },
        onPaddingDrag(paddingIndex) {
            return (event) => {
                const diffX = Math.floor(event.pageX - event.preX);
                const value = this.currElem.padding[paddingIndex] + diffX;
                this.changePadding(paddingIndex, value);
            };
        },
        getInputStyleItem() {
            const { currElem, inputStyleData } = this;
            let index = 0;
            inputStyleData.forEach((item, idx) => {
                if (
                    currElem.autoAdaptive === item.value &&
                    !!currElem.adjustsFontSize === !!item.adjustsFontSize
                ) {
                    index = idx;
                }
            });
            return inputStyleData[index];
        },
    },
};
</script>

<style lang="less" src="./index.less"></style>
