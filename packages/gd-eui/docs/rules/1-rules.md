# 编写规范

## 前言

当要开始为 gd-eui 编写新当组件当时候，按最初的设想应当往以下四个纬度去划分组件类型。

- 基础组件
- 高级组件
- 布局容器
- 模块组件

## 基础组件

组件行为单一，遵守开放封闭原则只做一种类型的事件行为，如 Button, Slider,Icon, ... 这些组建的行为都只针对某一种特定功能
可与其他组建组合使用。

## 高级组件

一些基础组件的更复杂的展示与交互，例如瀑布列表，但功能单一的。

## 布局容器

用于布局的容器组件，方便快速搭建页面的基本结构， 内部内容可自由填充，可以想象成相当于一个包装盒来约束里面容纳的东西。

## 模块组件

由多个其他类型的组件组合在一起，实现某一特定模块的组件。 如：文字样式模块是由按钮，加颜色选择器， 滑杆组合而成。

## 其他

### 命名规范

统一以 ge(gd-eui 简写)开头包括样式，文件命名有多个单词组成时候以 `-`分隔，如：`aside-menu`。

### 文档编写

#### 代码自动插入

在 components 的目录下按分类创建相应的 md 文件，如需嵌入代码可以用插件 code-box, 在 MD 文档任意位置插入`<code-box name="xxxx"></code-box>` ,接着在 examples 文件下新建相对应组件文件即可,无需其他配置演示代码会自动插入对应位置。 ⚠️ 注意!:组件名称需和 code-box 的 name 属性一致。

#### 属性自动生成

在文档底部插入 `:::gd-eui-api xx/index.vue`, 对应组件路径，如 slider 组件位于 src/components/base/slider/slider.vue, 我们只需要写`:::gd-eui-api base/slider/slider.vue` 根路径已经默认配置为 src/components。
⚠️ 注意！当我们使用自动生成属性时须遵守以下规范

- props 属性开头需写注释

```js
props {
    // 绑定值
    value: {
        type: Number,
        default: 0
    }
}
```

生成后的产物
| 参数 | 说明 | 类型 | 可选值 | 默认值 |
| ------------- | ---------------------- | ------- | ------ | ------ |
| value | 绑定值 | Number | — | 0 |

- 当有自定义类型时, OptionalValue 为可选值，以冒号分割， Type 为自定义类型以冒号分割, 可选值不能以`｜`分割，会造成生成后的数据有问题。
  自定义类型最好加上\`\` 符号， 否则会造成编译错误。

```ts
        /**
         * 上传状态
         * OptionalValue: uploading,uploadError
         * Type: `String as PropType<UploadStatus>`
         */
        uploadStatus: {
            type: String as PropType<UploadStatus>,
            default: '',
        },
```

生成后的产物
| 参数 | 说明 | 类型 | 可选值 | 默认值 |
| ------------- | ---------------------- | ------- | ------ | ------ |
| uploadStatus | 上传状态 | `String as PropType<UploadStatus>` | uploading,uploadError | |

- event 事件开头写注释 @arg 后代表参数，第一行代表描述

```js
function handleCheckedChange(e) {
            // 选择态变化
            // @arg event
            emit('checkChange', e);
        }
```

生成后的产物
| 事件名 | 说明 | 回调参数 |
| ------------- | ---------------------- | ------- |
| checkChange | 选择态变化 | event |

- 插槽属性开头写注释

```html
 <!-- 图片弹层主内容插槽 -->
<slot name="popoverContent" />
```

生成后的产物
| 插槽名 | 说明 | 默认模板 |
| ------------- | ---------------------- | ------- |
| popoverContent | 图片弹层主内容插槽 | |

### 如何开发？

- 组件技术栈采用的是 ts + [vue-demi](https://github.com/vueuse/vue-demi) 方式进行书写, vue-demi 是一个 vue2 按 vu3 方式书写的过渡方案，编写组件的时候可以愉快的使用 vue3 composition-api 进行编写，当然还是会有些坑，详见 [@vue/composition-api](https://www.npmjs.com/package/@vue/composition-api)。

- 首先把文档运行起来执行命令

```sh
$ yarn docs:dev
```

- 根据规范定义在 `src/components` 目录下对应的分类文件下创建你的组件, 样式文件统一存放在 `src/style` 下,一个组件对应一个样式文件，样式统一以 `ge` 开头。

- 在文件夹 `docs/components`下根据分类创建对应的组件文档， 并在`docs/examples下` 根据分类创建对应的代码示例，这样在开发的同时可以顺便把代码示例,文档雏形给完成了。

- 开发完成组件后别忘了编写单元测试，在项目的`tests/unit`文件夹下新建相应的文件，编写完成后运行 `yarn test`。

- 当组件完成开发要进行发布的时候直接运行脚本

```sh
$ yarn build:all # 会将文档和包一起更新到远端
```
