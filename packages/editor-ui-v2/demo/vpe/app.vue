<template>
    <div class="page">
        <!-- 顶部 NavBar -->
        <nav></nav>
        <eui-v2-base-container>
            <eui-v2-main-container>
                <editor ref="editor" :editor-options="editorOptions"></editor>
                <EditorToolBar
                    :editor="editor"
                    v-if="loaded"
                    visualVisible
                    :visualActive.sync="visualActive"
                />
                <transition name="fade">
                    <!-- <EditorVisualLayout
                        ref="visual"
                        v-if="loaded && visualActive"
                        :editor="editor"
                        :editor-options="editorOptions"
                        @wheel="onVisualWheel" /> -->
                </transition>
            </eui-v2-main-container>
            <eui-v2-panel-container>
                <EditorPanel v-if="loaded" :editor="editor" :initEffects="initEffectsData" />
            </eui-v2-panel-container>
        </eui-v2-base-container>

        <!-- <editor-layout
            v-if="loaded"
            ref="layoutEditor"
            style="position: relative"
            :editor="editor"
            :options="{...editor.options, mode: 'preview'}"
            :layout="editor.layouts[0]"
            :global="{zoom: 0.05, showWatermark: editor.global.showWatermark}"
        />
        <editor-layout
            v-if="loaded"
            ref="layoutEditor"
            style="position: relative"
            :editor="editor"
            :options="{...editor.options, mode: 'preview'}"
            :layout="editor.layouts[1]"
            :global="{zoom: 0.05, showWatermark: editor.global.showWatermark}"
        /> -->
    </div>
</template>

<script>
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import Vue from 'vue';
import EUI from '@/src/eui';
import { Framework } from '@gaoding/editor-framework';
import elements from '@gaoding/editor-elements/lazy';
import models from '@gaoding/editor-elements/model';
import '@gaoding/editor-framework/src/styles/index.less';
import EditorPanel from './panel/editor-panel';
import fontList from './font-list';
import { cloneDeep } from 'lodash';
import { EditorToolBar } from '@/src';
import EditorVisualLayout from '@/src/editor/editor-visual-layout';
// import { transformTextGroup } from './group-transform';
import VideoController from '@gaoding/editor-framework/src/static/video-controller';
import VueCompositionAPI from '@vue/composition-api';
import bemMixin from '../../src/utils/bem';
import '@gaoding/editor-framework/src/utils/resize-templet';

const framework = new Framework();
framework.asyncElementsMap = elements;
framework.models = models;
Vue.use(EUI);
Vue.mixin(bemMixin);
Vue.component('editor-layout', framework.createLayout(Vue));
Vue.use(VueCompositionAPI);
const touchEnable = window.hasOwnProperty('ontouchstart');

export default {
    components: {
        EditorPanel,
        Editor: framework.createEditor(Vue),
        EditorToolBar,
        EditorVisualLayout,
        VideoController,
    },
    data() {
        return {
            loaded: false,
            visualActive: false,
            editorOptions: {
                mode: 'flow',
                // operateMode: 'mosaic',
                fontList,
                padding: 100,
                bleedingLine: {
                    show: false,
                    width: 3, // 出血线宽度，单位为 mm
                },
                watermarkSafeEnable: true,
                tipsOptions: {
                    // resize大小提示框显示
                    resizeable: true,
                    // 拖动元素位置提示框显示
                    dragable: true,
                    // 临时组常驻提示
                    tempGroup: true,
                },
                fontSubset: {
                    getUrl: (font, content) => {
                        return fetch(
                            `https://fonter.dancf.com/subset?font_id=${font.id}&content=${content}`,
                        )
                            .then((res) => res.blob())
                            .then((blob) => {
                                // return 'http://localhost:8080/';
                                return URL.createObjectURL(blob);
                            });
                    },
                    exportEnableCallback: () => true,
                    initialEnable: true,
                    supportTypes: ['text', 'effectText', 'threeText', 'table'],
                    defaultContent: '',
                },
                touchEnable: touchEnable,
                mousewheelMaxZoom: touchEnable ? 2 : 4,
            },
            initEffectsData: {},
        };
    },
    computed: {
        editor() {
            return this.$refs.editor;
        },
    },
    mounted() {
        window.editor = this.editor;
        window.__CHARGE__ = { editor: this.editor };
        const params = new URLSearchParams(window.location.search);
        const tpl = params.get('tpl') || 'poster';
        fetch(`/${tpl}.json`)
            .then((resp) => resp.json())
            .then((tpl) => {
                this.loaded = true;
                // transformTextGroup(tpl.layouts);
                this.editor.setTemplet(tpl);

                this.editor.$once('layoutLoaded', () => {
                    this.saveInitEffects();
                });

                this.editor.$on('change', () => {
                    // 在此添加 change 事件回调
                    const curElem = this.editor.currentElement;
                    if (curElem && !this.initEffectsData[curElem.$id]) {
                        this.initEffectsData[curElem.$id] = cloneDeep(curElem);
                    }
                });
            });
    },
    methods: {
        // 保存模板加载后各个元素对应初始的数据
        saveInitEffects() {
            const layouts = this.editor.layouts;
            layouts.forEach((layout) => {
                layout.elements.forEach((elem) => {
                    this.initEffectsData[elem.$id] = cloneDeep(elem);
                });
            });
        },
        onVisualWheel() {
            this._visualWheeling = true;

            clearTimeout(this._visualWheelTimer);
            this._visualWheelTimer = setTimeout(() => {
                this._visualWheeling = false;
            }, 50);
        },
    },
};
</script>

<style lang="less">
img,
canvas {
    pointer-events: none;
}

html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
}

.page {
    width: 100%;
    height: 100%;
}

nav {
    box-sizing: border-box;
    height: 60px;
    width: 100%;
    display: flex;
    align-content: center;
    padding-left: 20px;
    border-bottom: 1px solid #f0f2f5;
    .nav-title {
        display: flex;
        align-items: center;
        font-weight: 700;
    }
}
.eui-v2-main-container {
    overflow: hidden !important;
}
.container {
    display: flex;
    width: 100%;
    height: calc(~'100% - 60px');
}

.editor-wrapper {
    position: relative;
    flex-grow: 2;
    height: 100%;
    background: #eff2f7;
    .editor-container {
        bottom: 78px;
    }
}

.panel {
    width: 270px;
    height: 100%;
    top: 0;
    bottom: 0;
    overflow: visible;
}
</style>
