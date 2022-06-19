<template>
    <div class="duplicated">
        <div @click="handleShow">
            <div>
                重复代码:
                <span style="color: red">{{ filterList.length }}</span>
                处, {{ filterList.length ? '建议重构' : '完美' }}
            </div>
            <div>点击{{ show ? '关闭' : '查看' }}</div>
        </div>
        <div v-if="show" class="code">
            <div class="code__list">
                <div
                    :class="{
                        'code__list-item': true,
                        'code__list-item-select': selectIndex === index,
                    }"
                    v-for="(item, index) in filterList"
                    :key="index"
                    @click="handleSelect(index)"
                >
                    <div class="code__list-item__file">
                        {{ item.duplicationA.sourceId.split('').reverse().join('') }}
                    </div>
                    <div class="code__list-item__file">
                        {{ item.duplicationB.sourceId.split('').reverse().join('') }}
                    </div>
                </div>
            </div>
            <div class="code__compare">
                <div v-if="selectItem" class="code__compare-a">
                    <div class="code__compare-file">{{ selectItem.duplicationA.sourceId }}</div>
                    <div style="padding-left: 24px">
                        从：{{ selectItem.duplicationA.start.line }} 行:
                        {{ selectItem.duplicationA.start.column }}列
                    </div>
                    <div style="padding-left: 24px">
                        至：{{ selectItem.duplicationA.end.line }} 行:
                        {{ selectItem.duplicationA.end.column }}列
                    </div>
                    <VueMonacoEditor
                        :code="selectItem.duplicationA.fragment"
                        :editorOptions="{
                            automaticLayout: true,
                            tabSize: 2,
                            minimap: {
                                enabled: true, // 不要小地图
                            },
                        }"
                        @mounted="editorAMounted"
                    />
                </div>
                <div v-if="selectItem" class="code__compare-b">
                    <div class="code__compare-file">{{ selectItem.duplicationB.sourceId }}</div>
                    <div style="padding-left: 24px">
                        从：{{ selectItem.duplicationB.start.line }} 行:
                        {{ selectItem.duplicationB.start.column }}列
                    </div>
                    <div style="padding-left: 24px">
                        至：{{ selectItem.duplicationB.end.line }} 行:
                        {{ selectItem.duplicationB.end.column }}列
                    </div>
                    <VueMonacoEditor
                        :code="selectItem.duplicationB.fragment"
                        :editorOptions="{
                            automaticLayout: true,
                            tabSize: 2,
                            minimap: {
                                enabled: true, // 不要小地图
                            },
                        }"
                        @mounted="editorBMounted"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { common } from '../api';
import VueMonacoEditor from 'vue-monaco-editor';

export default {
    components: {
        VueMonacoEditor,
    },
    data: function () {
        return {
            show: false,
            list: [],
            selectIndex: 0,
            editorA: null,
            editorB: null,
        };
    },
    computed: {
        filterList() {
            return this.list.filter((item) => {
                return item.format === 'markup' || item.format === 'ts';
            });
        },
        selectItem() {
            if (!this.filterList.length) {
                return null;
            }
            return this.filterList[this.selectIndex];
        },
    },
    created: function () {
        common.jscpdPost().then((res) => {
            if (res) {
                this.list = res.data;
            }
        });
    },
    methods: {
        editorAMounted: function (editor) {
            this.editorA = editor;
        },
        editorBMounted: function (editor) {
            this.editorB = editor;
        },
        handleSelect(index) {
            this.selectIndex = index;
            this.editorA.setValue(this.selectItem.duplicationA.fragment);
            this.editorB.setValue(this.selectItem.duplicationB.fragment);
        },
        handleShow() {
            this.show = !this.show;
        },
    },
};
</script>

<style lang="less">
.duplicated {
    position: fixed;
    top: 1px;
    right: 200px;
    width: 180px;
    height: 51px;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    // opacity: 0.8;
    color: white;
    cursor: pointer;
    padding: 4px;
}
.code {
    display: flex;
    position: fixed;
    height: calc(100% - 56px);
    width: 100%;
    background: #1e1e1e;
    left: 0px;
    bottom: 0px;
    &__list {
        height: 100%;
        // width: 300px;
        background: #1e1e1e;
        overflow-y: scroll;
        overflow-x: hidden;
        box-shadow: inset 0px 0px 1px #e7ebf0;
        &-item {
            padding: 12px 8px;
            // width: 276px;
            max-width: 300px;
            background: #33383e;
            margin-bottom: 1px;
            cursor: pointer;
            &-select {
                background: #569cd6;
            }
            &__file {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                direction: rtl;
                unicode-bidi: bidi-override;
            }
        }
    }
    &__compare {
        display: flex;
        position: relative;
        width: 100%;
        height: 100%;
        &-file {
            width: 100%;
            padding: 12px;
            word-wrap: break-word;
            word-break: break-all;
            color: #569cd6;
        }
        &-a {
            position: absolute;
            left: 0px;
            top: 0px;
            width: 50%;
            height: 100%;
        }
        &-b {
            position: absolute;
            right: 0px;
            top: 0px;
            width: 50%;
            height: 100%;
        }
    }
}
.CodeMirror {
    height: 100%;
}
</style>
