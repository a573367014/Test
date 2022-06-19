# CollapseContainer 折叠容器

折叠容器提供一个可折叠的面板，折叠面板展开时将会挤压 `main-container` 的空间，组件内提供 1 个插槽
- `default`: 默认插槽，设置折叠容器中的内容

## 示例

:::demo
```html
<style lang="less">
    .base-container-demo {
        width: 100%;
        position: relative;
        height: 320px;
        border: 1px solid #d8d8d8;
        background: #eee;
    }
</style>
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :small-mode-height="0">
                <eui-v2-aside-button :content="content" @click="collapsed = !collapsed">
                    <eui-v2-icon name="aside-page" />
                    {{ content }}
                </eui-v2-aside-button>
            </eui-v2-aside-container>
            <eui-v2-collapse-container :collapsed="collapsed" show-close @close="collapsed = true">
                <div style="text-align:center;padding:12px;">
                    <eui-v2-button color="primary" block>添加文字</eui-v2-button>
                </div>
            </eui-v2-collapse-container>
            <eui-v2-main-container>
                <div style="text-align:center;padding:12px;">
                    内容
                </div>
            </eui-v2-main-container>
        </eui-v2-base-container>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                collapsed: false
            }
        },
        computed: {
            content() {
                const { collapsed } = this;
                return collapsed ? '展开' : '收起';
            }
        }
    }
</script>
```
:::

## 折叠浮动

可以通过设置 `float` 来配置折叠容器是否浮动，浮动状态在展开时将不会挤压 `main-container` 的空间

:::demo
```html
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :small-mode-height="0">
                <eui-v2-aside-button :content="content" @click="collapsed = !collapsed">
                    <eui-v2-icon name="aside-page" />
                    {{ content }}
                </eui-v2-aside-button>
            </eui-v2-aside-container>
            <eui-v2-collapse-container :collapsed="collapsed" float>
                <div style="text-align:center;padding:12px;">
                    <eui-v2-button color="primary" block>添加文字</eui-v2-button>
                </div>
            </eui-v2-collapse-container>
            <eui-v2-main-container>
                <div style="text-align:center;padding:12px;">
                    内容
                </div>
            </eui-v2-main-container>
        </eui-v2-base-container>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                collapsed: false
            }
        },
        computed: {
            content() {
                const { collapsed } = this;
                return collapsed ? '展开' : '收起';
            }
        }
    }
</script>
```
:::

## v-show 与 v-if

在默认情况下，折叠栏的展开与收起是通过 `v-if` 实现的，可以使用 `cache` 参数配置是否改为使用 `v-show`

:::demo
```html
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :small-mode-height="0">
                <eui-v2-aside-button :content="content" @click="collapsed = !collapsed">
                    <eui-v2-icon name="aside-page" />
                    {{ content }}
                </eui-v2-aside-button>
            </eui-v2-aside-container>
            <eui-v2-collapse-container :collapsed="collapsed" cache>
                <div style="text-align:center;padding:12px;">
                    <eui-v2-button color="primary" block>添加文字</eui-v2-button>
                </div>
            </eui-v2-collapse-container>
            <eui-v2-main-container>
                <div style="text-align:center;padding:12px;">
                    内容
                </div>
            </eui-v2-main-container>
        </eui-v2-base-container>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                collapsed: false
            }
        },
        computed: {
            content() {
                const { collapsed } = this;
                return collapsed ? '展开' : '收起';
            }
        }
    }
</script>
```
:::

## Props

| 参数              | 说明                  | 类型    | 可选 | 默认 |
| ---------------- | ----------------------| ------- | --- | -- |
| width            | 宽度                  | Number | 是 | 270 |
| float            | 是否浮动               | Boolean | 是 | false |
| cache            | 使用 v-show           | Boolean | 是 | false |
| collapsed        | 是否折叠               | Boolean | 是 | false |
| showClose        | 显示关闭按钮            | Boolean | 是 | false |


## Events

| 事件名             | 参数                 | 说明                  |
| ----------------- | ------------------- | --------------------- |
| close             | -                   | 点击关闭按钮时触发       |
