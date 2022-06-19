# 主题定制

gd-eui 已支持主题定制啦，目前还在实验阶段

## 介绍

主题定制的能力将基于 [preprocess-to-css-variable](https://github.com/anncwb/preprocess-to-css-variable) 实现，[preprocess-to-css-variable](https://github.com/anncwb/preprocess-to-css-variable) 是由@拾三 开发的 less 转 css var 的工具，它可以辅助我们将 gd-eui gd-antd 的样式转成 css var，在 css var 的能力上实现主题的变换。

## 安装

```
yarn add preprocess-to-css-variable -D
```

## 使用

[preprocess-to-css-variable](https://github.com/anncwb/preprocess-to-css-variable)

结合组件库的使用

新建以下脚本：

```javascript
import { runLessToCssVariables } from 'preprocess-to-css-variable';

runLessToCssVariables({
  force: true,
  libraryList: [
    {
      absolute: true,
      absolutePath: require.resolve('@editor/gd-eui'),
      name: '@editor/gd-eui',
      includes: ['es', 'lib'],
    },
    {
      absolute: true,
      absolutePath: require.resolve('@gaoding/gd-antd'),
      name: '@gaoding/gd-antd',
      includes: ['es', 'lib'],
    },
  ],
});

```

在使用之前需要先进行脚本运行，可以在工程上配置运行项

```javascript
// package.json eg:
"scripts": {
    "serve": "yarn precss && vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint",
    "precss": "esno ./scripts/index.js"
},
```

<code-box name="custom-theme"></code-box>
