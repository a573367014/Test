<style lang="less">
.visual-layout-fade-enter-active, .visual-layout-fade-leave-active {
    transition: opacity .15s ease-out, transform 0.15s;
}

.visual-layout-fade-enter, .visual-layout-fade-leave-to {
    opacity: 0;
    transform: scale(0.15);
}
.eui-v2-editor-visual {
    position: absolute;
    bottom: 52px;
    right: 0;
    overflow: hidden;
    width: 234px;
    height: 144px;
    padding: 12px;
    background:rgba(0,0,0,0.8);
    border-radius:8px;
    z-index: 3;
    display: flex;
    justify-content: center;
    align-items: center;
    transform-origin: 50% 100%;
    &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        right: 0;
        z-index: 3;
        cursor: move;
    }
}
.eui-v2-editor-visual__wrap {
    position: relative;
}
.eui-v2-editor-visual__container {
    position: absolute;
    box-sizing: border-box;
    z-index: 2;
    box-shadow: 0 0 0 2px @primary-color, 0 0 0 150px rgba(0, 0, 0, 0.6);
}

.eui-v2-editor-visual__shell {
    overflow: hidden;
    position: relative;
}
</style>
<template>
    <div class="eui-v2-editor-visual" @mousedown="onMousedown">
        <div class="eui-v2-editor-visual__wrap">
            <div
                class="eui-v2-editor-visual__container"
                ref="mask"
                :style="{
                    width: containerRect.width + 'px',
                    height: containerRect.height + 'px',
                    left: containerRect.left + 'px',
                    top: containerRect.top + 'px'
                }" />

            <div class="eui-v2-editor-visual__shell">
                <editor-layout
                    ref="layoutEditor"
                    :editor="editor"
                    :options="editorOptions"
                    :layout="editor.currentLayout"
                    :global="{zoom: globalZoom, showWatermark: editor.global.showWatermark}"
                />
            </div>
        </div>
    </div>
</template>
<script>
import Vue from 'vue';
import { throttle } from 'lodash';
export default {
    props: {
        editor: {
            type: Object,
            required: true
        },
        maxHeight: {
            type: Number,
            default: 120
        },
        maxWidth: {
            type: Number,
            default: 210
        }
    },
    data() {
        return {};
    },
    computed: {
        editorOptions() {
            return {
                ...this.editor.options,
                mode: 'preview'
            };
        },
        globalZoom() {
            if(this.editor && this.editor.currentLayout) {
                let { width, height } = this.editor.currentLayout;

                const ratio = width / height;
                let realHeight = height;
                let realWidth = width;
                if(ratio > 1.75) {
                    realWidth = this.maxWidth;
                    realHeight = realWidth / ratio;
                }
                else {
                    realHeight = this.maxHeight;
                    realWidth = realHeight * ratio;
                }

                return realHeight / height;
            }

            return 1;
        },
        shellRect() {
            const previewShellWidth = this.editor.currentLayout ? this.editor.currentLayout.width * this.globalZoom : 0;
            const { width, height, left, top } = this.editor.shellRect;
            const ratio = previewShellWidth / width;

            return {
                ratio,
                width: width * ratio,
                height: height * ratio,
                left: left * ratio,
                top: top * ratio,
            };
        },
        containerRect() {
            const zoom = this.editor.zoom;
            let { width, height, padding } = this.editor.containerRect;
            let { width: shellWidth, height: shellHeight } = this.editor.shellRect;
            let { ratio, left, top } = this.shellRect;
            width = Math.min(width - padding[3], shellWidth);
            height = Math.min(height - padding[0], shellHeight);
            left = Math.min(left, 0);
            top = Math.min(top, 0);
            return {
                width: width * ratio,
                height: height * ratio,
                left: -left,
                top: -top
            };
        }
    },
    mounted() {
        // 编辑器内部开了防抖，这里需要实时
        const editorDom = this.editor.$el;
        editorDom.addEventListener('scroll', this.editor.updateContainerRect);

        const onWheel = (zoom) => {
            const ua = window.navigator.userAgent.toLowerCase();
            const reduce = ua.includes('windows') && !ua.includes('firefox') ? 500 : 200;
            const isMac = ua.includes('Mac');

            return (e) => {
                e.preventDefault();
                e.stopPropagation();

                const editor = this.editor;
                const deltaY = (e.deltaY || (e.detail > 0 ? 40 : -40));
                const zoomScale = deltaY / reduce;
                const zoom = editor.zoom * (1 - (zoomScale / 2 * 0.4));

                editor.zoomTo(
                    Math.min(
                        editor.options.mousewheelMaxZoom,
                        Math.max(editor.options.mousewheelMinZoom, zoom)
                    )
                );

                this.$emit('wheel');
                this.$nextTick(() => {
                    editor.updateContainerRect();
                });
            };
        };

        // 滚轮缩放快捷键绑定
        this.$el.addEventListener('mousewheel', onWheel(), { passive: false });
    },
    beforeDestroy() {
        const editorDom = this.editor.$el;
        editorDom.removeEventListener('scroll', this.editor.updateContainerRect);
    },
    methods: {
        onMousedown(event) {
            const { scrollLeft, scrollTop } = this.editor.containerRect;
            const editorDom = this.editor.$el;
            const shellDom = editorDom.querySelector('.editor-shell-wrap');

            const currentX = event.clientX;
            const currentY = event.clientY;

            const drag = {
                move: (evt) => {
                    evt.preventDefault();
                    const tx = (evt.clientX - currentX) / this.globalZoom * this.editor.zoom;
                    const ty = (evt.clientY - currentY) / this.globalZoom * this.editor.zoom;

                    // 会触发 scroll 事件
                    editorDom.scrollLeft = scrollLeft + tx;
                    editorDom.scrollTop = scrollTop + ty;
                },
                cancel() {
                    document.removeEventListener('mousemove', drag.move);
                    document.removeEventListener('mouseup', drag.cancel);
                }
            };

            document.addEventListener('mousemove', drag.move);
            document.addEventListener('mouseup', drag.cancel);
        }
    }
};
</script>
