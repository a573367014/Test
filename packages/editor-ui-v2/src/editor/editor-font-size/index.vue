<template>
    <DropdownFontSize
        :value="fontSize"
        :fontSizeMixed="fontSizeMixed"
        :fontSizeList="fontSizeList"
        :isEditing="isEditing"
        :min="min"
        :max="max"
        :format="format"
        :disabled="disabled"
        :dpi="dpi"
        :editor="editor"
        @change="handleChange"
        @onShow="val => editor.options.scopePointerEventsEnable=!val"
    />
</template>
<script>
import DropdownFontSize from '../../components/dropdown-font-size';

export default {
    components: {
        DropdownFontSize
    },
    props: {
        editor: { type: Object, required: true },
        step: { type: Number, default: 1 },
        max: { type: Number, default: Infinity },
        min: { type: Number, default: 1 },
        format: { type: Function, default: val => Math.round(val * 10) / 10 },
        disabled: { type: Boolean, default: false },
        pure: { type: Boolean, default: false },
        value: { type: Number, default: 0 },
        multSize: { type: Boolean, default: false },
    },
    data() {
        return {
            // pt 单位的字号在这里设置
            ptFontSizeList: [
                6,
                8,
                9,
                10,
                11,
                12,
                14,
                16,
                18,
                20,
                24,
                26,
                30,
                32,
                34,
                36,
                38,
                40,
                50,
                60,
                70,
                80,
                90,
                100,
                110,
                130,
                160,
                190,
                250
            ]
        };
    },
    computed: {
        elem() {
            const currentElem = this.editor.currentElement;
            const currentSubElement = this.editor.currentSubElement;
            if(this.editor.currentSelection) {
                return this.editor.currentSelection;
            }

            if(
                currentElem &&
                (/text/i.test(currentElem.type))
            ) {
                return currentElem;
            }
            else if(
                currentSubElement &&
                (/text/i.test(currentSubElement.type))
            ) {
                return currentSubElement;
            }

            return currentSubElement || currentElem || {};
        },
        elements() {
            const currentElement = this.editor.currentElement;
            if(currentElement.type === '$selector') {
                return currentElement.elements;
            }
            else {
                return [this.elem];
            }
        },
        fontSize() {
            const fontSize = this.value || this.elements[0].fontSize;
            const dpi = this.dpi;

            return dpi <= 0 ? fontSize : Math.round(fontSize * 72 / dpi);
        },
        fontSizeMixed() {
            if (this.pure) return this.multSize;
            return this.elem.fontSizeMixed;
        },
        fontSizeList() {
            const dpi = this.dpi;
            return dpi > 0 ? this.ptFontSizeList : this.editor.options.fontSizeList;
        },
        isEditing() {
            return this.editor.currentElement.$editing;
        },
        dpi() {
            const { dpi, unit } = this.editor.global;
            return unit === 'px' || !unit ? 0 : dpi;
        }
    },
    methods: {
        handleChange(size) {
            const dpi = this.dpi;
            const props = {
                fontSize: dpi <= 0 ? size : Math.round(size * dpi / 72)
            };

            if (this.pure) {
                return this.$emit('change', props.fontSize);
            }

            const {
                currentElement,
                currentSubElement,
                selectedElements,
                changeElement
            } = this.editor;

            if(currentElement && /text/i.test(currentElement.type)) {
                changeElement(props);
            }
            else if(currentElement && currentElement.type === '$selector') {
                changeElement(props, selectedElements);
            }
            else if(currentSubElement && /text/i.test(currentSubElement.type)) {
                changeElement(props, currentSubElement);
            }
            this.$emit('change', props.fontSize);
        },
    }
};
</script>

