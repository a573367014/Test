<template>
    <div class="page">
        <!-- 顶部 NavBar -->
        <NavBar>
            <eui-v2-buttons-bar slot="right" class="buttons-style">
                <eui-v2-button>载入滤镜</eui-v2-button>
                <eui-v2-button>测试</eui-v2-button>
                <eui-v2-button color="primary">保存新样式</eui-v2-button>
            </eui-v2-buttons-bar>
        </NavBar>

        <div class="container">
            <!-- 编辑器主界面 -->
            <div class="editor-wrapper">
                <tools />
                <div class="curves-wrap">
                    <CurvesGraph />
                    <image-histongram />
                </div>
            </div>

            <!-- 右侧面板 -->
            <div class="panel">
                <layer-manage :list="layerList">
                </layer-manage>
                <div class="illusion-editor-content">
                    <tab @change="changeTab" :list="tabs" :current-index="currentTabIndex"></tab>
                    <div v-show="currentTabIndex === 0">
                        <panel-content
                            visible
                            v-for="(item, idx) in basicList"
                            :key="idx"
                            :title="item.name"
                        >
                            <range-slider-group :list="item.filters" @change="onBasicChange"></range-slider-group>
                        </panel-content>
                        <panel-content
                            visible
                            title="曲线调整"
                        >
                            曲线调整
                        </panel-content>
                    </div>
                    <div v-show="currentTabIndex === 1">
                        特效
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import NavBar from './components/nav-bar';
import Tools from './components/tools';
import Tab from './components/tab';
import ImageHistongram from './components/image-histongram';
import CurvesGraph from './components/curves-graph';
import LayerManage from './components/layer-manage';
import PanelContent from './components/panel-content';
import RangeSliderGroup from './components/range-slider-group';
import { PopBase, ThreePopColor, ThreeCheckbox } from '../src';
import EUI from '../src/eui';

import { blendList, categoryList } from './constant';

Vue.use(EUI);

export default {
    components: {
        RangeSliderGroup,
        Tools,
        ImageHistongram,
        PanelContent,
        CurvesGraph,
        LayerManage,
        NavBar,
        PopBase,
        Tab,
        ThreePopColor,
        ThreeCheckbox
    },

    computed: {
        tabs() {
            return this.categoryList.map(item => item.name);
        },

        basicList() {
            return this.categoryList[0].groups;
        }
    },

    data() {
        return {
            categoryList,
            layerList: blendList,
            currentTabIndex: 0,
        };
    },

    methods: {
        uploadImage() {

        },
        onBasicChange(item) {
            console.log(item);
        },
        changeTab(index) {
            this.currentTabIndex = index;
        }
    }
};
</script>

<style lang="less">
html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;
}

.page {
    width: 100%;
    height: 100%;
}

.buttons-style {
    > .eui-v2-button {
        height: 54px;
        border-radius: 0 !important;
        padding: 11px 45px;
    }
}
.container {
    display: flex;
    width: 100%;
    height: calc(~"100% - 60px");
}

.editor-wrapper {
    position: relative;
    height: 100%;
    background: #eff2f7;

    flex-grow: 2;
    .editor-container {
        bottom: 78px;
    }
}

.panel {
    top: 0;
    bottom: 0;
    width: 270px;
    height: 100%;
    overflow: auto;
}

.curves-wrap {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 300px;
    height: 300px;
}
.illusion-editor-content {
    padding: 15px 17px;
}

</style>
