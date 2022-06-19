<style lang="less">

</style>

<template>
    <div class="text-normal-panel">
        <div class="eui-v2-panel-form">
            <eui-v2-panel>
                <eui-v2-sub-panel>
                    <EditorEffects
                        :effects="effects"
                        :editor="editor"
                        :get-material="getMaterial"
                        clear />
                </eui-v2-sub-panel>
                <eui-v2-sub-panel>
                    <EditorColors
                        :editor="editor"
                        :get-material="getMaterial" />
                </eui-v2-sub-panel>
            </eui-v2-panel>
        </div>
        <div class="eui-v2-panel-form">
            <div class="eui-v2-panel-form__label">
                文字
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorFontFamily :editor="editor" />
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorFontSize :editor="editor"/>
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorTextControl :editor="editor" autoScaleEnable />
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorElementBar :editor="editor"/>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import { EditorElementBar, EditorTextControl, EditorFontSize, EditorColors, EditorEffects, EditorFontFamily } from '@/src';
import textEffects from '../text-effect-preview';
import getMaterial from '../effect-content';

const eventBus = new Vue();
const emitChange = () => eventBus.$emit('change');

export default {
    components: {
        EditorElementBar,
        EditorTextControl,
        EditorFontSize,
        EditorColors,
        EditorEffects,
        EditorFontFamily
    },
    provide: {
        emitChange,
    },
    props: {
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            effects: {
                '特效': textEffects
            },
            getMaterial: getMaterial,
        };
    },
    computed: {
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        elements() {
            if(this.editor.currentElement.type === '$selector') {
                return this.editor.currentElement.elements;
            }
            return [this.elem];
        },
        tag: {
            get() {
                const category = this.elements[0].category;
                return this.elements.some(elem => elem.category !== category) ? '多种标签' : (category || '无标签');
            },
            set(value) {
                this.elements.forEach(elem => {
                    this.editor.changeElement({ 'category': value }, elem);
                });
            }
        }
    },
    methods: {
        selectCategory(category, dropdown) {
            dropdown.close();
            this.tag = category;
        }
    }
};
</script>
