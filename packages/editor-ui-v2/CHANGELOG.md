# Changelog




<!--NEW_LOG_INJECT_HERE-->
### `V0.15.20` - 2020-11-09
* perf: 调整取色器参数，支持 `euiConfig.colorSelectorOptions` 配置


### `V0.15.16` - 2020-08-20
* perf: 将 `icon` 中的 loader 图标改为硬编码，减少在精灵图中加入动画效果导致的 cpu 消耗
* feat: `RangeSlide` 支持键盘方向键



### `V0.15.12` - 2020-05-26
* fix: 修复文件无法重复上传的bug



### `V0.15.9` - 2020-05-22
* feat: 新增 `scroll` 组件
* feat: 混排组件 `justified-material-list` 支持参数 `lazyScroll` 来开启虚拟滚动条
* fix: 修复 `range-slider` 偶现滑块超出区域的问题

### `V0.15.6` - 2020-04-21
* fix: 修复 `ColorPickerPanel` 的颜色面板有点侧漏的问题
* feat: 新增 icon 图标
* chore: `DropdownMenu` 组件的选中态样式修改

### `V0.15.2` - 2020-03-16
* feat: `JustifiedMaterialList` 组件的作用域插槽更新
* feat: `EditorFontFamily` 组件支持注入 `euiConfig` 来配置 icon 图标


### `V0.15.1` - 2020-03-02
* feat: `EditorTextControl` 新增文字排版下拉选项

### `V0.15.0` - 2020-03-02
* feat: `range-slider` 与 `range-picker` 组件新增参数 `bonding`，用于设置滑块吸附到 `start` 上的阀值
* feat: `editorColors`、`editorBackground` 集成取色逻辑，使用 `enableStraw` 来控制是否开启取色功能
* feat: 新增字体许可证提示
* feat: 新增 `editorColorPicker` 组件，其内部集成了取色逻辑
* fix: 修正 `EditorElementLoading` 在组元素中位置显示错误的问题

### `V0.14.44` - 2020-02-07
* feat:`aside-button` 组件新增 `text` 插槽，用于设置角标背景，以及角标动态文字填充功能。
* fix: 修正渐变色面板中预设颜色不见的问题
* fix: 修正 `EditorEffects` 组件文字特效设置为无特效后双击编辑变成黑色的问题

### `V0.14.42` - 2020-01-21
* feat: `Icon` 图标的资源改为异步加载
* feat: 支持 tree shaking
* feat: `EditorBackground` 组件中支持团队品牌颜色
* fix: `JustifiledMaterialList` 新增属性 `fit`, 开启后使用 object-fit 来显示图片
* chore: 补充依赖 `@gaoding/color-alchemy` 与 `vue-color`


### `V0.14.41` - 2020-01-02
* fix: 修正颜色选择器在 `color` 为 `null` 时选中黑色无法触发 `change` 事件的问题

### `V0.14.40` - 2019-12-26
* feat: 侧边栏 Icon 替换
* feat: 折叠栏支持新属性 `groupId`，在相同 group 中的折叠栏将相互覆盖
* feat: 左侧菜单栏尺寸改为 64px
* fix: base container 内部渲染了逻辑优化
* `Popup` 弹出框组件:
    * perf: 优化弹出框的性能
    * feat: 弹出框支持 `height` 参数配置高度
    * fix: 修正 `appendBody` 为 `false` 的弹出框 `id` 不存在的问题


### `V0.14.39` - 2019-12-19
* fix: 修复3D样式“无样式”按钮异常
* fix: 修复渐变预设异常

### `V0.14.38` - 2019-12-17
* fix: 渐变角度默认值错误
* fix：3D渐变控制点不可删除


* feat: 新增 EditorElementLoading 组件

### `V0.14.37` - 2019-12-09
* fix: 3d颜色选择器支持图案上传


### `V0.14.36-beta.1` - 2019-12-09
* chore: 调整凹凸贴图逻辑

### `V0.14.36` - 2019-12-05
* __breaking__: 表格内容从 editor-ui 中移除 
* feat: 3D文字样式增加半球光兼容

### `V0.14.35` - 2019-12-03
* chore: 入口文件导出 eui
* fix: 修复 editor-hint 中对商业类型展示的错误


### `V0.14.34` - 2019-12-03
* fix: 修复 ThreeColorPicker 对 prop 的参数使用 `sync`
* fix: 修复 ColorPicker 缺失 `autoSelect` prop



