import { pickPropsWith } from '../index';
import { parseColorToString } from '../colors';

// 文本属性 ------------
// textAlign设置文本内容的当前对齐方式, 支持的属性：center
// textBaseline 设置在绘制文本时使用的当前文本基线, 支持的属性:top
// fontStyle 规定字体样式。可能的值：'normal', 'italic', 'oblique'
// fontSize 规定字号，以像素计
// fontFamily 规定字体系列
// fontWeight 规定字体的粗细。可能的值：'normal', 'bold', 'bolder', 'lighter', '100', '200, '300', '400','500', '600', '700', '800', '900'
// fontVariant 规定字体变体。可能的值：'normal', 'small-caps'
// lineHeight 规定行高，以像素计

// 详情查看textStyle
export const textStyleAdapterMap = {
    // 填充
    color: 'fill',

    // 字体
    fontWeight: 'fontWeight',
    fontSize: 'fontSize',
    fontFamily: 'fontFamily',
    textAlign: 'textAlign',
    textBaseline: 'textBaseline',
    lineHeight: 'lineHeight', // svg渲染不支持lineHeight
    fontStyle: 'fontStyle',
    fontVariant: 'fontVariant',

    // border
    borderWidth: 'lineWidth',
    borderColor: 'stroke',
};

export function textStyleAdapter(config) {
    const style = pickPropsWith(config, textStyleAdapterMap);

    /**
     * lineHeight 为相对与字体的比例
     * 转换为具体的数值
     */
    if (style.lineHeight !== undefined) {
        style.lineHeight = style.fontSize * Number(style.lineHeight);
    }

    // 支持渐变色
    style.fill = parseColorToString(style.fill);
    style.stroke = parseColorToString(style.stroke);

    return style;
}
