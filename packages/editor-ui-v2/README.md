# Editor UI
稿定编辑器 UI 组件

## 依赖

为了减少 editor-ui 的体积，editor-ui 在打包时不会将依赖的第三方库打包，使用方需要自行安装以下依赖：

- lodash@^4.16.4 - 工具方法支持
- vue@^2.5 - 依赖于 vue 组件
- tinycolor2@^2.7.0 - 颜色计算、比较与格式化
- @gaoding/editor-utils - 编辑器中使用到的一些工具函数

### 可选依赖

- @gaoding/color-alchemy - 进行 CMYK 色域检查的支持库，如果在颜色选择器等组件中开启了 cmyk-mode 的话，需要安装该依赖

## 运行项目

### 查看 UI 文档

```bash
npm install
npm run docs:dev
```

### 编辑器 demo

```bash
npm install
npm run dev
```

## 目录说明