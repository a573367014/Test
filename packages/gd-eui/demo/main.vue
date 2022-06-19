<template>
    <div class="gd-eui">
        <div class="gd-eui__header">
            <h3 style="color: white">GD-EUI 工坊</h3>
            <div style="margin-right: 390px">
                <Popover>
                    <Button>修改主题色</Button>
                    <template slot="content">
                        <ColorPicker @colorChange="colorChange" />
                    </template>
                </Popover>

                <Button :disabled="isPublishing" style="margin-left: 50px" @click="handlePublish">
                    发布测试版
                </Button>
            </div>
        </div>
        <div class="gd-eui-demo">
            <div class="gd-eui-demo__component-list">
                <div
                    v-for="item in routeList"
                    :key="item.name"
                    :class="{
                        'gd-eui-demo__component-list__item': true,
                        'gd-eui-demo__component-list__item-select': selectedRouter(item.path),
                    }"
                >
                    <router-link
                        :style="{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            color: selectedRouter(item.path) ? 'white' : '#1e1e1e',
                        }"
                        :to="item.path"
                    >
                        {{ item.name }}
                    </router-link>
                </div>
            </div>
            <div class="gd-eui-demo__router">
                <div class="gd-eui-demo__router__main">
                    <div
                        class="gd-eui-demo__router__test"
                        :style="{
                            transform: `scale(${transformScale}, ${transformScale})`,
                        }"
                    >
                        <transition>
                            <keep-alive>
                                <router-view ref="routerRef"></router-view>
                            </keep-alive>
                        </transition>
                    </div>
                    <div class="gd-eui-demo__command">
                        <command />
                    </div>
                </div>

                <div class="gd-eui-demo__router__data" ref="dataDomRef">
                    <div class="gd-eui-demo__router__data_wrap">
                        <div class="gd-eui-demo__router__data-top">Demo数据源：</div>
                        <div>
                            <VueJsonEditor
                                v-model="demoData"
                                @json-change="onJsonChange"
                            ></VueJsonEditor>
                        </div>
                        <div class="gd-eui-demo__router__data-top">组件结构：</div>
                        <div>
                            <!-- @select="handleSelect" -->
                            <Tree :treeData="treeData" />
                        </div>
                        <div class="gd-eui-demo__router__data-top">组件属性数据：</div>
                        <div>
                            <VueJsonEditor
                                :value="componentPendantData"
                                @json-change="onJsonComponentChange"
                            ></VueJsonEditor>
                        </div>
                        <div class="gd-eui-demo__router__data-top">你可能想要的数据：</div>
                        <div>
                            <VueJsonEditor
                                v-model="guestData"
                                :mode="'code'"
                                lang="zh"
                            ></VueJsonEditor>
                        </div>
                        <div style="text-align: center; margin-top: 12px; display: flex">
                            <div>
                                <Button
                                    class="gd-eui-demo__router__data-use"
                                    @click="handleUseClick"
                                >
                                    一键使用
                                </Button>
                                <div></div>
                            </div>
                            <Button
                                class="gd-eui-demo__router__data-use"
                                @click="handleRefreshDemoGuest"
                            >
                                刷新为demo数据
                            </Button>
                            <Button
                                class="gd-eui-demo__router__data-use"
                                @click="handleRefreshComponentGuest"
                            >
                                刷新为组件数据
                            </Button>
                        </div>
                    </div>
                    <div class="gd-eui-demo__router__data__draggle"></div>
                </div>
            </div>
        </div>
        <PerformanceShow :fpsList="fpsList" />
        <Duplicated />
        <ComponentPendant ref="componentPendantRef" />
    </div>
</template>

