

# schema

key | type |  des  | options | mark
-|-|-|-|-
title | string | 标题 | 
type | string | 类型 | input/select/radio/range/color/font/opacity
maxLength | number | 最大长度 | - | type 为input有效
min | number | 最大值 | - | type 为range/font有效
max | number | 最小值 | - | type 为range/font有效
step | number | 间隔区间  | 1 - | type 为range有效
options | `Array<object>`  | 下拉选项  | 1 | - | type 为select有效
default | any | 默认值 | 可选



## Type Description
type | des
- | - |
input | 文本框
select | 下拉框
radio | 单选
range | 滑块
color | 颜色
font | 字体
opacity | 透明度

## Type Options

### Range
key | des |  type  | default
-|-|-|-
min | 最小值 | number | 
max | 最大值 | number | 
step | 间隔 | number  | 1

### Select 
key | des |  type 
-|-|-|-
options | 选项 | `Array<object>` 

#### `Array<object>`
key | des
- | - |
text | 文本内容
value | 内容值  

### input
key | des |  type  | default
-|-|-|-
maxLength | 最大长度 | number | 20

### font
key | des |  type  | default
-|-|-|-
min | 最小值 | number | 
max | 最大值 | number | 


### color

### radio
key | des |  type  | default
-|-|-|-
block | 块面板 | array | 控制着当前子面板




## Example 

``` javascript
[
    {
        prop: 'itemLayout',
        name: '空心比例',
        type: 'select',
        options: [
            {
                label: '堆叠对比',
                value: 'stack',
            },
            {
                label: '组合对比',
                value: 'dodge',
            },
            {
                label: '分面对比',
                value: 'facet',
            },
            {
                label: '瀑布流',
                value: 'waterfall',
            },
            {
                label: '比例计算',
                value: 'percent',
            }
        ]
    },
    {
        prop: 'width',
        type: 'number',
        max: 40
    },

    {
        prop: 'content',
        type: 'input',
        maxLength: 20
    },
    {
        prop: 'fontSize',
        type: 'font',
        min: 12
    },
    {
        prop: 'color',
        type: 'color',
    }
]
```