### `V0.14.33` - 2019-12-02
* fix: 修复 ColorPicker 在某些情况下覆盖编辑器快捷键报错的问题



### `V0.14.32` - 2019-11-29
* fix: 修正 editorEffectColorPicker 组件缺少上传图案按钮的问题



feat: 新增团队侧边图标 `aside-team`、`aside-team-dard` 与 文件夹图标 `color-folder`
feat: 下拉菜单 `DropdownMenu` 的选中态修改

### `V0.14.31` - 2019-11-25
* fix: 修正渐变面板错误



### `V0.14.30` - 2019-11-25
* fix: 修正 GroupControl 中拆分组按钮出现了两个的问题



### `V0.14.29` - 2019-11-25
* feat: DropdownFontFamily 的提示内容允许设置配色方案
* feat: ColorPicker 组件支持 `showStraw` 与 `strawActivated` 参数配置取色器，同时新增 `click-straw` 的取色器点击事件
* feat: Tooltip 组件支持所有 PopupBase 组件参数
* feat: DropdownButton 组件支持按钮的 `color` 字段
* feat: Popup 组件允许设置弹出框的 `width` 与 `height` 属性
* feat: HeaderContainer 中右侧按钮的样式修改
* fix: 修正 CollapseContainer 的折叠动画没有正常显示的问题
* feat: container 组件支持配置尺寸：
    - header-container 支持配置 `height` 属性
    - panel-container 支持配置 `width` 属性
    - aside-container 支持配置 `width` 属性

### `V0.14.28` - 2019-11-14
* fix: @gaoding/editor-utils 更新为 1.0.17



### `V0.14.27` - 2019-11-14
* fix: @gaoding/editor-utils 更新为 1.0.16



### `V0.14.26` - 2019-11-14
* feat: EditorGroupControl 组件新增对链接能力的支持
* feat: Button 组件新增 info 配色
* feat: 新增 EditorHint 组件
* feat: 新增 icon: link

### `V0.14.25` - 2019-11-13
* fix: RangePicker 输入框 suffix 返回值为 undefined



### `V0.14.24` - 2019-11-07
* fix: 修正全局弹出框无法正常关闭的问题



### `V0.14.23` - 2019-11-07
* feat: PopupBase 新增参数 appendBody
* fix: 修正颜色面板无法显示背景与贴图的问题
* fix: 修正颜色面板在 edge 浏览器下无法显示16进制 RGBA 的问题
* fix: 下拉框样式修正



### `V0.14.22` - 2019-11-04
* feat: 修改特效等素材记录的 materialId 改为 materialMeta



### `V0.14.21` - 2019-10-31
* feat: 新增 vip 图标
* feat: asideContainer 支持设置小屏幕模式的阀值
* fix: 修复 popup 组件在某些情况下可能会出现 undefined 的错误
* fix: 修复 EditorColors 组件在多选文字的时候无法修改颜色的问题


### `V0.14.20` - 2019-10-28
* fix: 修复 text-control 中加粗等功能报错的问题



### `V0.14.19` - 2019-10-24
* feat: 新增全局试图组件， 在 EditorToolBar 中新增展示全局试图组件的按钮
* fix: 修正成组后的gif图片也可以修改的问题
* fix: 修正 aside-button 在多层嵌套之后不能正确的在小屏幕上自适应的问题
* fix: 修复 rande slide 的 start 超过最大最小值时导致的样式错误
* fix: 修复 RangePicker 输入框 type 为 number 导致无法支持文本 suffix
* __break__: 以下组件被移除了:
    * 旧版本的 color-picker
    * 旧版本的 range-picker
    * editor-state


### `V0.14.18` - 2019-10-23
* fix: 修复 DropdownEffects 滚动位置偏移

### `V0.14.17` - 2019-10-23
* feat: RangePicker 支持 suffix
* feat: DropdownEffects 支持无样式 tip & 打开时滚动到合适的位置

### `V0.14.16` - 2019-10-14
* feat: DropdownEffects 新增无样式 slot

### `V0.14.15` - 2019-10-14
* feat: DropdownEffects 新增 tooltip 与 preview slot
* feat: 新增红色警告 icon `fill-warning-red`
* feat: 优化了字体下拉菜单的样式命名规范
* feat: 优化了字体下拉菜单的滚动性能
* fix: 修复了字体下拉按钮中没有字体与多选字体下的文字显示错误问题
* __break__: 以下组件被移除了:

    * cascader
    * color-filter
    * color-panel
    * colors-panel
    * effect-group
    * element-bar
    * image-picker
    * image-preview
    * main-button
    * pop-base
    * pop-color
    * pop-effect
    * pop-font-effect
    * pop-font-family
    * pop-font-size
    * svg-panel
    * unit-input


