
# 🌈 chartRender 基于Antv/g2 胶水层说明


## 关于Antv/g2, 为什么使用G2
TODO
## 关于数据，维度字段说明
TODO

## 目前所有支持的图表类型

1. [Pie => 饼图]( ###-Pie)
2. [Ring => 环图]( ###-Ring)
3. [Rose => 玫瑰图]( ###-Rose)
4. [Column => 普通柱状图]( ###-Column)
5. [Interval => 分组柱状图]( ###-Interval)
6. [StackInterval => 堆叠柱状图]( ###-StackInterval)
7. [ColumnBar => 普通条形图]( ###-ColumnBar)
8. [Bar => 分组条形图]( ###-Bar)
9. [StackBar => 堆叠条形图]( ###-StackBar)
10. [Area => 普通面积图]( ###-Area)
11. [StackArea => 堆叠面积图]( ###-StackArea)
12. [Line => 折线图]( ###-Line)
13. [Point => 散点图]( ###-Point)
14. [Radar => 雷达图]( ###-Radar)
15. [Funnel => 漏斗图]( ###-Funnel)
16. [LiquidGauge => 水波图]( ###-LiquidGauge)
17. [RadialBar => 玉环图]( ###-RadialBar)
18. [WaterFall => 瀑布图]( ###-WaterFall)



# 图表model字段说明

## 组成部分(TODO: 详细说明)
- 基础配置，图表宽高、颜色、图表容器
- 标题 title
- 数据维度 chartData / metrics
- 图例 legends
- 数据显示 label
- 坐标轴 axis
- [图形配置 Settings]( ##-Settings )


## Model
```javascript
/**
 * 图表属性
 */
"ChartModel":{

    // 列数据
    chartData: [
        ['水果', '年份', '销量'],
        ['苹果', 2013, 200],
        ['苹果', 2014, 300],
        ['苹果', 2015, 400]
    ],


    // 数据描述维度
    metrics: {
        xField: '水果', // x轴
        yField: '销量', // y轴
        colorDimension: '年份' // 颜色轴
    }
    metrics: {
        xField: {
            name: '水果',
            min: 0,
            max: 120,
            type: 'value' // date / 

        }
        
    }
    // padding: [0, 0, 0, 0],


    // 宽高
    width: 200,
    height: 333,
    /**
     * 自定义颜色集
     */

    // 0, 多色
    // 1, 单色
    // 2, 区间色
    colorType: 0, // 默认多色 ,

    // 1. 普通色卡
    // 24位色卡
    colors: [],
    // 2. todo: 渐变能力



    // 图表类型声明，详情请查看文档下方的内容(目前支持的图表类型)
    chartType: 'Pie', 
    
    // 图表类型 的特殊配置(eg:pie 类型),详情请查看文档下方的内容(Settings)
    settings: {
         /**
         * 起始弧度
         * Number 取值范围 [ 0 , 360 ]
         * default: 0
         */
        startAngle: 0,

        /**
         * 结束弧度
         * Number 取值范围 [ 0 , 360 ]
         * default: 360
         */
        endAngle: 360,

        /**
         * 半径百分比（%）
         * Number 取值范围 [ 0 , 100 ]
         * default: 0
         */
        radius: 1,
    },


    


    // 标题
    chartTitle: {
        // 是否启用
        enable: true,

        content: '苹果大中华地区营收（单位：亿美元）', // 名称

        // 标题颜色
        color: '#fffffff', 

        /**
         * 字体粗细
         * Number
         * default: 600
         */
        fontWeight: 600, // 加粗

        /**
         * 字体大小
         * Number
         * default: 16
         */
        fontSize: 16,

        /**
         * 字体对齐方式
         * String
         * default: normal
         */
        fontStyle: 'normal',

        /**
         * 小型大写字母的字体显示文本
         * String
         * default: normal
         */
        fontVariant: 'normal',

        // 使用字体
        fontFamily: '',

        /**
         * 标题位置
         * String { top | bottom }
         * default: top
         */
        position: 'top', 

        /**
         * 垂直方向距离
         * Number
         * default: 20
         */
        offsetY: 20,

        /**
         * 每一行的间距
         * Number
         * default: 0
         */
        spaceing: 0,

         /**
         * 距离顶部空间
         * Number
         * default: 5
         */
        offsetTop: 5,
    },


    


    // 图例
    legends: {
         /**
         * 开关，是否展示
         * Boolean
         * default: true
         */
        enable: true,

        /**
         * 位置
         * String { top | bottom }
         * default: bottom
         */
        position: 'bottom',

        /**
         * 垂直位置偏移量
         * Number
         * default: 25
         */
        offset: 25, 


        // 图形相关
        /**
         * 图形透明度
         * Number 取值范围 [ 0 , 1 ]
         * default: 0.8
         */
        opacity: 0.8,

        /**
         * 宽度比例，基于文字大小
         * Number 取值范围 [ 0 , 3 ]
         * default: 2.22
         */
        shapeWidthRatio: 2.22,

         /**
         * 高度比例，基于文字大小
         * Number 取值范围 [ 0 , 3 ]
         * default: 1.22
         */
        shapeHeightRatio: 1.22,

        /**
         * 图形距离文字前间隔
         * Number 取值范围 [ 0 , 3 ]
         * default: 0.56
         */
        shapeToTextWidthRatio: 0.56,

        /**
         * 后间隔， 文字距离下一个图形的间隔
         * Number 取值范围 [ 0 , 3 ]
         * default: 1.67
         */
        textToNextShapeWidthRatio: 1.67,


        // style
        // 颜色
        color: '#000000',

        /**
         * 字体粗细
         * Number
         * default: 600
         */
        fontWeight: 600,

        /**
         * 字体大小
         * Number
         * default: 16
         */
        fontSize: 16,
    },


    // 数据文本
    label: {
        /**
         * 开关，是否展示
         * Boolean
         * default: false
         */
        enable: false,

        /**
         * 偏移量，不同类型的图offset相对偏移位置不同
         * Number
         * default: 0
         */
        offset: 0,

        // 颜色
        color: '#000000',

        /**
         * 字体粗细
         * Number
         * default: 400
         */
        fontWeight: 400,

         /**
         * 字体大小
         * Number
         * default: 16
         */
        fontSize: 16,

        /**
         * 基线对齐方式
         * String { top | middle | bottom }
         * default: middle
         */
        textBaseline: 'middle',

         /**
         * 文本对齐方式
         * String { top | center | bottom }
         * default: center
         */
        textAlgin: 'center'
    },


    // 坐标系
    xAxis: {
       /**
         * 开关，是否展示
         * Boolean
         * default: false
         */
        enable: true,

        // 决定坐标轴的数值类型刻度度量的范围。
        // 如一个图表设置了最大值和最小值，那么该图表的数字度量范围就会被统一。
        // 后期规划，在设计师设置了最大值和最小值，在用户编辑数据的时候对数据进行校验，填写数值不能超过最大值最小值。
        // 设计师谨慎使用。
        // 最大值，度量的最大值
        max: null || Number,
        
        // 最小值，度量的最小值
        min: null || Number, 


        /**
         * 决定坐标轴的渲染区域。
         * 比如：
         * 横坐标的整体长度为 100px。
         * 渲染的时候，会默认认为 0px - 100px 为整体1，从而分布渲染。
         * 如果设置了 startRange = 10，endRange = 90， 会认为 10px - 90px 为整体 1， 去分布渲染，
         * 0px-10px, 90px - 100px 区域会留空。
         * 
         * 建议在极坐标系下不设置
         */
        // 开始区域，取值区间；【 0，1 】
        startRange: null || 0 ~ 1,

        // 结束区域，取值区间；【 0，1 】
        endRange: null || 0 ~ 1,



        // 坐标轴标题
        title: {
            /**
             * 开关，是否展示
             * Boolean
             * default: true
             */
            enable: true,

            // 文本的内容
            text: 'X轴坐标名称', 

            /**
             * 文本的偏移量
             * Number
             * default: 30
             */
            offset: 30,

            /**
             * 字体大小
             * Number
             * default: 12
             */
            fontSize: 12,

            /**
             * 文本对齐方式
             * String 可取值为： start | center | end
             * default: center
             */
            textAlign: 'center',

            // 文本的颜色
            color: '#333333',

            /**
             * 字体粗细
             * Number
             * default: 12
             */
            fontWeight: 500
        },
        // 坐标轴刻度名
        label: {
            /**
             * 开关，是否展示
             * Boolean
             * default: true
             */
            enable: true,

            /**
             * 文本的偏移量
             * Number
             * default: 12
             */
            offset: 12,

            /**
             * 文本的旋转角度
             * Number 取值区间[ 0, 360 ]
             * default: 0
             */
            rotate: 30,

            // 文本的颜色
            textColor: 'red',

            /**
             * 文本大小
             * Number
             * default: 10
             */
            fontSize: 10,

            /**
             * 字体粗细
             * Number
             * default: 12
             */
            fontWeight: 400,
            /**
             * 基线对齐方式
             * String { top | middle | bottom }
             * default: middle
             */
            textBaseline: 'top',

            /**
             * 文本对齐方式
             * String { top | center | bottom }
             * default: center
             */
            textAlgin: 'center'
        },


        // 坐标轴线
        line: {
          /**
             * 开关，是否展示
             * Boolean
             * default: true
             */
            enable: true,

            // 线的颜色
            color: '#888888ff',

             /**
             * 线的透明度
             * Number 取值范围[ 0, 1 ]
             * default: 1
             */
            opacity: 1, 

             /**
             * 线的宽度
             * Number
             * default: 1
             */
            lineWidth: 1,

            /**
             * 虚线配置
             * Array
             * default: [0, 0]实线
             */
            lineDash: [0, 0]
        },


        // 坐标轴刻度
        tickLine: {
          /**
             * 开关，是否展示
             * Boolean
             * default: true
             */
            enable: true,

            // 刻度个数
            count: null, 

            // 线颜色
            color: '#000000ff',

            /**
             * 透明度
             * Number 取值范围[ 0, 1 ]
             * default: 1
             */
            opacity: 1,

            /**
             * 刻度的长度
             * Number
             * default: 2
             */
            lineHeight: 2,

            /**
             * 刻度的宽度
             * Number
             * default: 1
             */
            lineWidth: 1,

            /**
             * 虚线配置
             * Array
             * default: [0, 0]实线
             */
            lineDash: [0, 0]
        },


        // 坐标轴子刻度
        subTickLine: {
          /**
             * 开关，是否展示
             * Boolean
             * default: false
             */
            enable: false,

            /**
             * 子刻度线数量
             * Number
             * default: 1
             */
            count: 1,

            // 子刻度颜色
            color: '#000000ff',

            /**
             * 透明度
             * Number 取值范围[ 0, 1 ]
             * default: 1
             */
            opacity: 1,

            /**
             * 子刻度的长度
             * Number
             * default: 2
             */
            lineHeight: 2,

            /**
             * 子刻度的宽度
             * Number
             * default: 1
             */
            lineWidth: 1,

             /**
             * 虚线配置
             * Array
             * default: [0, 0]实线
             */
            lineDash: [0, 0]
        },
        // 坐标轴网格线
        grid: {
            /**
             * 开关，是否展示
             * Boolean
             * default: true
             */
            enable: true,

            // 声明网格的类型,line 表示线,  polygon 表示矩形框, default 表示默认，默认会根据坐标轴进行适配
            type: 'default',

            /**
             * 是否居中，网格顶点从两个刻度中间开始，默认从刻度点开始
             * Boolean
             * default: true
             */
            isAlign: true,

            /**
             * 是否隐藏第一条线，跟坐标轴线重合
             * Boolean
             * default: true
             */
            hideFirstLine: true,

            /**
             * 是否隐藏最后一条
             * Boolean
             * default: true
             */
            hideLastLine: true,

            /**
             * 网格填充颜色
             * 当网格类型 type 为 polygon/line 时
             * 使用 alternateColor 为网格设置交替的颜色，指定一个值则先渲染奇数层，两个值则交替渲染
             * 注意：采用有透明值的颜色（rgba/hexa）格式，否则坐标轴会遮挡
             */
            alternateColor: ['#ccc','#ddd'],

            // 网格线颜色
             color: '#000000ff',
          
            /**
             * 透明度
             * Number 取值范围[ 0, 1 ]
             * default: 1
             */
            opacity: 1,

            /**
             * 子刻度的宽度
             * Number
             * default: 1
             */
            lineWidth: 1,
            
            /**
             * 虚线配置
             * Array
             * default: [4, 4]
             */
            lineDash: [4, 4]
        }
    },
}

```

## Settings

### Pie

字段 | 类型 | 默认值 | 描述
-|-|-|-
startAngle | Number | 0 | 起始角度
allAngle | Number | 360 |  整圆角度
radius | Number | 100 |  半径百分比(%)


### Ring

字段 | 类型 | 默认值 | 描述
-|-|-|-
startAngle | Number | 0 | 起始角度
allAngle | Number | 360 |  整圆角度
radius | Number | 100 |  半径百分比(%)
innerRadius | Number | 0 |  空心（内半径）比例(%)
distance | Number | 1 |  间隔
headRadius | Number | 100 |  头部半径
tailRadius | Number | 100 |  尾部半径


### Ring

字段 | 类型 | 默认值 | 描述
-|-|-|-
startAngle | Number | 0 | 起始角度
allAngle | Number | 360 |  整圆角度
radius | Number | 100 |  半径百分比(%)
innerRadius | Number | 0 |  空心（内半径）比例(%)
distance | Number | 1 |  间隔


### Column |  Interval | ColumnBar | Bar

字段 | 类型 | 默认值 | 描述
-|-|-|-
itemTopRadiusRatio | Number | 100 | 顶部圆角比例
itemBottomRadiusRatio | Number | 0 |  底部圆角比例
itemWidthRatio | Number | 65 |  柱子宽度比例
itemMaxWidth | Number | 70 |  柱子最大宽度
itemMarginRatio | Number | 0 |  柱子间距比例
itemborderWidth | Number | 1 |  柱子边框宽度
itemborderColor | String | #ccc |  柱子边框颜色


### StackInterval | StackBar

字段 | 类型 | 默认值 | 描述
-|-|-|-
itemTopRadiusRatio | Number | 100 | 顶部圆角比例
itemBottomRadiusRatio | Number | 0 |  底部圆角比例
itemWidthRatio | Number | 65 |  柱子宽度比例
itemMaxWidth | Number | 70 |  柱子最大宽度
itemMarginRatio | Number | 0 |  柱子间距比例
itemborderWidth | Number | 1 |  柱子边框宽度
itemborderColor | String | #ccc |  柱子边框颜色
isTransformPercent | Boolean | false |  转换百分比


### Area

字段 | 类型 | 默认值 | 描述 | 选项
-|-|-|-|-
enablePoint | Boolean | false |  增加辅助点
pointShapeType | String | circle | 辅助点类型 | circle（实心圆），hollowCircle（空心圆）
pointRadius | Number | 3 |  辅助点半径
pointOpaticy | Number | 0.8 |  辅助点透明度
pointBorderWidth | Number | 2 |  辅助点边框粗细
pointBorderColor | String | #ccc |  辅助点边框颜色
pointColor | String | #ccc |  点填充颜色
areaOpaticy | Number | 0.8 |  面积透明度
shapeType | String | area |  折线类型 | area（直角类型），smooth（曲面类型）
enableLine | Boolean | true |  增加折线配置
lineWidth | Number | 3 |  折线宽度
lineOpaticy | Number | 0.8 |  折线透明度


### StackArea

字段 | 类型 | 默认值 | 描述 | 选项
-|-|-|-|-
enablePoint | Boolean | false |  增加辅助点
pointShapeType | String | circle | 辅助点类型 | circle（实心圆），hollowCircle（空心圆）
pointRadius | Number | 3 |  辅助点半径
pointOpaticy | Number | 0.8 |  辅助点透明度
pointBorderWidth | Number | 2 |  辅助点边框粗细
pointBorderColor | String | #ccc |  辅助点边框颜色
pointColor | String | #ccc |  点填充颜色
areaOpaticy | Number | 0.8 |  面积透明度
shapeType | String | area |  折线类型 | area（直角类型），smooth（曲面类型）
enableLine | Boolean | true |  增加折线
lineWidth | Number | 3 |  折线宽度
lineOpaticy | Number | 0.8 |  折线透明度
isTransformPercent | Boolean | false |  转换百分比


##3 Line

字段 | 类型 | 默认值 | 描述 | 选项
-|-|-|-|-
pointType | String | minMax | 辅助点类型 | full（所有点），minMax（最大点/最小点）
pointRadius | Number | 3 |  辅助点半径
pointOpaticy | Number | 0.8 |  辅助点透明度
pointBorderWidth | Number | 2 |  辅助点边框粗细
pointBorderColor | String | #ccc |  辅助点边框颜色
lineType | String | line |  折线类型 | line（折线），smooth（曲线），hv（阶梯线-01），hvh（阶梯线-02），vh（阶梯线-03），vhv（阶梯线-04）
lineWidth | Number | 3 |  折线宽度


### Point

字段 | 类型 | 默认值 | 描述 | 选项
-|-|-|-|-
pointType | String | circle | 辅助点类型 | circle（实心圆），hollowCircle（空心圆）
radius | Number | 3 |  散点半径
borderWidth | Number | 0 |  散点边框粗细
borderColor | String | #ccc |  散点实心边框颜色


### Radar

字段 | 类型 | 默认值 | 描述 | 选项
-|-|-|-|-
enablePoint | Boolean | false |  增加辅助点
pointShapeType | String | circle | 辅助点类型 | circle（实心圆），hollowCircle（空心圆）
pointRadius | Number | 3 |  辅助点半径
pointOpaticy | Number | 0.8 |  辅助点透明度
pointBorderWidth | Number | 2 |  辅助点边框粗细
pointBorderColor | String | #ccc |  辅助点边框颜色
pointFillColor | String | #ccc |  点填充颜色
shapeType | String | area |  折线类型 | area（直角类型），smooth（曲面类型）
lineWidth | Number | 3 |  折线宽度
enableArea | Boolean | false |  增加面积
areaOpaticy | Number | 0.8 |  面积透明度






### 目录结构
```
|-- src
    |-- gd-theme.js
    |-- index.js
    |-- adapters （适配）
    |   |-- text-style.js
    |-- charts （图表类型）
    |   |-- base-actions.js 
    |   |-- base-chart.js
    |   |-- index.js
    |   |-- readme.md
    |   |-- area
    |   |   |-- index.js
    |   |   |-- schema.js
    |   |-- bar
    |   |-- column
    |   |-- ...
    |-- controller
    |   |-- base-dapter.js
    |   |-- axis
    |   |   |-- axis.js
    |   |   |-- x-axis.js
    |   |   |-- y-axis.js
    |   |   |-- assemblys
    |   |       |-- grid.js
    |   |       |-- label.js
    |   |       |-- line.js
    |   |       |-- scale.js
    |   |       |-- sub-tick-line.js
    |   |       |-- tick-line.js
    |   |       |-- title.js
    |   |-- data
    |   |   |-- resolve-data.js
    |   |   |-- instructs
    |   |       |-- correct-one-dimensional.js
    |   |       |-- ...
    |   |-- label
    |   |-- legend
    |-- helpers
    |   |-- g2-helper.js
    |   |-- math.js
    |   |-- decorator
    |       |-- precent-decorator.js
    |       |-- ...
    |-- render
        |-- chart-title.js
        |-- create-chart.js
        |-- shape
            |-- drawLabel.js
            |-- more
```



## Settings Schema

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



### Type Description
type | des
- | - |
input | 文本框
select | 下拉框
radio | 单选
range | 滑块
color | 颜色
font | 字体
opacity | 透明度

### Type Options

#### Range
key | des |  type  | default
-|-|-|-
min | 最小值 | number | 
max | 最大值 | number | 
step | 间隔 | number  | 1

#### Select 
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


### Example 

``` javascript
[
    {
        prop: 'itemLayout',
        name: '分组方式',
        type: 'select',
        options: [
            {
                text: '堆叠对比',
                value: 'stack',
            },
            {
                text: '组合对比',
                value: 'dodge',
            },
            {
                text: '分面对比',
                value: 'facet',
            },
            {
                text: '瀑布流',
                value: 'waterfall',
            },
            {
                text: '比例计算',
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




// log （extends linear） 基数
//  base: {number}, // log 的基数，默认是 2
// pow
// exponent: {number}, // 指数，默认是 2
// time
// mask: {string}, // 指定时间的显示格式，默认：'YYYY-MM-DD'
// cat
// values: {array}
// timeCat
// mask

### Scale 度量
type | des |
-|-|-|-
linear | 数值连续类型
cat | 文本类型

#### linear
porp | des | default | 是否支持
-|-| - | 
min | 最小值 | null | 支持
max | 最大值 | null | 支持
minLimit| 最大值 | null | 不开放
maxLimit| 最大值 | null | 不开放

tickCount| 最大值 | null | 不开放 在坐标轴开放
range| 最大值 | null | 不开放，在坐标轴开放
alias| 最大值 | null | 不开放
tickInterval| 最大值 | null | 不开放
nice | 用于优化数值范围，使绘制的坐标轴刻度线均匀分布。例如原始数据的范围为 [3, 97]，如果 nice 为 | true | 不开放
