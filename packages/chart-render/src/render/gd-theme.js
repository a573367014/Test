const DEFAULT_COLOR = '#235abe';

export const FONT_FAMILY =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",SimSun, "sans-serif"';

const Theme = {
    defaultColor: DEFAULT_COLOR, // 默认主题色
    fontFamily: FONT_FAMILY,
    defaultLegendPosition: 'bottom', // 默认图例的展示位置
    legend: {
        margin: [0, 10, 0, 10], // 图例跟四个边的坐标轴,绘图区域的间距
        legendMargin: 0, // 图例之间的间距
    },
    pixelRatio: null,
};

export default Theme;
