# HeaderContainer 导航容器

导航容器内部是一个垂直剧中的 flex 布局组件，根据组件位置提供了 1 个默认插槽：
+ `default`: 提供了 4 个插槽
    - `title`: 最左侧标题插槽，定义了特殊的文字样式
    - `left`: 左侧插槽，定义了特殊的按钮组样式
    - `center`: 中间插槽，定义了特殊的按钮组样式
    - `right`: 右侧插槽，定义了特殊的按钮组样式

## 示例
:::demo
```html
<style lang="less">
    .header-container-demo {
        width: 100%;
        position: relative;
        height: 140px;
        border: 1px solid #d8d8d8;
    }
</style>
<template>
    <div class="header-container-demo">
        <eui-v2-base-container>
            <eui-v2-header-container>
                <template slot="title">
                    稿定设计
                </template>
                <template slot="left">
                    <eui-v2-buttons-bar>
                        <eui-v2-button
                            icon-type="only"
                            fill="clear"
                            tooltip="撤销"
                            tooltip-side="bottom">
                            <eui-v2-icon name="arrow-left" />
                        </eui-v2-button>
                        <eui-v2-button
                            icon-type="only"
                            fill="clear"
                            tooltip="重做"
                            tooltip-side="bottom">
                            <eui-v2-icon name="arrow-right" />
                        </eui-v2-button>
                    </eui-v2-buttons-bar>
                </template>
                <template slot="center" >
                    <eui-v2-buttons-bar>
                        <eui-v2-button icon-type="only" fill="clear">
                            <eui-v2-icon name="image-matting"/>
                        </eui-v2-button>
                        <eui-v2-button icon-type="only" fill="clear">
                            <eui-v2-icon name="post"/>
                        </eui-v2-button>
                    </eui-v2-buttons-bar>
                </template>
                <template slot="right">
                    <eui-v2-buttons-bar>
                        <eui-v2-button color="primary">下载</eui-v2-button>
                    </eui-v2-buttons-bar>
                </template>
            </eui-v2-header-container>
        </eui-v2-base-container>
    </div>
</template>
```
:::

## 高度

可以通过修改 `height` 属性来设置头部的高度

:::demo
```html
<template>
    <div class="header-container-demo">
        <eui-v2-base-container>
            <eui-v2-header-container :height="120">
                <template slot="title">
                    稿定设计
                </template>
                <template slot="left">
                    <eui-v2-buttons-bar>
                        <eui-v2-button
                            icon-type="only"
                            fill="clear"
                            tooltip="撤销"
                            tooltip-side="bottom">
                            <eui-v2-icon name="arrow-left" />
                        </eui-v2-button>
                        <eui-v2-button
                            icon-type="only"
                            fill="clear"
                            tooltip="重做"
                            tooltip-side="bottom">
                            <eui-v2-icon name="arrow-right" />
                        </eui-v2-button>
                    </eui-v2-buttons-bar>
                </template>
                <template slot="right">
                    <eui-v2-buttons-bar>
                        <eui-v2-button color="primary">下载</eui-v2-button>
                    </eui-v2-buttons-bar>
                </template>
            </eui-v2-header-container>
        </eui-v2-base-container>
    </div>
</template>
```
:::

## 右侧按钮

导航容器右侧也可以选择使用单个按钮形式的样式

:::demo
```html
<template>
    <div class="header-container-demo">
        <eui-v2-base-container>
            <eui-v2-header-container :full-button="false">
                <template slot="title">
                    稿定设计
                </template>
                <template slot="right">
                    <eui-v2-button color="gray">预览</eui-v2-button>
                    <eui-v2-buttons-bar fill="dropdown">
                        <eui-v2-button color="gray">
                            分享
                        </eui-v2-button>
                        <eui-v2-dropdown-button color="gray" :as-ref-width="false" placement="bottom-end">
                            <template slot="dropdown">
                                <eui-v2-dropdown-menus>
                                    <eui-v2-dropdown-menu>
                                        菜单 1
                                    </eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu>
                                        菜单 2
                                    </eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu>
                                        菜单 3
                                    </eui-v2-dropdown-menu>
                                </eui-v2-dropdown-menus>
                            </template>
                        </eui-v2-dropdown-button>
                    </eui-v2-buttons-bar>
                    <eui-v2-button color="primary">下载</eui-v2-button>
                </template>
            </eui-v2-header-container>
        </eui-v2-base-container>
    </div>
</template>
```
:::



## Props

| 参数              | 说明              |类型    |可选|默认|
| ---------------- | -----------------|------- |---|--|
| height           | 导航条高度         |number |是| 54|
