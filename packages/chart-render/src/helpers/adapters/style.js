import { parseColorToString } from '../colors';

// 样式 ------------
// fill 描述颜色和样式的属性。
// fillStyle 同 fill
// fillOpacity 用于设置图形填充颜色的透明度。
// stroke 描述画笔（绘制图形）颜色或者样式的属性。默认值是 #000 (black)。
// strokeStyle 同 stroke
// strokeOpacity 用于设置边颜色的透明度。
// shadowColor 描述阴影颜色的属性，参见 MDN。
// shadowBlur 描述模糊效果程度的属性； 它既不对应像素值也不受当前转换矩阵的影响。 默认值是 0，参见 MDN。
// shadowOffsetX 描述阴影水平偏移距离的属性，参见 MDN。
// shadowOffsetY 描述阴影垂直偏移距离的属性，参见 MDN。
// opacity 设置图形和图片透明度的属性。 数值的范围从 0.0 （完全透明）到 1.0 （完全不透明）。

export function clipStyleAdapter(config) {
    const {
        autoFillColor = false,
        clipShapeColor,
        clipShapeOpacity,
        clipShapeBorderColor,
        clipShapeBorderWidth,
        color,
    } = config;

    return {
        // 自动映射颜色
        fill: autoFillColor ? color : parseColorToString(clipShapeColor), // 填充颜色
        fillOpacity: clipShapeOpacity, // 填充透明度
        stroke: parseColorToString(clipShapeBorderColor), // 描边颜色
        lineWidth: clipShapeBorderWidth, // 宽度
    };
}
