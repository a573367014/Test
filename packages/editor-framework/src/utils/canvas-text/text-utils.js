export function getFontMetrics(font) {
    const isMac = navigator.userAgent.includes('Mac OS');
    const metrics = font.meta_data || {};
    const { ascent, descent, emSize, winAscent, winDescent } = metrics;
    const ascender = isMac ? ascent : winAscent;
    const descender = isMac ? descent : winDescent;
    if (ascender !== undefined && descender !== undefined && emSize) {
        const ascent = ascender / emSize;
        const descent = descender / emSize;
        return { ascent: Math.abs(ascent), descent: Math.abs(descent) };
    } else {
        console.warn(new Error(`没有找到${font.name}的字体信息,这会导致文字还原不准确`));
        return {
            ascent: 0.8,
            descent: 0.2,
        };
    }
}

export const createFontStyle = (content, font, options) => {
    const { fontStyle, fontVariant, fontWeight, fontSize } = Object.assign(
        {
            fontStyle: 'normal',
            fontWeight: 'normal',
            fontVariant: 'normal',
            fontSize: 12,
        },
        content,
    );

    const subsetSuffix = options.subsetSuffix;
    const fontFamily = `"${font.name + subsetSuffix}", "${font.family + subsetSuffix}", "${
        font.name
    }", "${font.family}", "Arial", "SimSun", "Sans-Serif"`;
    const styleString = `${
        fontStyle === 'null' || !fontStyle ? 'normal' : fontStyle
    } ${fontVariant} ${fontWeight || 'normal'} ${fontSize}px ${fontFamily}`;

    return styleString;
};
