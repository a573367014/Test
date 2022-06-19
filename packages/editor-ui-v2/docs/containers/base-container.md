# BaseContainer 布局容器

editor-ui 提供了一系列容器组件用于快速组合成编辑器 UI 的基本结构:

- `<eui-v2-base-container>`: 外层基本容器，其内部的 `<eui-v2-header-container>` 将会上下排列，其余容器将会左右排列。__注意__:内部只允许包含容器组件
- `<eui-v2-header-container>`: 顶栏容器
- `<eui-v2-aside-container>`: 侧边容器
- `<eui-v2-collapse-container>`: 折叠栏容器
- `<eui-v2-main-container>`: 主内容容器
- `<eui-v2-panel-container>`: 侧面板容器

## 基础布局

:::demo
```html
<style lang="less">
    .base-container-demo {
        width: 100%;
        position: relative;
        height: 320px;
        border: 1px solid #d8d8d8;
        margin-bottom: 10px;

        &__center {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
    }
</style>
<template>
    <div>
        <div class="base-container-demo">
            <eui-v2-base-container>
                <eui-v2-header-container>
                    <template slot="title">
                      顶栏
                    </template>
                    <template slot="left">
                        <eui-v2-buttons-bar>
                            <eui-v2-button icon-type="only" fill="clear">
                                <eui-v2-icon name="arrow-left"/>
                            </eui-v2-button>
                            <eui-v2-button icon-type="only" fill="clear">
                                <eui-v2-icon name="arrow-right"/>
                            </eui-v2-button>
                        </eui-v2-buttons-bar>
                    </template>
                </eui-v2-header-container>
                <eui-v2-aside-container>
                    <eui-v2-aside-button content="抠图">
                        <eui-v2-icon name="koutu" />
                        抠图
                    </eui-v2-aside-button>
                    <template slot="bottom">
                        <eui-v2-aside-button>
                            <eui-v2-icon name="help"/>
                            帮助
                        </eui-v2-aside-button>
                    </template>
                </eui-v2-aside-container>
                <eui-v2-main-container class="base-container-demo__center">
                    <div>主内容</div>
                </eui-v2-main-container>
                <eui-v2-panel-container class="base-container-demo__center">
                    <div>侧面版</div>
                </eui-v2-panel-container>
            </eui-v2-base-container>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                collapsed: false
            }
        }
    }
</script>
```
:::

## 自由排列

我们允许容器组件自由的排列，在 `base-container` 会根据组件顺序自动的计算位置

:::demo
```html
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-header-container>
                <template slot="title">
                顶栏
                </template>
            </eui-v2-header-container>
            <eui-v2-aside-container>
                <eui-v2-aside-button content="抠图">
                    <eui-v2-icon name="koutu" />
                    抠图
                </eui-v2-aside-button>
            </eui-v2-aside-container>
            <eui-v2-panel-container class="base-container-demo__center">
                <div>侧面版</div>
            </eui-v2-panel-container>
            <eui-v2-main-container class="base-container-demo__center">
                <div>主内容</div>
            </eui-v2-main-container>
        </eui-v2-base-container>
    </div>
</template>
<script>
    export default {
        data() {
            return {
            }
        }
    }
</script>

```
:::