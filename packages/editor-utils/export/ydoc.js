import tinycolor from 'tinycolor2';
import { cloneDeep } from 'lodash';

// 判断颜色的属性是否是有效的颜色值，是则输出为 8 位 hex 值，否则返回原值
const colorToHex8 = (v) => {
    if (v && typeof v === 'string') {
        const color = tinycolor(v);
        return color.isValid() ? color.toString('hex8') : v;
    }
    return v;
};

// 获取新数据对应的旧数据结构
const getOldShadow = (newShadow, inset = false) => {
    const oldShadow = cloneDeep(newShadow);

    oldShadow.type = 'shadow';
    oldShadow.inset = inset;
    return oldShadow;
};

function copyWithFilter(data) {
    const strCopy = JSON.stringify(data, (k, v) => {
        // 移除 $id 字段
        if (k[0] === '$') {
            return undefined;
        }

        if (
            (k === 'color' || k === 'backgroundColor' || k === 'stroke' || k === 'fill') &&
            typeof v === 'string'
        ) {
            return colorToHex8(v);
        }

        if (k === 'colors' || k === 'aggregatedColors') {
            if (v instanceof Array) {
                // Array
                return v.map((color) => colorToHex8(color));
            } else {
                // Object
                const result = {};
                for (const key in v) {
                    result[key] = colorToHex8(v[key]);
                }
                return result;
            }
        }

        // shadows -> effect shadow
        // 转为旧数据兼容旧编辑器，方案文档：https://doc.huanleguang.com/pages/viewpage.action?pageId=213112415
        if (
            v &&
            typeof v === 'object' &&
            ['text', 'mask', 'effectText', 'image'].includes(v.type)
        ) {
            const isText = ['text', 'effectText'].includes(v.type);
            const effects = (isText ? v.textEffects : v.imageEffects) || [];

            // 特效数据转化
            effects.forEach((effect) => {
                if (effect.insetShadow) {
                    effect.shadow = getOldShadow(effect.insetShadow, true);
                }
                if (effect.filling && typeof effect.filling.type === 'string') {
                    const mapColorType = ['color', 'image', 'gradient'];
                    effect.filling.type = mapColorType.indexOf(effect.filling.type);
                    if (effect.filling.type === -1) {
                        effect.filling.type = 0;
                    }
                }
            });

            // 投影
            if (v.shadows) {
                // 是否存在有效特效
                const hasEffects = effects.some((ef) => ef.enable);
                // 筛选出基础投影
                let shadowEffects = v.shadows.filter((shadow) => shadow.type === 'base');
                // 第一个有效投影
                const firstEnableShadow = shadowEffects.find((sh) => sh.enable);

                // 构造 effect 数据结构
                shadowEffects = shadowEffects.map((shadow) => ({
                    enable: true,
                    filling: {
                        // 不存在特效数据且第一个有效投影的为 false，否则为 true
                        enable: hasEffects || firstEnableShadow !== shadow,
                        type: 0,
                        color: '#00000000',
                    },
                    shadow: getOldShadow(shadow),
                }));

                // 投影数据加在最后面
                const newEffects = effects.concat(shadowEffects);
                isText ? (v.textEffects = newEffects) : (v.imageEffects = newEffects);
            }
        }

        return v;
    });
    return JSON.parse(strCopy);
}

// 可在控制台测试
export function exportYDoc(doc) {
    const yTemplet = doc.getMap('templet');
    const yFallbackMap = doc.getMap('fallbackMap');
    const yLayoutMap = yTemplet.get('layoutMap');
    const yElementMap = yTemplet.get('elementMap');

    function getChildren(parent) {
        const ids = [];
        yElementMap.forEach((yElement, uuid) => {
            if (yElement.get('$parentId') === parent.uuid) {
                ids.push(uuid);
            }
        });
        ids.sort((a, b) => {
            const indexA = yElementMap.get(a).get('$index');
            const indexB = yElementMap.get(b).get('$index');
            if (indexA > indexB) return 1;
            else if (indexA < indexB) return -1;
            return a > b ? 1 : -1;
        });
        return ids;
    }

    function serializeElement(id, deep = false) {
        const yElement = yElementMap.get(id);
        if (!yElement) {
            console.error(id);
            return;
        }

        const element = yElement.toJSON();
        const fallback = element.$fallbackId && yFallbackMap?.get(element.$fallbackId);

        if (fallback) {
            element.imageUrl = fallback.url;

            if (fallback.width) {
                element.effectResult = {
                    width: fallback.width,
                    height: fallback.height,
                    top: fallback.top,
                    left: fallback.left,
                };
            }
        }

        if ('elements' in element) {
            if (deep) {
                const ids = getChildren(element);
                element.elements = ids.map((id) => serializeElement(id, true));
            } else {
                element.elements = [];
            }
        }

        return element;
    }

    function serializeLayout(id) {
        const yLayout = yLayoutMap.get(id);
        if (!yLayout) {
            console.error(id);
            return null;
        }

        const layout = yLayout.toJSON();
        const ids = getChildren(layout);
        layout.elements = ids.map((id) => serializeElement(id, true));
        layout.elements = layout.elements.filter((el) => !!el);
        return layout;
    }

    const layouts = [];
    yLayoutMap.forEach((yLayout) => {
        const layout = serializeLayout(yLayout.get('uuid'));
        layout && layouts.push(layout);
    });

    layouts.sort((a, b) => {
        return yLayoutMap.get(a.uuid).get('$index') > yLayoutMap.get(b.uuid).get('$index') ? 1 : -1;
    });

    return copyWithFilter({
        version: '7.0.0',
        type: 'poster',
        actionLogs: doc.getArray('actionLogs')?.toJSON(),
        global: yTemplet.get('global')?.toJSON() || {},
        layouts,
    });
}
