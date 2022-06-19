<!-- 用于示例的编辑器全功能 UI 界面组件，由于其演示性质而不使用 eui 前缀 -->
<template>
    <div class="editor-panel" v-if="editor">
        <!-- Panel 顶部通用元素操作栏 -->
        <!-- <ElementBar v-if="elemType !== null" :editor="editor" /> -->
        <TestPanel 
            v-if="mode === 'test'"
            :editor="editor"
            @normalMode="toNormalMode"
            />
        <CanvasPanel
            v-else-if="elemName === '全局'"
            :editor="editor"
            @testMode="toTestMode"
        />
        <TextPanel
            v-else-if="elemName === '文字' || elemName === '3d文字'"
            :editor="editor"
            :initEffects="initEffects"
        />
        <StyledTextPanel
            v-else-if="elemType === '风格化文字'"
            :editor="editor"
        />
        <SvgPanel
            v-else-if="elemName === '图形'"
            :editor="editor"
        />
        <ImagePanel
            v-else-if="elemName === '图片'"
            :editor="editor"
            :initEffects="initEffects"
        />
        <GroupPanel
            v-else-if="elemName === '组合'"
            :editor="editor"
            :initEffects="initEffects"
        />
        <CollagePanel
            v-else-if="elemName === '拼图'"
            :editor="editor"
        />
        <ImagePanel
            v-else-if="elemName === '点九图'"
            :editor="editor"
        />
        <WatermarkPanel
            v-else-if="elemName === '水印'"
            :editor="editor" />
        <FlexPanel
            v-else-if="elemName === 'flex'"
            :editor="editor" />
    </div>
</template>

<script>
import TextPanel from './text-panel';
import StyledTextPanel from './styled-text-panel';
import ImagePanel from './image-panel';
import GroupPanel from './group-panel';
import CanvasPanel from './canvas-panel';
import BackgroundPanel from './background-panel';
import CollagePanel from './collage-panel';
import ThreeTextPanel from './three-text-panel';
import SvgPanel from './svg-panel';
import WatermarkPanel from './watermark-panel';
import FlexPanel from './flex-panel';
import TestPanel from './test-panel';

const supportTypesMap = {
    svg: '图形',
    text: '文字',
    effectText: '文字',
    mask: '图片',
    image: '图片',
    $croper: '图片',
    $masker: '图片',
    group: '组合',
    $selector: '组合',
    collage: '拼图',
    threeText: '3d文字',
    styledText: '风格化文字',
    ninePatch: '点九图',
    '$background-croper': '全局',
    watermark: '水印',
    flex: 'flex'
};

export default {
    props: {
        editor: { type: Object, required: true },
        initEffects: { type: Object, require: true }
    },
    components: {
        SvgPanel,
        TextPanel,
        ThreeTextPanel,
        StyledTextPanel,
        BackgroundPanel,
        ImagePanel,
        GroupPanel,
        CollagePanel,
        CanvasPanel,
        WatermarkPanel,
        FlexPanel,
        TestPanel
    },
    data() {
        return {
             mode: 'normal',
            elements: []
        };
    },
    computed: {
        isBackgroundSelected() {
            return this.editor.currentLayout && this.editor.currentLayout.$backgroundSelected;
        },
        elemType() {
            const { currentElement } = this.editor;
            return currentElement && currentElement.type;
        },
        elemName() {
            return supportTypesMap[this.elemType] || '全局';
        }
    },
    created() {
        const host = 'http://172.16.21.90:4003';
        const effect = 'maobi';
        const updateStyledText = (data, doneCb) => {
            fetch(`${host}/styled-text-debug`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    ...data,
                    effect
                }),
            })
            .then(res => res.json())
            .then((res) => {
                if(!res.url) {
                    const err = new Error('风格化渲染失败');
                    console.error(err);
                    doneCb(err);
                }

                doneCb(null, {
                    ...res,
                    url: `${host}/examples/styled-text/${res.url.slice(1)}?x=${Date.now()}`,
                });
            });
        };
        this.editor.$events.$on('element.styledTextUpdate', updateStyledText);
        this.$on('destroy', () => {
            this.$nextTick(() => {
                this.editor.$events.$off('element.styledTextUpdate');
            });
        });
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
    methods: {
        toTestMode() {
            this.mode = 'test';
        }, 
        toNormalMode() {
            this.mode = 'normal';
        }
    }
};
</script>

<style lang='less'>
.editor-panel-split {
    width: 100%;
    height: 1px;
    background: #EFF3F9;
}
.editor-panel {
    position: relative;
    height: 100%;
    user-select: none;
    .eui-v2-element-bar {
        position: relative;
        z-index: 1;
    }
    .editor-panel-content {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        // 这个是为了修复Pop被部分隐藏，人为加大了容器宽度
        margin-left: -200px;
        padding: 78px 30px 18px 30px;
        padding-left: 30px + 200px;
        overflow-y: auto;
        // animation: moveCome 0.5s linear;
        & > .not-top-bar {
            margin-top: -48px;
            // animation: moveLeave 0.5s linear;
        }
        &.layer-disabled {
            pointer-events: none;
            cursor: no-drop;
            opacity: 0.3;
        }
    }
}
</style>