<script>
import routes from './router';
import VueJsonEditor from 'vue-json-editor';
import Vue from 'vue';
import { Button, message, Modal, Tree, Popover } from '@gaoding/gd-antd';
import { Performance } from './utils/performance';
import ComponentPendant from './hoot/component-pendant.vue';
import PerformanceShow from './hoot/performance-show.vue';
import Duplicated from './hoot/duplicated.vue';
import client from './client';
import command from './hoot/command.vue';
import '@gaoding/gd-antd/es/modal/style';
import '@gaoding/gd-antd/es/message/style';
import '@gaoding/gd-antd/es/tree/style';
import { common } from './api';
import { walkerData } from './utils/walker-data';
import { parserTreeComponents } from './utils/parser-tree-components';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import ColorPicker from '../src/components/modules/color-picker';
// import { generate } from 'preprocess-to-css-variable/es';

export default {
    components: {
        VueJsonEditor,
        Button,
        PerformanceShow,
        Duplicated,
        command,
        Tree,
        ComponentPendant,
        Popover,
        ColorPicker,
    },
    data() {
        return {
            routes,
            selectedRouterIndex: 0,
            demoComponent: null,
            demoData: {},
            guestData: {},
            focusDemo: true,

            fpsList: [],
            transformScale: 1,
            isPublishing: false,

            // tree
            treeData: [],

            // componentPendant
            componentPendantData: null,
            componentPendant: null,
        };
    },
    created: function () {
        new Performance().run((info) => {
            this.fpsList = info.fpsList;
        });
        client.connection();
    },
    mounted: function () {
        this.routes = routes;
        this.refresh();
        this.refreshComponentPendant();
    },
    computed: {
        routeList: function () {
            return this.routes.filter((item) => item.path.indexOf('*') === -1);
        },
    },
    methods: {
        colorChange: function (color) {
            // generate({
            //     color: {
            //         primary: color,
            //     },
            // });
        },
        handlePublish: function () {
            message.loading('发布中...', 0);
            this.isPublishing = true;
            common.publishBetaPost().then((res) => {
                message.destroy();
                this.isPublishing = false;
                if (res) {
                    const modal = Modal.success();
                    modal.update({
                        title: '发布成功',
                        content: res.data,
                        zIndex: 999999,
                    });
                } else {
                    const modal = Modal.error();
                    modal.update({
                        title: '发布失败',
                        content:
                            '失败原因：\n 1. 没有发布权限，可找图南，添加权限。\n 2. 可能存在发布版本冲突，可重新发布尝试。\n 3. 可能存在打包失败，可在目录下先yarn再npm i，然后重新发布。\n 4. 如果以上操作都无法解决你的问题，找@jinjiu。',
                        zIndex: 999999,
                    });
                }
            });
        },
        handleMouseWheel: function (event) {
            if (!this.deltaY) {
                this.deltaY = event.deltaY;
            }
            const dw = this.deltaY - event.deltaY;
            this.deltaY = event.deltaY;
            this.transformScale = this.transformScale + dw / 100;
        },
        refreshComponentPendant(value) {
            const name = this.getComponentName();
            let data = null;
            if (value) {
                data = value;
            } else {
                const Component = Vue.component(name);
                data = new Component()._props;
            }
            this.componentPendantData = data;
            this.componentPendant = this.$refs.componentPendantRef.refreshComponent(
                name,
                this.componentPendantData,
            );
        },
        getComponentName: function () {
            return 'Ge' + upperFirst(camelCase(this.$router.history.current.meta.component));
        },
        selectedRouter: function (path) {
            const hash = location.hash;
            return `#${path}` === hash;
        },
        afterRouter() {
            setTimeout(() => {
                this.refresh();
                this.$forceUpdate();
                this.refreshComponentPendant();
            }, 200);
        },
        refresh() {
            this.demoComponent = this.$refs.routerRef;
            this.demoData = this.$refs.routerRef._data;
            this.treeData = [...parserTreeComponents(this.demoComponent).children];
            this.handleRefreshDemoGuest();
        },
        onJsonComponentChange: function (_value) {
            this.refreshComponentPendant(_value);
        },
        onJsonChange: function (value) {
            this.refreshDemoData(value, this.demoComponent);
        },
        refreshDemoData: function (value, targetComponent) {
            const target = {
                ...targetComponent,
                ...value,
            };
            for (const prop in target) {
                Vue.set(targetComponent, prop, target[prop]);
            }
        },
        handleRefreshDemoGuest: function () {
            this.focusDemo = true;
            this.guestData = walkerData(this.demoData);
        },
        handleUseClick: function () {
            if (this.focusDemo) {
                this.refreshDemoData(this.guestData, this.demoComponent);
            } else {
                this.refreshComponentPendant(this.guestData);
            }
        },
        handleRefreshComponentGuest: function () {
            this.focusDemo = false;
            this.guestData = walkerData(this.componentPendantData);
        },
    },
};
</script>

