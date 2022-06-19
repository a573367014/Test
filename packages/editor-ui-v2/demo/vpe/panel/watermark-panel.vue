<style lang="less">
    .watermark-panel {
        padding: 24px;

        .watermark-panel__file {
            display: block;
            position: relative;
            box-sizing: border-box;
            text-align: center;

            input {
                position: absolute;
                left: -9999px;
                width: 0;
                height: 0;
                opacity: 0;
            }
        }
    }
</style>

<template>
    <eui-tabs value="watermark" float-tab>
        <eui-tab name="watermark" content="水印" />
        <div slot="panel" class="watermark-panel">
            <div class="eui-panel-form">
                <eui-buttons-bar block>
                    <eui-button
                        block
                        :color="element.waterType === 0 ? 'primary' : 'normal' "
                        fill="outline"
                        @click="editor.setWatermarkType(0, element)">普通水印</eui-button>
                    <eui-button 
                        block
                        :color="element.waterType === 1 ? 'primary' : 'normal' "
                        fill="outline"
                        @click="editor.setWatermarkType(1, element)">全屏水印</eui-button>
                </eui-buttons-bar>
            </div>
            <div v-if="element.waterType === 0" class="eui-panel-form">
                <eui-button tag="label" block class="watermark-panel__file">
                    替换logo
                    <input type="file" @change="onFileChange" >
                </eui-button>
            </div>
            <div v-else class="eui-panel-form">
                <eui-panel class="eui-panel-form__item">
                    <eui-sub-panel>
                        <eui-range-picker
                            label="x偏移"
                            :label-width="58"
                            :min="-layout.width"
                            :max="layout.width"
                            v-model="element.fullScreenInfo.left" />
                    </eui-sub-panel>
                    <eui-sub-panel>
                        <eui-range-picker
                            label="y偏移"
                            :label-width="58"
                            :min="-layout.height"
                            :max="layout.height"
                            v-model="element.fullScreenInfo.top" />
                    </eui-sub-panel>
                    <eui-sub-panel>
                        <eui-range-picker
                            label="间隔"
                            :label-width="58"
                            :min="0"
                            :max="200"
                            v-model="fullScreenGap"
                            />
                    </eui-sub-panel>
                    <eui-sub-panel>
                        <eui-degree-input
                            label="旋转"
                            v-model="fullScreenRotation"/>
                    </eui-sub-panel>
                    <eui-sub-panel>
                        <eui-range-picker
                            label="缩放"
                            :label-width="58"
                            :min="0.5"
                            :max="2"
                            v-model="fullScreenScale" />
                    </eui-sub-panel>
                </eui-panel>
                <div class="eui-panel-form__item">
                    <eui-button tag="label" block class="watermark-panel__file">
                        替换logo
                        <input type="file" @change="onFileChange" >
                    </eui-button>
                </div>
            </div>
        </div>
    </eui-tabs>
</template>

<script>

export default {
    props: {
        editor: { type: Object, required: true },
    },
    computed: {
        element() {
            return this.editor.currentElement;
        },
        layout() {
            return this.editor.currentLayout;
        },
        fullScreenRotation: {
            get() {
                const { template: { transform } } = this.element;
                return Math.round(transform.rotation * 180 / Math.PI);
            },
            set(value) {
                const { template: { transform } } = this.element;
                transform.rotation = value * Math.PI / 180;
            }
        },
        fullScreenGap: {
            get() {
                const { fullScreenInfo } = this.element;
                return Math.max(fullScreenInfo.colGap, fullScreenInfo.rowGap);
            },
            set(value) {
                const { fullScreenInfo } = this.element;
                fullScreenInfo.rowGap = value;
                fullScreenInfo.colGap = value;
            }
        },
        fullScreenScale: {
            get() {
                const { template: { transform } } = this.element;
                return Math.max(transform.scale.x, transform.scale.y);
            },
            set(value) {
                const { template: { transform } } = this.element;
                transform.scale.x = value;
                transform.scale.y = value;
            }
        },
    },
    methods: {
        onFileChange(e) {
            const files = e.target.files;
            const file = files[0];

            if(!file) {
                return ;
            }
            e.target.value = [];

            const url = URL.createObjectURL(file);
            return new Promise(resolve => {
                const img = new Image();
                img.onload = function() {
                    resolve(img);
                }

                img.src = url;
            })
            .then(img => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                const dataURL = canvas.toDataURL();
                this.editor.changeWatermarkLogo(dataURL, { width: img.width, height: img.height }, this.element);
            });
        }
    }
}
</script>