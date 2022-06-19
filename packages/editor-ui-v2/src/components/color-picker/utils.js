import cloneDeep from 'lodash/cloneDeep';
import tinycolor from 'tinycolor2';
import uniqWith from 'lodash/uniqWith';
import { isPureColor, isGradientColor } from '../../utils/color';

// 获取文档所有颜色
export function getDocColors(editor) {
    const colors = [];
    const { layouts = [], global } = editor;

    const globalColor = global.layout?.backgroundColor;
    if (globalColor) colors.push(globalColor);

    let round = 1;
    while (round) {
        let validRound = false;
        layouts.forEach((layout) => {
            const len = layout.elements.length;
            const element = layout.elements[len - round];
            if (element) {
                validRound = true;
                findAllElementWithGroup(element, colors);
            } else if (len - round === -1) {
                if (layout.backgroundGradient) {
                    colors.push(layout.backgroundGradient);
                } else {
                    layout.backgroundColor && colors.push(layout.backgroundColor);
                }
            }
        });
        validRound ? round++ : (round = 0);
    }
    return colors;
}

function findAllElementWithGroup(element, colors) {
    if (element.type === 'group' && element.elements.length) {
        element.elements.forEach((elm) => {
            findAllElementWithGroup(elm, colors);
        });
    } else {
        getElementColors(element).forEach((color) => colors.push(color));
    }
}

// 遍历元素颜色
function getElementColors(element) {
    const colors = [];
    const {
        mainColor,
        color,
        fill,
        stroke,
        textEffects = [],
        imageEffects = [],
        shadows = [],
        layers = [],
        metaInfo,
    } = element;
    color && isEmptyTextFillingEffect(textEffects) && colors.push(color);
    mainColor && colors.push(mainColor);
    // 图形
    fill && colors.push(fill);
    stroke && colors.push(stroke);
    // svg、图表
    if (element.colors && element.colors.length) {
        const len = element.colorScalesLenght || element.colors.length;
        element.colors
            .slice(0, len)
            .forEach((color) => colors.push(color.gradient || color.color || color));
    }
    // chart
    if (element.type === 'chart') {
        element?.title?.color && colors.push(element.title.color);
        element?.xAxis?.title?.color && colors.push(element.xAxis.title.color);
        element?.xAxis?.label?.color && colors.push(element.xAxis.label.color);
        element?.label?.color && colors.push(element.label.color);
        element?.legend?.color && colors.push(element.legend.color);
    }
    // table
    if (element.type === 'table') {
        return element.getColors();
    }
    // qrcode
    metaInfo?.qrcode?.frontColor && colors.push(metaInfo?.qrcode?.frontColor);
    metaInfo?.qrcode?.backColor && colors.push(metaInfo?.qrcode?.backColor);
    // effects
    [...textEffects, ...imageEffects].forEach((effect) => {
        if (!effect.enable) return;

        if (effect.filling && effect.filling.enable) {
            if (effect.filling.type === 0 || effect.filling.type === 'color') {
                colors.push(effect.filling.color);
            } else if (
                (effect.filling.type === 2 || effect.filling.type === 'gradient') &&
                effect.filling.gradient.enable !== false
            ) {
                const gradient = cloneDeep(effect.filling.gradient);
                colors.push(gradient);
            }
        }
        if (effect.stroke && effect.stroke.enable) {
            colors.push(effect.stroke.color);
        }
        if (effect.insetShadow && effect.insetShadow.enable) {
            colors.push(effect.insetShadow.color);
        }
    });
    shadows.forEach((shadow) => {
        if (shadow.enable && shadow.color) {
            colors.push(shadow.color);
        }
    });
    layers.forEach((layer) => {
        const { frontMaterials, sideMaterials, bevelMaterials } = layer;
        [frontMaterials, sideMaterials, bevelMaterials].forEach((materials) => {
            colors.push(getAlbedoColor(materials.albedo));
        });
    });
    // threeText
    if (element.type === 'threeText') {
        element.environment &&
            element.environment.enable &&
            element.environment.maps.length &&
            colors.push(...element.environment.maps);
        !element.isFloodLightOff &&
            element.hemiLight &&
            element.hemiLight.color &&
            colors.push(element.hemiLight.color);
        element.shadow &&
            element.shadow.enable &&
            element.shadow.color &&
            colors.push(element.shadow.color);
    }
    // watermark
    if (element.type === 'watermark') {
        element.aggregatedColors &&
            element.aggregatedColors.length &&
            colors.push(...element.aggregatedColors.map((color) => color.color));
    }
    return colors.filter((v) => v);
}

// 获取3d特效反射层颜色
function getAlbedoColor(albedo) {
    if (albedo.type === 0) return albedo.color;
    if (albedo.type === 2) return albedo.gradient;
    return null;
}

// 渐变比较
export function isEqualGradient(g1, g2) {
    if (g1.angle !== g2.angle || g1.stops.length !== g2.stops.length) return false;
    for (let i = 0; i < g1.stops.length; i++) {
        const stop1 = g1.stops[i];
        const stop2 = g2.stops[i];
        if (!tinycolor.equals(stop1.color, stop2.color) || stop1.offset !== stop2.offset)
            return false;
    }
    return true;
}

// 去重颜色列表
export function uniqColors(colors = []) {
    return uniqWith(colors, (c1, c2) => {
        if (isPureColor(c1) && isPureColor(c2)) {
            return tinycolor.equals(c1, c2);
        } else if (isGradientColor(c1) && isGradientColor(c2)) {
            return isEqualGradient(c1, c2);
        }
        return false;
    });
}

// 是否为空文字特效填充
function isEmptyTextFillingEffect(textEffects) {
    if (!textEffects) return true;
    return (
        !textEffects.length ||
        !textEffects.filter((effect) => effect.filling && effect.filling.enable).length
    );
}
