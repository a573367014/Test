# 起步

## 介绍

editor-ui 是稿定编辑器 UI 组件库

## 依赖

为了减少 editor-ui 的体积，editor-ui 在打包时不会将依赖的第三方库打包，使用方需要自行安装以下依赖：

``` json

{
    "lodash": "4.17.15",
    "vue": "^2.5",
    "tinycolor2": "^2.7.0"
}

```

## 安装

``` bash
npm install -S @gaoding/editor-ui
```

editor-ui 目前分为两个部分，一个是可按需加载的编辑器组件库，一个是插件化的基础组件库，具体的使用方式请参考相关组件库中的说明