<style lang="less">
@import url('../es/style/themes/default.less');
.gd-eui {
    &__header {
        position: fixed;
        top: 0px;
        width: 100%;
        height: 56px;
        z-index: 100;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 32px;
        box-shadow: inset 0px -1px 1px #e7ebf0;
        background: @primary-color;
        color: white;
    }
}
.gd-eui-demo {
    width: 100%;
    box-sizing: border-box;
    &__command {
        position: fixed;
        bottom: 0px;
        left: 240px;
        width: calc(100% - 240px - 380px);
        height: 160px;
        z-index: 99;
    }
    &__component-list {
        position: fixed;
        top: 56px;
        left: 0px;
        width: 240px;
        height: 100%;
        background: #fff;
        box-shadow: inset 0px -1px 0px 1px #e7ebf0;
        overflow-y: scroll;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        &__item {
            height: 48px;
            line-height: 48px;
            padding-left: 14px;
            box-shadow: inset 0px -1px 1px #e7ebf0;
            cursor: pointer;
            &:hover {
                background-color: #666666;
            }
            &-select {
                // background-color: #e6f7ff;
                background-color: @primary-color;
                & .a {
                    color: white;
                }
            }
        }
    }
    &__router {
        position: absolute;
        top: 56px;
        left: 0px;
        width: calc(100% - 240px);
        min-height: calc(100% - 56px);
        margin-left: 240px;
        background: #e7ebf0;
        overflow: scroll;
        &__main {
            display: flex;
            position: absolute;
            justify-content: center;
            width: calc(100% - 380px);
            overflow: scroll;
            max-height: calc(100% - 160px);
        }
        &__test {
            margin-top: 24px;
            height: 100%;
            width: 85%;
            background: #fff;
            padding: 12px 24px;
            border-radius: 8px;
        }
        &__data {
            position: fixed;
            top: 56px;
            right: 0px;
            width: 380px;
            height: calc(100% - 56px);
            z-index: 10;
            background-color: #fff;
            box-shadow: inset 1px 0px 0px #e5e5e5;
            &_wrap {
                overflow: scroll;
                height: 100%;
                padding-bottom: 400px;
            }
        }
        &__data-top {
            height: 48px;
            padding-left: 16px;
            line-height: 48px;
            box-shadow: inset 0px -1px 1px #555555;
            font-weight: 500;
            background: @primary-color;
            color: white;
        }
        &__data-use {
            background: @primary-color;
            color: white;
        }
        &__data__draggle {
            position: absolute;
            width: 1px;
            height: 100%;
            background: @primary-color;
            top: 0px;
            left: 0px;
            z-index: 999999;
            cursor: pointer;
        }
    }
}

.wrapper {
    width: 100%;
    padding-top: 8px;
    padding-bottom: 8px;
    display: flex;
    flex-direction: column;
    position: relative;
}
.wrapper::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0px;
    right: 0px;
    height: 1px;
    background: #ccc;
    z-index: 2;
}
.wrap-title {
    padding: 12px 0px 12px 0px;
}
div.jsoneditor {
    color: #1a1a1a;
    border: 1px solid @primary-color;
    a {
        display: none;
    }
}
div.jsoneditor-menu {
    background-color: @primary-color;
    border-bottom: 1px solid @primary-color;
}
</style>
