# 组件申请表

填写模版：

```
## 组件名
### 组件描述
### 组件场景
### 设计稿链接
### 设计方案 (可选)

```

## GeStyleBackground

### 组件描述

提供背景预览与背景配置

### 组件场景
- 需要配置画布背景

### 设计稿链接

https://www.figma.com/file/EiH0WC37gqZny1alDTkiw0/Gaoding---Editor?node-id=759%3A2706

## GeSliderList

### 组件描述

滑杆组合，支持单个、多个滑杆控制场景

### 组件场景

- 字体样式调节
- 图片样式调节
- 等涉及单个、多个属性滑杆调节场景

### 设计稿链接

https://www.figma.com/file/EiH0WC37gqZny1alDTkiw0/Gaoding---Editor?node-id=337%3A6139

组件规划文档：https://doc.huanleguang.com/pages/viewpage.action?pageId=183865930

### 设计方案 (可选)

props:

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
| :--- | :------------ | :----------- | :----- | :----- |
| list | 滑杆数据 list | SliderItem[] | - | - |

event:

| 参数 | 说明 | 类型 |
| :------------- | :--------- | :------------------------ |
| change | slider 改变回调 | (val, index, list) => void |

类型说明:
SliderItem

| 参数  | 说明                 | 类型   | 可选值 | 默认值 |
| :---- | :------------------- | :----- | :----- | :----- |
| label | 滑杆功能描述字段     | String | true   | ''     |
| key   | 唯一标识符           | String | -      | ''     |
| value | 滑杆当前值           | Number | -      | 0      |
| max   | 最大值               | Number | -      | 100    |
| min   | 最小值               | Number | true   | 0      |
| step  | 步值，滑动一次的大小 | Number | true   | 1      |


## GeStylePreview

### 组件描述

样式展示预览、描述预览的通用组件，默认为添加样式展示

### 组件场景

- 字体样式属性
- 背景样式属性
- 表格样式属性
- 等预览性组件

### 设计稿链接

https://www.figma.com/file/EiH0WC37gqZny1alDTkiw0/Gaoding---Editor?node-id=759%3A2706

组件规划文档：https://doc.huanleguang.com/pages/viewpage.action?pageId=183865930

### 设计方案 (可选)

| 参数    | 说明       | 类型   | 可选值 | 默认值 |
| :------ | :--------- | :----- | :----- | :----- |
| preview | 预览图/css | String | -      | -      |
| title   | 描述       | String | -      | -      |