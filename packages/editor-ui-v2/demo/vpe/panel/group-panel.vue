<template>
    <eui-v2-tabs value="group" float-tab>
        <eui-v2-tab name="group" :content="tabContent" />
        <div class="group-panel" slot="panel">
            <div class="eui-v2-panel-form">
                <eui-v2-button v-if="isSelector" @click="toFlex" block color="info">
                    成 flex
                </eui-v2-button>
            </div>
            <div class="eui-v2-panel-form">
                <EditorGroupControl :editor="editor" />
            </div>
            <div class="eui-v2-panel-form">
                <TextNormalPanel
                    v-if="isText"
                    :editor="editor" />
                <ImageNormalPanel
                    v-else-if="isImage || isNinePatch"
                    :editor="editor" />
                <SvgNormalPanel
                    v-else-if="isSvg"
                    :editor="editor" />
                <EditorElementBar
                    v-else
                    :editor="editor" />
            </div>            
        </div>
    </eui-v2-tabs>
</template>

<script>
import {
    EditorGroupControl, EditorElementBar
} from '@/src';
import TextNormalPanel from './text-normal-panel';
import ImageNormalPanel from './image-normal-panel';
import SvgNormalPanel from './svg-normal-panel';


export default {
    props: {
        editor: { type: Object, required: true },
        initEffects: { type: Object, require: true }
    },
    components: {
        TextNormalPanel,
        ImageNormalPanel,
        SvgNormalPanel,
        EditorGroupControl,
        EditorElementBar
    },
    computed: {
        elem() {
            return this.editor.currentElement;
        },
        isSelector() {
            return this.elem.type === '$selector';
        },
        isGroup() {
            return this.elem.type === 'group';
        },
        tabContent() {
            return this.isSelector ? '多选' : '组合';
        },
        isText() {
            if(this.isSelector) {
                return !this.elem.elements.some(element => !this.checkIsText(element));
            }
            else if(this.editor.currentSubElement) {
                return this.checkIsText(this.editor.currentSubElement);
            }
            return false;
        },
        isImage() {
            if(this.isSelector) {
                return !this.elem.elements.some(element => !this.checkIsImage(element));
            }
            else if(this.editor.currentSubElement) {
                return this.checkIsImage(this.editor.currentSubElement);
            }
            return false;
        },
        isNinePatch() {
            if(this.isSelector) {
                return !this.elem.elements.some(element => !this.checkIsNinePatch(element));
            }
            else if(this.editor.currentSubElement) {
                return this.checkIsNinePatch(this.editor.currentSubElement);
            }
            return false;
        },
        isSvg() {
            if(this.isSelector) {
                return !this.elem.elements.some(element => !this.checkIsSvg(element));
            }
            else if(this.editor.currentSubElement) {
                return this.checkIsSvg(this.editor.currentSubElement);
            }
            return false;
        }
    },
    methods: {
        toggleGroup() {
            if(this.isGroup) {
                this.editor.flatGroup();
            }
            else {
                this.editor.addGroupByElements();
            }
        },
        checkIsText(element) {
            return ['text', 'threeText', 'styledText'].includes(element.type);
        },
        checkIsImage(element) {
            return ['image', 'mask'].includes(element.type);
        },
        checkIsSvg(element) {
            return element.type === 'svg';
        },
        checkIsNinePatch(element) {
            return element.type === 'ninePatch';
        },
        toFlex() {
            this.editor.addFlexByElements();
        }
    }
};
</script>

<style lang="less" scoped>
.group-panel {
    padding: 24px;
}
</style>
