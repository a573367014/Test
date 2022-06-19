import { findIndex, cloneDeep, defaultsDeep, get } from 'lodash';
import tinycolor from 'tinycolor2';
import Matrix from '@gaoding/editor-utils/matrix';
import Transform from '@gaoding/editor-utils/transform';
import editorDefaults from '../../src/base/editor-defaults';
import { isTextElement } from '@gaoding/editor-utils/element';
import { getEffects } from '@gaoding/editor-utils/effect/utils';

export function parseTransform(matrixData) {
    let transform = new Transform();
    if (matrixData) {
        // matrixData 可能为 Transform 实例
        if (matrixData.localTransform) {
            transform = cloneDeep(matrixData);
        } else {
            const matrix = new Matrix();
            matrix.copy.call(matrixData, matrix);
            matrix.decompose(transform);
        }
    }
    return transform;
}

export function hexaToRgba(val, defaultVal = null) {
    if (!val) {
        return defaultVal;
    }

    const color = tinycolor(val).toString('rgb');

    return color;
}

/**
 * 检测颜色是否聚合
 */
function checkIsAggregate(option) {
    // 禁用的不聚合
    if (!option.enable) {
        return false;
    }
    // 渐变色和图案填充的不聚合
    if ([1, 2, 'gradient', 'image'].includes(option.type)) {
        return false;
    }
    // 其他有 color 字段的都聚合
    return !!option.color;
}

/**
 * 获取排序整合后的特效投影数据
 * @return {Array<
 *    | import('@gaoding/editor-utils/types/shadow').IShadow
 *    | import('@gaoding/editor-utils/types/effect/effect-filling').IEffectFilling
 *    | import('@gaoding/editor-utils/types/effect/effect-stroke').IEffectStroke
 *  )>}
 */
function getSortedEffectShadows(model) {
    const shadows = (model.shadows || []).filter((sh) => sh.enable);
    const effects = getEffects(model);
    // 聚合顺序：自身颜色、填充、描边、内阴影、投影、背景，另外渐变是图案填充不属于聚合颜色内容
    const aggregateKeys = ['filling', 'stroke', 'insetShadow', 'shadow'];

    // 将特效投影整合到一个对象里
    const effectShadowGroup = {};
    effects.forEach((effect) => {
        if (!effect.enable) {
            return;
        }
        for (const key in effect) {
            if (!aggregateKeys.includes(key)) {
                continue;
            }
            if (!effectShadowGroup[key]) {
                effectShadowGroup[key] = [];
            }
            effectShadowGroup[key].push(effect[key]);
        }
    });
    effectShadowGroup.shadow = shadows;

    // 按照聚合顺序重新组织到数组
    return aggregateKeys.reduce((prev, key) => {
        return effectShadowGroup[key] ? prev.concat(effectShadowGroup[key]) : prev;
    }, []);
}

/**
 * 特效相关数据处理
 *
 * 1. 补充特效缺省数据
 * 2. 处理颜色聚合和索引值
 */
export function useEffects(model, mergeDefault) {
    delete model.$linkIndex;

    // 适配未添加 aggregatedColors 的历史数据，聚合出所有颜色使其可调
    const isText = isTextElement(model);
    const effects = getEffects(model);

    const validEffects = effects.filter((effect) => effect.enable);
    const sortedEffectShadows = getSortedEffectShadows(model);
    const aggregatedColors = [];

    if (mergeDefault) {
        // 补充缺省属性
        effects.forEach((effect) => defaultsDeep(effect, editorDefaults.effect));
    }

    // ====================== 设置 aggregatedColors start =============================
    // 特效颜色融合
    sortedEffectShadows.forEach((item) => {
        if (!checkIsAggregate(item)) {
            return;
        }
        // 去重操作
        const color = aggregatedColors.find((color) => {
            return tinycolor.equals(item.color, color);
        });

        if (!color) {
            aggregatedColors.push(item.color);
        }
    });

    // 聚合自身颜色：文字元素 && 存在 color 值 && 不与其他颜色重复
    if (
        isText &&
        model.color &&
        !aggregatedColors.some((color) => tinycolor.equals(color, model.color))
    ) {
        let isNeedAddSelfColor = !validEffects.length;

        // 如果存在特效投影时，需要再做进一步判断
        if (!isNeedAddSelfColor) {
            validEffects.forEach((efA, i) => {
                // 存在填充色的不需要自身颜色
                if (efA.filling && efA.filling.enable) {
                    return;
                }

                // 不存在填充色的，判断是否被上层遮住，被遮住的不需要自身原色
                const isValid = effects.some((efB, j) => {
                    // 有特效，并且可能覆盖 efA 的通过
                    if (i <= j || !efB.filling || !efB.filling.enable) {
                        return false;
                    }

                    // 全相等 = 会被覆盖
                    const offsetA = efA.offset || { x: 0, y: 0 };
                    const offsetB = efB.offset || { x: 0, y: 0 };
                    return (
                        offsetA.x === offsetB.x &&
                        offsetA.y === offsetB.y &&
                        !get(efA, 'skew.enable') &&
                        !get(efB, 'skew.enable')
                    );
                });

                // 在最上层或不会被覆盖的
                // 需添加自身颜色
                if (i === 0 || !isValid) {
                    isNeedAddSelfColor = true;
                }
            });
        }

        if (isNeedAddSelfColor) {
            aggregatedColors.unshift(model.color);
        }
    }
    model.aggregatedColors = aggregatedColors;
    // ====================== 设置 aggregatedColors end =============================

    // ====================== 设置 $linkIndex start =============================
    // 添加 $linkIndex 以避免调节时同色合并问题
    sortedEffectShadows.forEach((item) => {
        if (!checkIsAggregate(item)) {
            return;
        }
        const linkIndex = findIndex(model.aggregatedColors, (aggregatedColor) => {
            return tinycolor.equals(item.color, aggregatedColor);
        });
        if (linkIndex > -1) {
            item.$linkIndex = linkIndex;
        }
    });
    if (isText) {
        // 为文本自身颜色增加 $linkIndex
        const linkIndex = findIndex(model.aggregatedColors, (aggregatedColor) => {
            return tinycolor.equals(model.color, aggregatedColor);
        });

        if (linkIndex > -1) {
            model.$linkIndex = linkIndex;
        }
    }
    // ====================== 设置 $linkIndex end =============================

    // 设置背景色聚合
    if (model.backgroundColor && tinycolor(model.backgroundColor).getAlpha() !== 0) {
        const linkIndex = findIndex(model.aggregatedColors, (aggregatedColor) => {
            return tinycolor.equals(model.backgroundColor, aggregatedColor);
        });

        if (linkIndex > -1) {
            model.$backgroundColorLinkIndex = linkIndex;
        } else {
            model.$backgroundColorLinkIndex = model.aggregatedColors.length;
            model.aggregatedColors.push(model.backgroundColor);
        }
    } else {
        delete model.$backgroundColorLinkIndex;
    }

    // 统一格式化颜色数据
    model.aggregatedColors = model.aggregatedColors.map((color) =>
        tinycolor(color).toString('rgb'),
    );
}

