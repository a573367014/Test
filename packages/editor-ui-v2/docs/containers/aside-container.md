# AsideContainer 侧边容器

侧边容器用于展示侧边按钮菜单，容器内部是一个水平居中的 flex 容器，组件内提供了2个插槽:
- `default`: 从容器顶部开始排列组件
- `bottom`: 从容器底部开始排列组件

__注意__: 侧边容器支持滚动条


## 示例

:::demo
```html
<style lang="less">
    .base-container-demo {
        width: 100%;
        position: relative;
        height: 320px;
        border: 1px solid #d8d8d8;
    }
</style>
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :smallModeHeight="0">
                <eui-v2-aside-button content="页面" activated>
                    <eui-v2-icon name="aside-page" />
                    页面
                </eui-v2-aside-button>
                <eui-v2-aside-button content="模板">
                    <eui-v2-icon name="aside-templet"/>
                    模板
                </eui-v2-aside-button>
                <eui-v2-aside-button content="文字">
                    <eui-v2-icon name="aside-text"/>
                    文字
                </eui-v2-aside-button>
                <eui-v2-aside-button content="元素">
                    <eui-v2-icon name="aside-graph"/>
                    元素
                </eui-v2-aside-button>
                <eui-v2-aside-button content="背景">
                    <eui-v2-icon name="aside-background"/>
                    背景
                </eui-v2-aside-button>
                <template slot="bottom">
                    <eui-v2-aside-button content="帮助">
                        <eui-v2-icon name="help"/>
                        背景
                    </eui-v2-aside-button>
                </template>
            </eui-v2-aside-container>
        </eui-v2-base-container>
    </div>
</template>
```
:::

## 宽度

可以通过修改 `width` 的值来设置侧边容器的宽度

:::demo
```html
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :width="120">
                <eui-v2-aside-button content="页面">
                    <eui-v2-icon name="aside-page" />
                    页面
                </eui-v2-aside-button>
                <eui-v2-aside-button content="模板">
                    <eui-v2-icon name="aside-templet"/>
                    模板
                </eui-v2-aside-button>
                <eui-v2-aside-button content="文字">
                    <eui-v2-icon name="aside-text"/>
                    文字
                </eui-v2-aside-button>
            </eui-v2-aside-container>
        </eui-v2-base-container>
    </div>
</template>

```
:::


## 小屏幕模式

可以通过修改 `smallModeHeight` 的值来设置进入小屏幕模式的阀值

小屏幕模式中，将会隐藏侧边栏按钮的文本，改为鼠标 hover 显示 tooltip 的形式展示

:::demo
```html
<template>
    <div class="base-container-demo">
        <eui-v2-base-container>
            <eui-v2-aside-container :smallModeHeight="1920">
                <eui-v2-aside-button content="页面">
                    <eui-v2-icon name="aside-page" />
                    页面
                </eui-v2-aside-button>
                <eui-v2-aside-button content="模板">
                    <eui-v2-icon name="aside-templet"/>
                    模板
                </eui-v2-aside-button>
                <eui-v2-aside-button content="文字">
                    <eui-v2-icon name="aside-text"/>
                    文字
                </eui-v2-aside-button>
                <eui-v2-aside-button content="元素">
                    <eui-v2-icon name="aside-graph"/>
                    元素
                </eui-v2-aside-button>
            </eui-v2-aside-container>
        </eui-v2-base-container>
    </div>
</template>

```
:::

## Props

| 参数              | 说明                  | 类型    | 可选 | 默认 |
| ---------------- | ----------------------| ------- | --- | -- |
| width            | 宽度                  | Number | 是 | 80 |
| smallModeHeight  | 小屏幕模式的最大视界高度 | Number | 是 | 720 |


## AsideButton 侧边按钮

__侧边按钮只能在侧边栏容器中使用__

### Props

| 参数              | 说明                  | 类型    | 可选 | 默认 |
| ---------------- | ----------------------| ------- | --- | -- |
| tag              | 按钮标签               | String  | 是 | button |
| content          | 小屏幕模式下 tooltip 显示内容 | String | 是 | '' |
| activated        | 按钮是否在激活态             | Boolean | 是 | false |