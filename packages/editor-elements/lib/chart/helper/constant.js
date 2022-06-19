/**
 * chart关键的model字段
 */
export var CHART_MODEL_MAIN_PROP = ['type', // 类型
// 数据相关 -------
'chartType', // 图表类型
'chartData', // 数据
'metrics', // 维度
'scales', // 样式相关 -------
'padding', // padding
'width', // 宽度
'height', // 高度
'colorType', // 颜色类型
'colors', // 颜色
'shapeOpacity', // TODO: 废弃图形透明度
// 组件相关 -------
'chartTitle', // 标题
'legend', // 图例
'label', // 数据显示
'xAxis', // X坐标轴
'yAxis', // y坐标轴
'y2Axis', // y2坐标轴
// 自定义配置
'settings', // 配置
'dynamicContext' // 动态图表配置
];
var axisProps = ['enbale', 'title.enable', 'title.text', 'title.fontSize', 'title.color', 'label.enable', 'label.fontSize', 'label.color', 'label.textAlign'];

var createProps = function createProps(prefix, props) {
  if (props.length === 0) return prefix;
  return props.map(function (i) {
    return prefix + i;
  });
};
/**
 * 注意：只配置当前用户面板开放的字段
 * TODO: 未来其他字段开放后需要增加
 */


export var SWITCH_PROP = ['chartTitle.enable', 'chartTitle.text', 'chartTitle.position', 'chartTitle.fontSize', 'chartTitle.color', // 'chartTitle.fontWeight',
// 'chartTitle.fontFamily',
// 'chartTitle.offset'
// 图例
'legend.enable', 'legend.position', 'legend.fontSize', 'legend.color', // 数据显示
'label.enable', 'label.fontSize', 'label.color'].concat(createProps('xAxis', axisProps), createProps('yAxis', axisProps), createProps('y2Axis', axisProps), [// 'xAxis.enbale',
// 'xAxis.title.enable',
// 'xAxis.title.text',
// 'xAxis.title.fontSize',
// 'xAxis.title.color',
// 'xAxis.label.enable',
// 'xAxis.label.fontSize',
// 'xAxis.label.color',
// 'xAxis.label.textAlign',
// // y坐标轴
// 'yAxis.enbale',
// 'yAxis.title.enable',
// 'yAxis.title.text',
// 'yAxis.title.fontSize',
// 'yAxis.title.color',
// 'yAxis.label.enable',
// 'yAxis.label.fontSize',
// 'yAxis.label.color',
// 'yAxis.label.textAlign',
// mono
//
'colorType', // 图表类型
'colors', // 颜色
'shapeOpacity', // 图形透明度
'lockData', // 是否锁住数据编辑
'chartData', // 数据
'scales', 'metrics', 'animations' // 动画相关数据
]);