import { pickPropsWith } from '../index';
import { parseColorToString } from '../colors';

// 线条 ------------
// lineCap Canvas 2D API 指定如何绘制每一条线段末端的属性。有 3 个可能的值，分别是：butt, round and square。默认值是 butt，参见 MDN.
// lineJoin Canvas 2D API 用来设置 2 个长度不为 0 的相连部分（线段，圆弧，曲线）如何连接在一起的属性（长度为 0 的变形部分，其指定的末端和控制点在同一位置，会被忽略），参见 MDN.
// lineWidth Canvas 2D API 设置线段厚度的属性（即线段的宽度）。当获取属性值时，它可以返回当前的值（默认值是 1.0 ）。 当给属性赋值时， 0、 负数、 Infinity 和 NaN 都会被忽略；除此之外，都会被赋予一个新值，参见 MDN.
// miterLimit Canvas 2D API 设置斜接面限制比例的属性。 当获取属性值时， 会返回当前的值（默认值是 10.0 ）。当给属性赋值时， 0、负数、 Infinity 和 NaN 都会被忽略；除此之外都会被赋予一个新值。，参见 MDN.
// lineDash 设置线的虚线样式，可以指定一个数组。一组描述交替绘制线段和间距（坐标空间单位）长度的数字。 如果数组元素的数量是奇数， 数组的元素会被复制并重复。例如， [5, 15, 25] 会变成 [5, 15, 25, 5, 15, 25]。这个属性取决于浏览器是否支持 setLineDash() 函数，详情参考 setLineDash。

const lineStyle = {
    color: 'stroke',
    opacity: 'strokeOpacity', // 刻度线颜色的透明度
    lineWidth: 'lineWidth', // 刻度线宽
    lineDash: 'lineDash', // 设置虚线样式
    lineCap: 'lineCap',
    lineJoin: 'lineJoin',
    // miterLimit
};

const tickLineStyle = {
    ...lineStyle,
    lineHeight: 'length', // 刻度线的长度，可以为负值（表示反方向渲染
};

export function lineStyleAdapter(config) {
    return lineAdapter(config, lineStyle);
}

export function tickLineStyleAdapter(config) {
    return lineAdapter(config, tickLineStyle);
}

function lineAdapter(config, styleAdapter) {
    const style = pickPropsWith(config, styleAdapter);
    // 转换颜色
    style.stroke = parseColorToString(style.stroke);
    // 返回
    return style;
}
