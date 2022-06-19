<template>
    <eui-v2-tabs value="static" float-tab>
        <eui-v2-tab name="static" content="全局"/>
         <div slot="panel" class="test-panel">
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__item">
                    <button @click="normalMode">退出测试</button>
                </div>
                <h2 class="eui-v2-panel-form__label">
                    导入测试
                </h2>
                <div class="eui-v2-panel-form__item">
                    <input type="file" @change="importFile" >
                </div>
                <template v-if="elements.length > 0">
                    <h2 class="eui-v2-panel-form__label">导入元素</h2>
                    <div class="eui-v2-panel-form__item">
                        <div class="element-list">
                            <eui-v2-tooltip
                                :append-body="false"
                                class="element-list__item"
                                :content="element.id"
                                v-for="element in elements"
                                :key="element.id"
                                :style="{
                                    'borderColor': element.tapCount > 0 ? 'green' : 'red'
                                }">
                                    <div
                                        class="element-list__item__preview"
                                        :style="{
                                            'backgroundImage': `url(${element.preview && element.preview.url})`
                                        }"
                                        @click="addElement(element)">
                                    </div> 
                            </eui-v2-tooltip>
                        </div>
                    </div>
                </template>
            </div>
         </div>
    </eui-v2-tabs>
</template>

<script>
export default {
    props: {
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            elements: []
        };
    },
    methods: {
        normalMode() {
            this.$emit('normalMode');
        },
        importFile(e) {
            const files = e.target.files;
            if(!files || !files[0]) return;

            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = reader.result;
                const json = JSON.parse(result);
                if(Array.isArray(json)) {
                    this.elements = json.map(item => {
                        return Object.assign({ tapCount: 0 }, item);
                    });
                }
                else {
                    this.elements = [Object.assign({ tapCount: 0 }, json)];
                    this.addElement();
                }
            };

            reader.readAsText(file);
            e.target.value = '';
        },



        addElement(element) {
            element.tapCount += 1;
            const content = element.content;
            this.editor.addElement(content);
        }
    }
}
</script>

<style lang="less">
    .test-panel {
        padding: 24px;

        .element-list {
            display: flex;
            flex-wrap: wrap;
            align-content: center;
            justify-content: space-between;

            &__item {
                width: 102px;
                height: 102px;
                border-width: 1px;
                border-style: solid;
                margin-bottom: 6px;
                background-color: rgba(0, 0, 0, 0.3);

                &__preview {
                    background-repeat: no-repeat;
                    background-size: contain;
                    background-position: center;
                    box-sizing: border-box;
                    width: 100%;
                    height: 100%;
                }
            }
        }

        .element-item {
            display: flex;
            margin-top: 6px;
            align-items: center;
            justify-content: space-between;


            &:first-child {
                margin-top: 0;
            }

            .element-id {
                margin-right: 6px;
            }
        }
    }
</style>