### `V0.14.14` - 2019-09-30
* feat: ButtonsBar 新增 `dropdown` 样式


### `V0.14.13` - 2019-09-29
* feat: 修改侧边栏拼图图标



### `V0.14.12` - 2019-09-27
* __break__: 移除出血线组件
* feat: editorFontSize 组件的字号下拉列表新增 pt 字号
* fix: 修正 vue 文件中的 less 无法正确打包的问题



### `V0.14.11` - 2019-09-26
* feat: EditorElementBar 加入操作事件
* feat: 替换侧边栏 icon，侧边栏 icon 新增灰色 icon
* feat: 修正蒙版特效的颜色选择组件支持
* fix: 修正 mask 元素设置无特效样式的问题
* fix: 旧组件样式更新
* fix: 修正侧边菜单栏样式
* fix: 修正在极端情况下出血线显示异常
* fix: 修正字号组件的多种字体显示
* fix: 修正 element-bar 对组元素的锁定
* fix: 修正折叠面板的展开动画消失问题，优化性能
* fix: 修正 tabs 在设施 v-model 时不会将 tab 设置为激活态的问题
* build: 修改打包配置，将 `variables.less` 设置为全局变量引入，组件样式中引入的部分。



### `V0.14.10` - 2019-09-17
* feat: TextControl 组件中使用 ButtonsBar 与 Button 替代原有样式
* feat: range picker 组件的 formatter 参数默认行为与 inputFormatter 保持一致
* fix: 按钮组的中按钮 transfrom 样式移除（修复定位问题）
* fix: 修正在 px 单位下 3d 文字字号显示太多小数的问题



### `V0.14.8` - 2019-09-10
* feat: 新增左侧菜单栏 icon
* fix: 修正 DropdownFontSize 中字号单位 pt 的计算错误



### `V0.14.7` - 2019-09-09
* fix: 修正 DropdownFontSize 组件在修改字体时小数点精度错误的问题



### `V0.14.6` - 2019-09-09
* feat: EditorColors 组件新增 change 与 change-visible 事件



### `V0.14.5` - 2019-09-08
* feat: RangePicker 新增 bubble 字段



### `V0.14.4` - 2019-09-08
* feat: EditorFontSize 组件新增 change 事件
* feat: EditorEffects 组件新增 change、active、inactive 事件
* feat: DropdownButton 组件新增 active、inactive 事件


### `V0.14.3` - 2019-09-08
* feat: 在 variables.less 中新增 hover 态背景色的常量 @hover-background-color
* feat: EditorEffects 组件在切换到 3d 文字时将材质颜色应用到富文本文字上
* fix: 修正 EditorEffects 将富文本文字设置为 3d 文字后换行消失的问题



### `V0.14.2` - 2019-09-05

这里补充了 editor-ui 的 changelog，由于早期版本都没有对 changelog 进行维护，已经没有办法追溯到之前版本的修改了。

editor-ui 从 `0.13` 版本之后进行了较多的破坏性修改，重构项目目录结构、打包方式、UI 样式、组件参数等， `0.14.2` 版为改版之后的第一个较为稳定的版本。

此处将主要描述从 `0.13` 版本以来的变化

* __BREAKING__: 新版本颜色选择器的 UI 样式，传递参数与旧版本完全不同。
* feat: editor-ui 新增 vue plugin 形式的入口 eui.js
* feat: 项目将不再使用 webpack 打包发包了，输出的 dist 仅使用 babel 进行浏览器兼容性的优化处理。同时将 babel 的版本从 6.x 升级到了 7.x
* feat: 导入了 vuepress，用于创建 UI 展示页面
* feat: 新增了基础组件：容器、按钮、按钮组、折叠栏、图标、多选框、下拉按钮、弹出框、角度选择器、输入框、加载框、tooltip、标签栏组件。
* feat: 新增了复杂组件：特效下拉框、颜色面板、字体下拉框、滑块、3d文字颜色选择器
* feat: 新增了用于拖拽的 directive: `dragger`
* feat: 新增了依赖于编辑器实例的组件：背景面板、出血线、文字与图片颜色面板、特效面板、元素操作条、字体面板、字号面板、组控制面板、元素加载提示、文字控制面板、编辑器工具条
* refactor: 重构了颜色选择器、滑块组件
* fix: 修正了许多的 bug