export function getAdaptationImageTransform(model) {
    const {
        naturalWidth,
        naturalHeight,
        $imageWidth,
        $imageHeight,
        $imageLeft,
        $imageTop,
        imageTransform,
        width,
        height,
    } = model;

    const newImageTransform = model.parseTransform(imageTransform);
    const { position, scale } = newImageTransform;

    scale.x = $imageWidth / naturalWidth;
    scale.y = $imageHeight / naturalHeight;

    position.x = $imageLeft + $imageWidth / 2 - width / 2;
    position.y = $imageTop + $imageHeight / 2 - height / 2;

    return newImageTransform;
}

export function adaptationImageTransform(model, img) {
    let {
        $imageWidth,
        $imageHeight,
        $imageLeft,
        $imageTop,

        background,
        imageTransform,
        width,
        height,
    } = model;

    const flipX = imageTransform.scale.x < 0 ? -1 : 1;
    const flipY = imageTransform.scale.y < 0 ? -1 : 1;

    imageTransform = imageTransform || background?.image?.imageTransform;
    imageTransform.scale.x = ($imageWidth / img.naturalWidth) * flipX;
    imageTransform.scale.y = ($imageHeight / img.naturalHeight) * flipY;

    imageTransform.position.x = $imageLeft + $imageWidth / 2 - width / 2;
    imageTransform.position.y = $imageTop + $imageHeight / 2 - height / 2;
    imageTransform.updateLocalTransform();
}

/**
 * 特效投影数据适配处理：https://doc.huanleguang.com/pages/viewpage.action?pageId=213112415
 */
export function adaptationEffectShadows(model) {
    const isText = isTextElement(model);
    const effects = isText ? model.textEffects : model.imageEffects;
    let newShadows = [];

    // 存在 shadows 数据代表新数据，直接使用数据
    if (model.shadows) {
        newShadows = model.shadows;
    }

    const newEffects = (effects || []).reduce((result, effect) => {
        // 正常是 shadow，但 app 端可能产出 shadows 数据
        const oldShadows = effect.shadows || (effect.shadow ? [effect.shadow] : []);

        // offset 不存在 enable 就需要补充下
        if (effect.offset && effect.offset.enable === undefined) {
            // x 或 y 其中一个不为 0 时为 true，否则为 false
            effect.offset.enable = effect.offset.x !== 0 || effect.offset.y !== 0;
        }

        // 不存在投影数据的不做处理
        if (oldShadows.length === 0) {
            return result.concat(effect);
        }

        // 不存在 shadows 就代表是旧数据，需要做旧数据转新数据处理
        if (!model.shadows) {
            // 1. 旧数据 offset enable 都设置为 true
            if (effect.offset) {
                effect.offset.enable = true;
            }
            const offsetX = effect.offset?.x || 0;
            const offsetY = effect.offset?.y || 0;

            oldShadows.forEach((shadow) => {
                const currentShadow = cloneDeep(shadow);

                if (currentShadow.inset) {
                    effect.insetShadow = currentShadow;
                } else {
                    // 2. 投影偏移叠加
                    currentShadow.offsetX += offsetX;
                    currentShadow.offsetY += offsetY;

                    newShadows.push(currentShadow);
                }

                // 3. 类型调整
                currentShadow.type = 'base';
                // 4. 新增 opacity，值取 color 的不透明通道
                currentShadow.opacity = tinycolor(currentShadow.color).getAlpha();
                // 5. 投影和特效层同时开启才是开启状态
                currentShadow.enable = currentShadow.enable && effect.enable;
                // 6. 删除 inset
                delete currentShadow.inset;
            });
        }

        // 6. 废弃旧数据
        delete effect.shadows;
        delete effect.shadow;

        // 去除掉投影数据后，如果还有其他特效就保留这个对象，否则去除，防止出现空特效不断累加
        if (
            effect.offset ||
            effect.stroke ||
            effect.insetShadow ||
            effect.mask ||
            // 如果仅剩填充色，且这个填充色是一个纯色且透明度为 0，则认为是为了兼容旧数据的无效数据
            (effect.filling &&
                (![0, 'color'].includes(effect.filling.type) ||
                    tinycolor(effect.filling.color).getAlpha() !== 0))
        ) {
            return result.concat(effect);
        }
        return result;
    }, []);

    isText ? (model.textEffects = newEffects) : (model.imageEffects = newEffects);
    model.shadows = newShadows;
}
