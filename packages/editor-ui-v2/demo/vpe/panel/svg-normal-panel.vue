
<template>
    <div class="svg-normal-panel">
        <div class="eui-v2-panel-form">
            <div class="eui-v2-panel-form__item">
                <eui-v2-panel>
                    <eui-v2-sub-panel>
                        <eui-v2-editor-color-panel
                            label="颜色"
                            :colors="colors"
                            :disabled="isSelector"
                            @change="onColorsChange"/>
                    </eui-v2-sub-panel>
                </eui-v2-panel>
            </div>
            <div class="eui-v2-panel-form__item eui-v2-panel-form__item--row">
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button block @click="flip('x')">水平翻转</eui-v2-button>
                </div>
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button block @click="flip('y')">垂直翻转</eui-v2-button>
                </div>
            </div>
            <div class="eui-v2-panel-form__item">
                <eui-v2-panel>
                    <eui-v2-sub-panel>
                        <eui-v2-range-picker
                            label="不透明度"
                            :label-width="58"
                            :min="0"
                            :max="100"
                            :value="opacity"
                            @change="setOpacity" />
                    </eui-v2-sub-panel>
                </eui-v2-panel>
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorElementBar :editor="editor"/>
            </div>
        </div>
    </div>
</template>

<script>
import { EditorElementBar } from '@/src';

export default {
    components: {
        EditorElementBar
    },
    props: {
        editor: {
            type: Object,
            required: true
        },
        isPrint: {
            type: Boolean,
        }
    },
    computed: {
        elem() {
            const { editor } = this;
            return editor.currentSubElement || editor.currentElement || {};
        },
        elements() {
            return this.isSelector ? this.elem.elements : [this.elem];
        },
        isSelector() {
            return this.elem.type === '$selector';
        },
        colors() {
            const elem = this.elem;
            if(this.isSelector) {
                return [];
            }
            else {
                return elem.colors || [];
            }
        },
        opacity() {
            return Math.max.apply(Math, this.elements.map(element => element.opacity)) * 100;
        }
    },
    methods: {
        onColorsChange({ index, data }) {
            this.$set(this.colors, index, data);
            this.editor.makeSnapshot({
                tag: 'change_element',
                elements: this.elements
            });
        },
        flip(dir) {
            this.elements.forEach(element => {
                this.editor.flipElement(dir, element);
            });
        },
        setOpacity(value) {
            this.elements.forEach(element => {
                this.editor.changeElement({ opacity: value / 100 }, element);
            });
        }
    }
};
</script>
