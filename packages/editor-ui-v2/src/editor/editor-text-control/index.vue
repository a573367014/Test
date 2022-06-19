<template>
    <div class="eui-v2-editor-text-control">
        <div class="eui-v2-panel-form">
            <div class="eui-v2-panel-form__item">
                <Panel>
                    <SubPanel>
                        <ButtonsBar class="eui-v2-buttons-bar--large" block>
                            <Button
                                block
                                icon-type="only"
                                :tooltip="$tsl('加粗')"
                                tooltip-side="top"
                                fill="clear"
                                :activated="elemStyle.fontWeight >= 700"
                                :disabled="isStyledText || isThreeText || disabled"
                                @click="toggleBold"
                            >
                                <Icon name="text-bold" />
                            </Button>
                            <Button
                                block
                                icon-type="only"
                                :tooltip="$tsl('斜体')"
                                tooltip-side="top"
                                fill="clear"
                                :activated="elemStyle.fontStyle === 'italic'"
                                :disabled="isStyledText || isThreeText || disabled"
                                @click="toggleItalic"
                            >
                                <Icon name="text-italic" />
                            </Button>
                            <Button
                                block
                                icon-type="only"
                                :tooltip="$tsl('下划线')"
                                tooltip-side="top"
                                fill="clear"
                                :activated="elemStyle.textDecoration === 'underline'"
                                :disabled="isGif || isStyledText || isThreeText || disabled"
                                @click="toggleUnderline"
                            >
                                <Icon name="text-underline" />
                            </Button>
                            <Button
                                block
                                icon-type="only"
                                :tooltip="$tsl('删除线')"
                                tooltip-side="top"
                                fill="clear"
                                :activated="elemStyle.textDecoration === 'line-through'"
                                :disabled="isGif || isStyledText || isThreeText || disabled"
                                @click="toggleLineThrough"
                            >
                                <Icon name="strike-through" />
                            </Button>
                        </ButtonsBar>
                    </SubPanel>
                    <SubPanel>
                        <Popup
                            placement="bottom-end"
                            :visible.sync="wordSpaceVisible"
                            force-placement
                            as-ref-width
                        >
                            <ButtonsBar class="eui-v2-buttons-bar--large" block>
                                <DropdownButton
                                    fill="clear"
                                    icon-type="only"
                                    :tooltip="textHorizontalAlignText"
                                    :disabled="disabled"
                                    :allowDirections="['top', 'bottom']"
                                    :asRefWidth="false"
                                    block
                                >
                                    <template slot="diy">
                                        <Icon :name="textHorizontalAlignIcon" />
                                    </template>

                                    <template #dropdown="dropdown">
                                        <DropdownMenus class="e-ui-align-style-menus" :width="142">
                                            <DropdownMenu
                                                v-for="(name, key) in alignsText"
                                                :key="key"
                                                :activated="textAlign === key"
                                                @click="toggleAlignStyle(key, dropdown)"
                                            >
                                                <Icon :name="'text-align-' + key" />
                                                {{ name }}
                                            </DropdownMenu>
                                        </DropdownMenus>
                                    </template>
                                </DropdownButton>

                                <Tooltip
                                    placement="bottom-center"
                                    :content="textVerticalAlignText"
                                    :disabled="verticalAlignDisabled"
                                >
                                    <Button
                                        block
                                        icon-type="only"
                                        fill="clear"
                                        :disabled="verticalAlignDisabled"
                                        @click="toggleTextVerticalAlign"
                                    >
                                        <Icon :name="textVerticalAlignIcon" />
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    placement="bottom-center"
                                    :content="$tsl('文字方向')"
                                    :disabled="isGif || isThreeText || disabled"
                                >
                                    <Button
                                        block
                                        icon-type="only"
                                        fill="clear"
                                        :disabled="isGif || isThreeText || disabled"
                                        @click="toggleWritingMode"
                                    >
                                        <Icon name="text-direction" />
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    placement="bottom-center"
                                    :content="$tsl('文字边距')"
                                    :disabled="isThreeText || isSelector || disabled"
                                >
                                    <Button
                                        block
                                        icon-type="only"
                                        fill="clear"
                                        :disabled="isThreeText || isSelector || disabled"
                                        @click="toggleWordSpaceVisible"
                                    >
                                        <Icon name="text-margin" />
                                    </Button>
                                </Tooltip>
                            </ButtonsBar>
                            <div slot="content" class="eui-v2-editor-text-control__popup">
                                <div class="eui-v2-editor-text-control__popup__line-box" />
                                <div class="eui-v2-editor-text-control__popup--col">
                                    <div
                                        class="
                                            eui-v2-editor-text-control__popup--row
                                            eui-v2-editor-text-control__popup--row--center
                                        "
                                    >
                                        <input
                                            type="number"
                                            v-dragger="onPaddingDrag(0)"
                                            :value="padding[0]"
                                            @change="setPadding(0, $event)"
                                        />
                                    </div>
                                    <div
                                        class="
                                            eui-v2-editor-text-control__popup--row
                                            eui-v2-editor-text-control__popup--row--between
                                        "
                                    >
                                        <input
                                            type="number"
                                            v-dragger="onPaddingDrag(3)"
                                            :value="padding[3]"
                                            @change="setPadding(3, $event)"
                                        />
                                        <div class="eui-v2-editor-text-control__popup__label">
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
                                        class="
                                            eui-v2-editor-text-control__popup--row
                                            eui-v2-editor-text-control__popup--row--center
                                        "
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
                        </Popup>
                    </SubPanel>
                    <SubPanel>
                        <ButtonsBar class="eui-v2-buttons-bar--large eui-v2-list-buttons-bar" block>
                            <Button
                                block
                                fill="clear"
                                :tooltip="$tsl('无序列表')"
                                :disabled="!isText || disabled"
                                :activated="listStyle === 'disc'"
                                @click="toggleListStyle('disc')"
                            >
                                <Icon name="fill_serial" />
                            </Button>

                            <DropdownButton
                                fill="clear"
                                :tooltip="$tsl('有序列表')"
                                :disabled="!isText || disabled"
                                :buttonActivated="listStyle !== '' && listStyle !== 'disc'"
                                :allowDirections="['top', 'bottom']"
                                :asRefWidth="false"
                                block
                            >
                                <template slot="diy">
                                    <Icon name="fill_number" />
                                </template>

                                <template #dropdown="dropdown">
                                    <DropdownMenus>
                                        <DropdownMenu
                                            v-for="(name, key) in listStyleData"
                                            :key="key"
                                            :activated="listStyle !== '' && listStyle === key"
                                            @click="toggleListStyle(key, dropdown)"
                                        >
                                            {{ name }}
                                        </DropdownMenu>
                                    </DropdownMenus>
                                </template>
                            </DropdownButton>

                            <DropdownButton
                                v-if="autoAdaptiveEnable"
                                class="input-layout"
                                fill="clear"
                                :tooltip="$tsl('文字排版')"
                                :disabled="!isText || disabled"
                                :allowDirections="['top', 'bottom']"
                                :asRefWidth="false"
                                block
                            >
                                <template slot="diy">
                                    <Icon name="duo-hange" />
                                </template>

                                <template #dropdown="dropdown">
                                    <DropdownMenus class="e-ui-input-style-menus" :width="192">
                                        <DropdownMenu
                                            v-for="(item, key) in inputStyleData"
                                            :key="key"
                                            :activated="currElem.autoScale === item.value"
                                            @click="toggleInputStyle(key, dropdown)"
                                        >
                                            <Icon :name="item.icon" />
                                            {{ item.text }}
                                        </DropdownMenu>
                                    </DropdownMenus>
                                </template>
                            </DropdownButton>
                        </ButtonsBar>
                    </SubPanel>
                    <SubPanel padding="vertical">
                        <RangePicker
                            :label="$tsl('字间距')"
                            :label-width="58"
                            :value="letterSpacing"
                            :min="minLetterSpacing"
                            :max="maxLetterSpacing"
                            :disabled="disabled"
                            @change="setField('letterSpacing', $event)"
                        />
                        <RangePicker
                            :label="$tsl('行间距')"
                            :value="lineHeight"
                            :label-width="58"
                            :min="0.5"
                            :max="2.5"
                            :disabled="disabled"
                            :input-formatter="lineHeightFormatter"
                            @change="setField('lineHeight', $event)"
                        />
                        <RangePicker
                            :label="$tsl('不透明度')"
                            :value="opacity"
                            :label-width="58"
                            :min="0"
                            :max="100"
                            :disabled="disabled"
                            @change="setOpacity($event)"
                        />
                    </SubPanel>
                </Panel>
            </div>
        </div>
    </div>
