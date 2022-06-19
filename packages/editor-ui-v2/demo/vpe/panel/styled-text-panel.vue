<template>
    <div class="text-panel">
        <PopFontFamily :editor="editor" :platform-id="32"/>
        <PopFontSize :editor="editor" @change="changeFontSizeOfStyledText"/>
        <PopFontEffect :editor="editor" />
        <DropdownEffects
            :effects="effects"
            :current-effect="currentEffect"/>
        <div class="eui-v2-dropdown-effect-tip"
             v-if="tip">
            {{ tip }}
        </div>

        <div class="editor-panel-split"/>
        <TextControl :editor="editor" />
    </div>
</template>

<script>
import { PopFontFamily, PopFontSize, TextControl, PopFontEffect, RangeSlider, Transform } from '../../../src';
import DropdownEffects from '../../../src/components/dropdown-effects';

export default {
    props: {
        editor: { type: Object, required: true },
    },
    computed: {
        elem() {
            if(!this.editor) {
                return null;
            }

            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        opacity() {
            return this.elem.opacity * 100;
        },
    },
    data() {
        const arr = new Array(20).fill(1);
        const plainEffects = arr.map((v, index) => ({
            id: index,
            preview: {
                url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
            }
        }));
        const effects = arr.map((v, index) => ({
            id: 21 + index,
            preview: {
                url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
            }
        }));
        return {
            effects: {
                '平面特效': plainEffects,
                '3d特效': effects
            },
            currentEffect: effects[0],
            tip: '当前字体不支持此特效',
        };
    },
    components: {
        PopFontFamily,
        PopFontSize,
        TextControl,
        PopFontEffect,
        RangeSlider,
        DropdownEffects,
    },
    methods: {
        changeFontSizeOfStyledText(fontSize) {
            this.editor.changeElement({
                fontSize,
            });
        },
        toNormalText() {
            this.editor.styledTextToNormal();
        },
    },
};
</script>

<style lang="less">
.text-panel {
    padding: 24px;
}
</style>
