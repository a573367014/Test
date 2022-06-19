<style lang="less">
    .canvas-panel {
        padding: 24px;
    }
</style>

<template>
    <eui-v2-tabs value="static" float-tab>
        <eui-v2-tab name="static" content="全局"/>
        <div slot="panel" class="canvas-panel">
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__item">
                    <eui-v2-dropdown-button block>
                        <div slot="prefix">分辨率</div>
                        {{ editor.global.dpi }} dpi
                        <eui-v2-dropdown-menus slot="dropdown">
                            <eui-v2-dropdown-menu
                                v-for="_dpi in dpis"
                                :key="_dpi"
                                @click="editor.global.dpi = _dpi">
                                {{ _dpi }} dpi
                            </eui-v2-dropdown-menu>
                        </eui-v2-dropdown-menus>
                    </eui-v2-dropdown-button>
                </div>
                <div class="eui-v2-panel-form__item">
                    <eui-v2-checkbox v-model="repeat" border block side="right">
                        设为重复段
                    </eui-v2-checkbox>
                </div>
            </div>
            <EditorBackground
                :editor="editor"
                :pick-image="uploadImage"
                :cmyk-mode="false"
            />
            <br>
            <br>
            <button @click="exportImage()">出图</button>
            <button @click="exportImage(true, true)">svg 出图</button>
            <button @click="exportImage(true, false)">svg 出图无水印</button>
            <button @click="exportGif()">导出 GIF</button>
            <button @click="testMode()">测试模式</button>
        </div>
    </eui-v2-tabs>
</template>

<script>
import { uniq } from 'lodash';
import { EditorBackground } from '@/src';
import TestPanel from './test-panel';

const DPIS = [30, 45, 72, 150, 300];
export default {
    components: { EditorBackground },
    props: {
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            dpis: uniq(DPIS.concat((this.editor.global.dpi || 72))),
            repeat: false
        };
    },
    mounted() {
        window.app = this;
    },
    methods: {
        exportGif() {
            const editor = this.editor;
            console.time();
            editor.renderGifLayouts(editor.currentLayout, {}, 10000, undefined).then(canvas => {
                return editor.exportGif(canvas);
            }).then(blob => {
                console.timeEnd();
                return URL.createObjectURL(blob);
            }).then((url) => {
                window.open(url);
            });
        },
        exportImage(useSvg, watermark = false) {
            this.editor.exportImage(
                this.editor.currentLayout,
                {},
                30000,
                watermark,
                useSvg
            ).then(canvas => {
                if(canvas) {
                    canvas.style.position = 'absolute';
                    canvas.style.zIndex = 9;
                    canvas.style.width = '800px';
                    canvas.style.top = '40px';
                    canvas.style.left = '0';
                    canvas.style.opacity = 1;
                    document.body.appendChild(canvas);
                }
                else {
                    console.info('不支持前端出图，或者没开启配置项 exportable');
                }
            }).catch(console.error);
        },
        uploadImage(file) {
            return new Promise(resolve => {
                const image = new Image();
                const url = URL.createObjectURL(file);
                image.onload = () => {
                    resolve({
                        url: url,
                        width: image.width,
                        height: image.height
                    });
                };
                image.src = url;
            });
        },
        testMode() {
            this.$emit('testMode');
        }
    }
};
</script>