</template>

<script>
import Button from '../../base/button';
import DropdownButton from '../../base/dropdown-button';
import DropdownMenus from '../../base/dropdown-menus';
import DropdownMenu from '../../base/dropdown-menu';
import Icon from '../../base/icon';
import Popup from '../../base/popup';
import Tooltip from '../../base/tooltip';
import ButtonsBar from '../../base/buttons-bar';
import Panel from '../../base/panel';
import SubPanel from '../../base/sub-panel';
import RangePicker from '../../components/range-picker';
import { dragger } from '../../directives/dragger';
import { i18n } from '../../i18n';

const TEXT_VERTICAL_ALIGNS = ['top', 'middle', 'bottom'];
const TEXT_VERTICAL_ALIGN_TEXT = {
    top: i18n.$tsl('顶部对齐'),
    middle: i18n.$tsl('垂直居中对齐'),
    bottom: i18n.$tsl('底部对齐'),
};

export default {
    components: {
        DropdownButton,
        DropdownMenus,
        DropdownMenu,
        Button,
        Popup,
        ButtonsBar,
        Panel,
        SubPanel,
        RangePicker,
        Icon,
        Tooltip,
    },
    directives: {
        dragger,
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
        autoAdaptiveEnable: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            wordSpaceVisible: false,
            inputStyleData: [
                {
                    value: 0b01,
                    icon: 'duo-hange',
                    text: i18n.$tsl('多行'),
                },
                {
                    value: 0b11,
                    icon: 'dan-hange',
                    text: i18n.$tsl('仅单行'),
                },
                {
                    value: 0b00,
                    icon: 'fixed-size',
                    text: i18n.$tsl('固定宽高'),
                },
            ],
            listStyleData: {
                '': '无',
                decimal: '123...',
                'upper-alpha': 'ABC...',
                'lower-alpha': 'abc...',
                'cjk-ideographic': '一二三...',
                'decimal-leading-zero': '010203...',
            },
        };
    },
    computed: {
        aligns() {
            return this.isText
                ? ['left', 'center', 'right', 'justify']
                : ['left', 'center', 'right'];
        },
        alignsText() {
            const result = {
                left: i18n.$tsl('左对齐'),
                center: i18n.$tsl('居中对齐'),
                right: i18n.$tsl('右对齐'),
            };
            if (this.isText) {
                result.justify = i18n.$tsl('两端对齐');
            }

            return result;
        },
        isGif() {
            const { editor } = this;
            const layout = editor.currentLayout;
            let isGif = false;

            editor.walkTemplet(
                (element) => {
                    if (element.isGif) {
                        isGif = true;
                        return false;
                    }
                },
                true,
                [layout],
            );

            return isGif;
        },
        isStyledText() {
            const { currElements } = this;
            return currElements.some((elem) => elem.type === 'styledText');
        },
        isThreeText() {
            const { currElements } = this;
            return currElements.some((elem) => elem.type === 'threeText');
        },
        isText() {
            const { currElements } = this;
            return currElements.some((elem) => elem.type === 'text');
        },
        currElem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        elemStyle() {
            const { currentSelection, currentElement } = this.editor;
            return currentSelection || currentElement || {};
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
        textAlign() {
            const { currElements } = this;
            if (currElements.length === 0) {
                return this.aligns[0];
            }

            return currElements[0].textAlign || this.aligns[0];
        },
        verticalAlign() {
            const { currElements } = this;
            if (currElements.length === 0) {
                return TEXT_VERTICAL_ALIGNS[0];
            }

            return currElements[0].verticalAlign || TEXT_VERTICAL_ALIGNS[0];
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
            const fontSize = Math.max.apply(
                Math,
                this.currElements.map((e) => e.fontSize),
            );
            return Math.max(-fontSize, -50);
        },
        maxLetterSpacing() {
            const fontSize = Math.max.apply(
                Math,
                this.currElements.map((e) => e.fontSize),
            );
            return Math.max(fontSize, 50);
        },
        textHorizontalAlignIcon() {
            const { textAlign } = this;
            return `text-align-${textAlign}`;
        },
        textHorizontalAlignText() {
            const { textAlign } = this;
            return this.alignsText[textAlign];
        },
        textVerticalAlignIcon() {
            const { verticalAlign } = this;
            return `text-align-${verticalAlign}`;
        },
        textVerticalAlignText() {
            const { verticalAlign } = this;
            return TEXT_VERTICAL_ALIGN_TEXT[verticalAlign];
        },
        opacity() {
            const { currElements } = this;
            return Math.max.apply(
                Math,
                currElements.map((element) => element.opacity * 100),
            );
        },
        padding() {
            const { currElem } = this;
            return currElem.padding;
        },
        verticalAlignDisabled() {
            const { isThreeText, currElements, disabled } = this;
            return (
                disabled ||
                isThreeText ||
                currElements.some((elem) => {
                    return (
                        ((elem.resize & 0b010) === 0 && elem.writingMode === 'horizontal-tb') ||
                        ((elem.resize & 0b100) === 0 && elem.writingMode === 'vertical-rl')
                    );
                })
            );
        },
        listStyle() {
            if (this.isSelector) {
                return '';
            } else {
                return this.currElem.listStyle;
            }
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        toggleInputStyle(key, dropdown) {
            this.currElements.forEach((elem) => {
                const autoAdaptive = this.inputStyleData[key].value;
                const props = {
                    autoAdaptive: autoAdaptive,
                    resize: autoAdaptive === 0 ? 7 : 5,
                };

                // 单行切换多行容易导致宽度不足文本换行
                if (elem.autoAdaptive > 1 && autoAdaptive <= 1) {
                    props.width = elem.width + 4;
                }
                this.editor.changeElement(props, elem);
            });

            dropdown && dropdown.close();
        },
        toggleListStyle(listStyle, dropdown) {
            if (listStyle === 'disc') {
                listStyle = this.currElem.listStyle !== 'disc' ? 'disc' : '';
            }

            this.currElements.map((elem) => this.editor.changeElement({ listStyle }, elem));
            dropdown && dropdown.close();
        },
        toggleBold() {
            this.currElements.map((elem) => this.editor.toggleBold(elem));
        },
        toggleItalic() {
            this.currElements.map((elem) => this.editor.toggleItalic(elem));
        },
        toggleUnderline() {
            this.currElements.map((elem) => this.editor.toggleUnderline(elem));
        },
        toggleLineThrough() {
            this.currElements.map((elem) => this.editor.toggleThrough(elem));
        },
        toggleAlignStyle(textAlign, dropdown) {
            this.currElements.map((elem) => this.editor.changeElement({ textAlign }, elem));
            dropdown && dropdown.close();
        },
        toggleTextHorizontalAlign() {
            this.wordSpaceVisible = false;
            const { textAlign, currElements } = this;
            const nextIndex = (this.aligns.indexOf(textAlign) + 1) % this.aligns.length;
            const nextAlign = this.aligns[nextIndex];
            this.editor.changeElement({ textAlign: nextAlign }, currElements);
        },
        toggleTextVerticalAlign() {
            this.wordSpaceVisible = false;
            const { verticalAlign, currElements } = this;
            const nextIndex =
                (TEXT_VERTICAL_ALIGNS.indexOf(verticalAlign) + 1) % TEXT_VERTICAL_ALIGNS.length;
            const nextAlign = TEXT_VERTICAL_ALIGNS[nextIndex];
            this.editor.changeElement({ verticalAlign: nextAlign }, currElements);
        },
        toggleWritingMode() {
            this.wordSpaceVisible = false;
            const { currElements, editor } = this;
            const horizontal = currElements.some(
                ({ writingMode }) => writingMode === 'horizontal-tb',
            );
            const vertical = currElements.some(({ writingMode }) => writingMode === 'vertical-rl');
            if (horizontal && vertical) {
                editor.changeElement(
                    {
                        writingMode: 'horizontal-tb',
                    },
                    currElements,
                );
            } else {
                editor.changeElement(
                    {
                        writingMode: horizontal ? 'vertical-rl' : 'horizontal-tb',
                    },
                    currElements,
                );
            }
        },
        setField(field, value) {
            const { editor, currElements } = this;
            editor.changeElement({ [field]: value }, currElements);
        },
        lineHeightFormatter(value) {
            return Number((value - 0).toFixed(2));
        },
        setOpacity(value) {
            this.setField('opacity', Math.round(value) / 100);
        },
        toggleWordSpaceVisible() {
            this.wordSpaceVisible = !this.wordSpaceVisible;
        },
        setPadding(index, event) {
            let value = parseInt(event.target.value);
            if (isNaN(value)) {
                value = 0;
            }

            this.changePadding(index, value);
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
    },
};
</script>
<style lang="less" src="./index.less"></style>
