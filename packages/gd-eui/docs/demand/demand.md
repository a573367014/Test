# 按需加载

## 手动引入

``` javascript
import GeSlider from '@editor/gd-eui/es/components/base/slider' // 加载js，css文件会自动引入
```

## 自动引入

1. 插件配置

```
npm i --save-dev babel-plugin-import
```

2. 在工程babel.config.js内增加presets, "@editor/gd-eui/plugin/babel-import"

``` javascript
module.exports = {
  presets: ["@vue/cli-plugin-babel/preset", "@editor/gd-eui/plugin/babel-import"],
}
```

3. 使用

```
import { GeSlider } from '@editor/gd-eui';
```
