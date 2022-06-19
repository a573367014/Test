import { merge, pick } from 'lodash';
import tinycolor from 'tinycolor2';
import { useEffects } from '../../utils/model-adaptation';
import editorDefaults from '../editor-defaults';
import { isSupportEffectElement } from '@gaoding/editor-utils/element';
import { getEffects, scaleEffect } from '@gaoding/editor-utils/effect/utils';

export default {
    /**
     * 联动或单独变更特效颜色
     * @memberof EditorEffectMixin
     * @param {String} newColor 新颜色
     * @param {Number} index 调节单个聚合后颜色时，目标颜色所在下标
     * @param {Element} element 可选的目标元素，默认为 currentElement
     */
    changeEffectColor(newColor, index, element) {
        const targetElement = element || this.currentElement;
        if (!targetElement || !isSupportEffectElement(targetElement)) {
            return;
        }

        const { aggregatedColors } = targetElement;
        const effects = getEffects(targetElement);

        // 聚合联动调节模式
        if (targetElement.mainColor !== null && index === undefined) {
            const mainHsl = tinycolor(targetElement.mainColor).toHsl();
            const toHsl = tinycolor(newColor).toHsl();

            // 缓存原有聚合颜色到主色的 HSL 差值
            if (!targetElement.$hslDiff) {
                targetElement.$hslDiff = targetElement.aggregatedColors.map((color) => {
                    const baseHsl = tinycolor(color).toHsl();
                    return {
                        h: baseHsl.h - mainHsl.h,
                        s: baseHsl.s - mainHsl.s,
                        l: baseHsl.l - mainHsl.l,
                    };
                });
            }

            const clamp = (x) => Math.max(0, Math.min(1, x));
            // 361 -> 1, -1 -> 359
            const circular = (x) => (360 + (x % 360)) % 360;
            const diffFrom = (linkIndex) => {
                if (linkIndex === undefined) {
                    return;
                }

                const { $hslDiff } = targetElement;
                const newHsl = {
                    h: circular(toHsl.h + $hslDiff[linkIndex].h),
                    s: clamp(toHsl.s + $hslDiff[linkIndex].s),
                    l: clamp(toHsl.l + $hslDiff[linkIndex].l),
                };
                return tinycolor(newHsl).toHex8String();
            };

            effects.forEach((effect) => {
                ['stroke', 'filling', 'insetShadow'].forEach((type) => {
                    if (effect[type] && effect[type].$linkIndex !== undefined) {
                        effect[type].color = diffFrom(effect[type].$linkIndex);
                    }
                });
            });
            (targetElement.shadows || []).forEach((shadow) => {
                if (shadow.$linkIndex !== undefined) {
                    shadow.color = diffFrom(shadow.$linkIndex);
                }
            });

            // 特效联动更新完成后更新聚合颜色与主色
            targetElement.mainColor = tinycolor(toHsl).toHex8String();
            // Text only
            if (targetElement.$linkIndex !== undefined) {
                const newColor = diffFrom(targetElement.$linkIndex);
                targetElement.color = newColor;
                this.changeTextContents({ color: newColor }, targetElement);
            }
            targetElement.aggregatedColors = aggregatedColors.map((color, i) => {
                return diffFrom(i);
            });

            this.makeSnapshot('change_effect_color');
            return;
        }

        // 单颜色调节模式
        effects.forEach((effect) => {
            ['stroke', 'filling', 'insetShadow'].forEach((type) => {
                if (effect[type] && effect[type].$linkIndex === index) {
                    effect[type].color = newColor;
                }
            });
        });
        (targetElement.shadows || []).forEach((shadow) => {
            if (shadow.$linkIndex === index) {
                shadow.color = newColor;
            }
        });

        // Text only
        if (targetElement.$linkIndex === index) {
            targetElement.color = newColor;
            this.changeTextContents({ color: newColor }, targetElement);
        }

        if (targetElement.$backgroundColorLinkIndex === index) {
            targetElement.backgroundColor = newColor;
        }

        // 特效更新完成后更新聚合颜色
        this.$set(targetElement.aggregatedColors, index, newColor);

        this.makeSnapshotByElement(targetElement);
    },

    /**
     * 重置聚合颜色
     * @memberof EditorEffectMixin
     * @param {Element} element 可选的目标元素，默认为 currentElement
     */
    resetAggregatedColors(element, makeSnapshot = true) {
        element = this.getElement(element);
        if (!element || !isSupportEffectElement(element)) return;

        element.aggregatedColors = [];
        useEffects(element);
        makeSnapshot && this.makeSnapshotByElement(element);
    },

    /**
     * 变更特效缩放大小
     * @memberof EditorEffectMixin
     * @param {String} newScale 新比例
     * @param {Element} element 可选的目标元素，默认为 currentElement
     */
    changeEffectScale(newScale, element) {
        const targetElement = element || this.currentElement;
        if (!targetElement || !isSupportEffectElement(element)) {
            return;
        }

        const ratio = newScale / targetElement.effectScale;

        scaleEffect(targetElement, ratio);
        targetElement.effectScale = newScale;
        this.makeSnapshotByElement(targetElement);
    },

    // ==================== 废弃属性 =======================

    /**
     * 添加文字特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} options - 特效参数
     * @param {element} element - 待添加特效的元素
     * @param {Boolean} installDefault - 是否对特效进行其他字段补全
     */
    addTextEffect(options = {}, element, installDefault = true) {
        element = this.getElement(element);
        if (!element || (element.type !== 'text' && element.type !== 'effectText')) {
            return;
        }

        let defaultEffect;
        if (!installDefault) {
            const pickKeys = ['enable', 'excludeScale'];
            defaultEffect = pick(
                merge({}, editorDefaults.textEffect, { filling: { color: element.color } }),
                pickKeys.concat(Object.keys(options)),
            );
        } else {
            defaultEffect = merge({}, editorDefaults.textEffect, {
                filling: { color: element.color },
            });
        }

        const newEffect = merge({}, defaultEffect, options);

        element.textEffects.push(newEffect);
        this.makeSnapshotByElement(element);
    },

    /**
     * 移除单个文字特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} effect - 待变更特效的引用
     * @param {element} element - 待移除特效的元素
     */
    removeTextEffect(effect, element) {
        element = this.getElement(element);
        if (!effect || !element || element.type !== 'text') {
            return;
        }

        const index = element.textEffects.indexOf(effect);
        if (index === -1) {
            return;
        }

        element.textEffects.splice(index, 1);
        this.makeSnapshotByElement(element);
    },

    /**
     * 移除全部文字特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {element} element - 待移除特效的元素
     */
    removeAllTextEffects(element) {
        element = this.getElement(element);
        if (
            !element ||
            (element.type !== 'text' && element.type !== 'effectText') ||
            !element.textEffects.length
        ) {
            return;
        }

        element.textEffects = [];
        this.makeSnapshotByElement(element);
    },

    /**
     * 变更单个文字特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} effect - 待变更特效的引用
     * @param {Object} options - 新特效参数
     * @param {element} element - 待变更特效的元素
     * @param {Boolean} makeSnapshot - 创建快照
     * @param {Boolean} installDefault - 是否对特效进行其他字段补全
     */
    changeTextEffect(effect, options = {}, element, maskSnapshow = true, installDefault = true) {
        element = this.getElement(element);
        if (!effect || !element || (element.type !== 'text' && element.type !== 'effectText')) {
            return;
        }

        const index = element.textEffects.findIndex((target) => {
            return target === effect;
        });
        if (index === -1) {
            return;
        }

        let defaultEffect;
        if (!installDefault) {
            const pickKeys = ['enable', 'excludeScale'];
            defaultEffect = pick(
                merge({}, editorDefaults.textEffect, { filling: { color: element.color } }),
                pickKeys.concat(Object.keys(options)),
            );
        } else {
            defaultEffect = merge({}, editorDefaults.textEffect, {
                filling: { color: element.color },
            });
        }

        const newEffect = merge(defaultEffect, options);

        element.textEffects.splice(index, 1, newEffect);
        maskSnapshow && this.makeSnapshotByElement(element);
    },

    /**
     * 创建一条 imageEffect 数据
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} addition - 需要添加到 imageEffectModel 里的 data，例如 collapse
     * @param {Boolean} installDefault - 是否对特效进行其他字段补全
     */
    createImageEffect(options = {}, installDefault = true) {
        let defaultEffect;
        if (!installDefault) {
            const pickKeys = ['enable', 'excludeScale'];
            defaultEffect = pick(editorDefaults.textEffect, pickKeys.concat(Object.keys(options)));
        } else {
            defaultEffect = editorDefaults.textEffect;
        }

        return merge({}, defaultEffect, options);
    },

    /**
     * 添加图片特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} addition - 需要添加到 imageEffectModel 里的 data，例如 collapse
     * @param {element} element - 待添加特效的元素
     * @param {Boolean} installDefault - 是否对特效进行其他字段补全
     */
    addImageEffect(options = {}, element, installDefault = true) {
        element = this.getElement(element);
        if (!element || !['image', 'mask'].includes(element.type)) {
            return;
        }
        if (!element.imageEffects) {
            element.imageEffects = [];
        }

        const newEffect = this.createImageEffect(options, installDefault);
        element.imageEffects.push(newEffect);
        this.makeSnapshotByElement(element);
    },

    /**
     * 移除单个图片特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} effect - 待变更特效的引用
     * @param {element} element - 待移除特效的元素
     */
    removeImageEffect(effect, element) {
        element = this.getElement(element);
        if (!effect || !element || !['image', 'mask'].includes(element.type)) {
            return;
        }

        const index = element.imageEffects.indexOf(effect);
        if (index === -1) {
            return;
        }

        element.imageEffects.splice(index, 1);
        this.makeSnapshotByElement(element);
    },

    /**
     * 变更单个图片特效
     * @deprecated
     * @memberof EditorEffectMixin
     * @param {Object} effect - 待变更特效的引用
     * @param {Object} options - 新特效参数
     * @param {element} element - 待变更特效的元素
     * @param {Boolean} makeSnapshot - 创建快照
     * @param {Boolean} installDefault - 是否对特效进行其他字段补全
     */
    changeImageEffect(effect, options = {}, element, makeSnapshot = true, installDefault = true) {
        element = this.getElement(element);
        if (!effect || !element || !['image', 'mask'].includes(element.type)) {
            return;
        }

        const index = element.imageEffects.findIndex((target) => target === effect);
        if (index === -1) {
            return;
        }

        const newEffect = this.createImageEffect(options, installDefault);
        element.imageEffects.splice(index, 1, newEffect);
        makeSnapshot && this.makeSnapshotByElement(element);
    },
};
