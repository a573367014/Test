import Promise from 'bluebird';
import { uniq, cloneDeep, pick } from 'lodash';
import tinycolor from 'tinycolor2';
import loader from '@gaoding/editor-utils/loader';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';

import utils, { serialize } from '@gaoding/editor-framework/src/utils/utils';

import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './text-element.html';
import { isGroup } from '@gaoding/editor-utils/element';
import { fitText } from '@gaoding/editor-framework/src/utils/fit-elements';
import {
    initMaskInfo,
    debounceUpdateMaskInfo,
} from '@gaoding/editor-framework/src/static/mask-wrap/utils';

import $ from '@gaoding/editor-utils/zepto';
// const rTwoSpace = /\s\s/g;
// const rBr = /<br\s*\/?>/ig;
// const rBreakLine = /\r?\n/gm;
const isFox = utils.isFox();
const supportMiniFontSize = isFox || window.safari;

export const textBase = {
    template,
    data() {
        return {
            fallbackFonts: 'Arial,SimSun,Sans-Serif',
            // safari 原生支持字号小于12像素
            minFontSize: supportMiniFontSize ? 1 : this.model.$miniFontSize,
            // 优化切换字体时闪一下的问题
            lastFont: null,
        };
    },
    computed: {
        listClass() {
            const listStyle = this.model.listStyle;
            const elems = this.model.contents.filter((item) => item.beginParentTag === 'li');
            const digitMaps = {
                decimal: 10,
                'upper-alpha': 27,
                'lower-alpha': 27,
                'cjk-ideographic': 11,
            };

            const digit = digitMaps[listStyle]
                ? 1 + Math.min(1, Math.floor(elems.length / digitMaps[listStyle]))
                : 1;
            const classArr = [];

            listStyle && listStyle !== 'none' && classArr.push('is-list is-list--' + listStyle);
            isFox && classArr.push('is-fox');
            digit && classArr.push('is-list--digit-' + digit);

            return classArr.join(' ');
        },
        textPadding() {
            const { model } = this;
            return this.isText ? model.padding.join('px ') + 'px' : this.padding;
        },

        hasEffects() {
            return this.effectedTextEffects.length;
        },

        /** 是否只有投影 */
        isOnlyShadow() {
            const { shadows = [], textEffects = [] } = this.model;
            const getCount = (arr) => arr.filter((v) => v?.enable).length;

            return getCount(shadows) > 0 && getCount(textEffects) === 0;
        },

        // 有渐变、图案填充
        hasAdvancedFilling() {
            return (
                !!this.effectedTextEffects &&
                this.effectedTextEffects.find((effect) => this.checkAdvancedFilling(effect))
            );
        },

        resize() {
            return this.model.resize;
        },
        isVertical() {
            const writingMode = this.model.writingMode;

            return writingMode && writingMode.indexOf('vertical') > -1;
        },

        contentsHTML() {
            const { model, options } = this;
            const defaultModel = pick(model, ['fontStyle', 'fontWeight', 'textDecoration']);
            const fontSubsetEnable = options.fontSubset.getUrl;
            const subsetSuffix = options.subsetSuffix;

            const contents = model.contents.map((item) => {
                const result = {};

                // TODO: 截图服务 mirror 页面可以突破 12 字号限制，导致chrome浏览器跟截图效果不一致
                if (item.fontSize && this.options.mode === 'mirror' && !supportMiniFontSize) {
                    result.fontSize = Math.max(item.fontSize, 12);
                }

                if (item && item.fontFamily) {
                    let font;
                    if (item.fontFamily === this.model.fontFamily && this.lastFont) {
                        font = this.lastFont;
                    } else {
                        font = this.getCloseFont(item.fontFamily) || { name: item.fontFamily };
                    }

                    const subsetData = options.fontSubsetsMap[font.name];
                    const subsetNames =
                        fontSubsetEnable && subsetData
                            ? [`"${font.name + subsetSuffix}"`, `"${font.family + subsetSuffix}"`]
                            : [];

                    const fontNames = uniq(
                        subsetNames.concat([
                            `"${font.name}"`,
                            `"${font.family}"`,
                            this.fallbackFonts,
                        ]),
                    );

                    if (font) {
                        result.fontFamily = fontNames.join(',');
                    }
                    return Object.assign({}, defaultModel, item, result);
                }

                return Object.assign({}, defaultModel, item, result);
            });

            const html = serialize.fromHTML(contents, {
                listStyle: this.model.listStyle,
            });
            return html;
        },

        fontFamily() {
            const fallbackFonts = this.fallbackFonts;
            let font = this.lastFont;

            if (!font || this.model.$loaded) {
                font = this.getCloseFont();
            }
            if (!font) {
                return fallbackFonts;
            }

            const fontSubsetEnable = this.options.fontSubset.getUrl;
            const subsetSuffix = this.options.subsetSuffix;
            const subsetData = this.options.fontSubsetsMap[font.name];
            const subsetNames =
                fontSubsetEnable && subsetData
                    ? [`"${font.name + subsetSuffix}"`, `"${font.family + subsetSuffix}"`]
                    : [];

            const fontNames = uniq(
                subsetNames.concat([`"${font.name}"`, `"${font.family}"`, fallbackFonts]),
            );
            return fontNames.join(',');
        },

        color() {
            return this.model.color && tinycolor(this.model.color).toString('rgb');
        },

        fontSize() {
            return this.model.fontSize;
        },
        fontSizeScale() {
            return Math.min(1, this.fontSize / this.minFontSize);
        },

        letterSpacingScale() {
            return this.fontSizeScale < 1
                ? this.minFontSize / this.model.fontSize
                : this.global.zoom;
        },

        transformOrigin() {
            const origin = [0, 0];
            const align = this.model.verticalAlign;

            // Horizontal
            if (!this.isVertical) {
                origin[0] = 0;
                origin[1] = { top: 0, middle: '50%', bottom: '100%' }[align];
            }
            // Vertical
            else {
                origin[0] = { top: '100%', middle: '50%', bottom: 0 }[align];
                origin[1] = 0;
            }

            return origin.join(' ');
        },

        mainTransform() {
            const fontSizeScale = this.fontSizeScale;

            return fontSizeScale < 1 ? 'scale(' + fontSizeScale + ')' : null;
        },
        mainMinHeight() {
            if (!this.isVertical) {
                const model = this.model;
                return this.fontSize * model.lineHeight * this.fontSizeScale + 'px';
            } else {
                return 'initial';
            }
        },

        mainMinWidth() {
            if (this.isVertical) {
                const model = this.model;
                return this.fontSize * model.lineHeight * this.fontSizeScale + 'px';
            } else {
                return 'initial';
            }
        },
        // 宽度自增
        widthAutoScale() {
            const model = this.model;
            return [this.isVertical ? 0b01 : 0b10, 0b11].includes(model.autoAdaptive);
        },

        /** 是否固定尺寸，即宽高都固定 */
        isFixedSize() {
            return this.model.autoAdaptive === 0b00;
        },

        mainWidth() {
            const fontSizeScale = this.fontSizeScale;
            const width = 100 / fontSizeScale;

            if (this.isVertical) {
                return !this.isFixedSize
                    ? 'auto'
                    : `calc(${width}% + ${this.model.letterSpacing}px)`;
            } else {
                return this.widthAutoScale
                    ? 'auto'
                    : `calc(${width}% + ${this.model.letterSpacing}px)`;
            }
        },

        mainHeight() {
            const fontSizeScale = this.fontSizeScale;
            const height = 100 / fontSizeScale;

            if (!this.isVertical) {
                return !this.isFixedSize
                    ? 'auto'
                    : `calc(${height}% + ${this.model.letterSpacing}px)`;
            } else {
                return this.widthAutoScale
                    ? 'auto'
                    : `calc(${height}% + ${this.model.letterSpacing}px)`;
            }
        },

        textShadow() {
            // {color: '#00FF00FF', offsetX: 2, offsetY: 4, blurRadius: 5}
            const data = this.model.textShadow;

            if (!data) {
                return '';
            }

            return [
                data.offsetX + 'px',
                data.offsetY + 'px',
                data.blurRadius + 'px',
                data.color,
            ].join(' ');
        },
        textStyle() {
            const { $effectPadding } = this.model;
            const style = {
                fontFamily: this.fontFamily,
                fontSize: Math.max(this.minFontSize, this.fontSize) + 'px',
                letterSpacing: this.model.letterSpacing + 'px',
                verticalAlign: this.model.verticalAlign,
                color: this.color,
                transform: this.mainTransform,
                transformOrigin: this.transformOrigin,
                minWidth: this.mainMinWdith,
                minHeight: this.mainMinHeight,
                width: this.mainWidth,
                height: this.mainHeight,
            };

            if ($effectPadding) {
                style.padding = `${$effectPadding[0]}px ${$effectPadding[1]}px ${$effectPadding[2]}px ${$effectPadding[3]}px`;
                style.marginTop = `${$effectPadding[0] * -1}px`;
                style.marginRight = `${$effectPadding[3] * -1}px`;
            }

            // 3D 文字由于高度和编辑态文本高度可能相差很大，所以采用编辑态文本垂直居中
            if (this.model.type === 'threeText') {
                Object.assign(style, {
                    whiteSpace: 'nowrap',
                    top: this.model.height / 2 + 'px',
                    transform: 'translate(0,-50%)',
                });
            }

            if (this.widthAutoScale) {
                style.whiteSpace = 'nowrap';
            }

            return style;
        },

        linkSelected() {
            const element = this.editor.currentSubElement || this.editor.currentElement || {};
            return this.isLinkWith(element);
        },
    },
    methods: {
        fitFontSize(baseFontSize, ratio) {
            const newFontSize = Math.max(baseFontSize * ratio, 0.01);
            if (newFontSize % 1 !== 0) {
                return Math.floor(newFontSize * 10) / 10;
            }
            return newFontSize;
        },
        load(name) {
            const options = this.options;
            const { contents, fontFamily } = this.model;

            let names = null;
            if (name) {
                names = [name];
            } else {
                names = contents
                    .filter((item) => item && item.fontFamily)
                    .map((item) => item.fontFamily);

                names.push(fontFamily);

                names = uniq(names);
            }

            const fontLoads = names.map((name) => {
                const font = this.getCloseFont(name);
                const fontFallBackHook =
                    this.options.collabOptions?.enable &&
                    this.options.collabOptions?.fontFallBackHook;
                let promise = Promise.resolve(font);

                if (!font && fontFallBackHook) {
                    promise = Promise.try(() =>
                        this.options.collabOptions.fontFallBackHook(name, this.model),
                    ).catch((e) => {
                        console.error(e);
                        return font;
                    });
                }

                return promise.then((font) => {
                    if (!font) return null;

                    const fontSubset = this.options.fontSubsetsMap[font.name];
                    return loader.loadFont(
                        Object.assign(
                            {},
                            font,
                            { display: 'swap', useLocal: this.options?.mode === 'mirror' },
                            fontSubset?.loadType === 'subset'
                                ? {
                                      subset: {
                                          suffix: options.subsetSuffix,
                                          promise: fontSubset.subsetPromise,
                                          content: fontSubset.subsetContent,
                                      },
                                  }
                                : null,
                        ),
                        options.fontLoadTimeout,
                    );
                });
            });

            return Promise.all(fontLoads)
                .then(() => {
                    initMaskInfo(this.model, this.editor);
                    return names;
                })
                .finally(() => {
                    this.lastFont = this.getCloseFont(this.model.fontFamily);
                });
        },
        getCloseFont(name = '') {
            const { fontsMap, defaultFont, fontList } = this.options;

            if (!name) {
                name = this.model.fontFamily;
            }

            if (
                this.options.collabOptions?.enable &&
                this.options.collabOptions?.fontFallBackHook
            ) {
                return fontsMap[name];
            } else {
                return fontsMap[name] || fontsMap[defaultFont] || fontList[0];
            }
        },

        updateRect() {
            const { model } = this;
            const { zoom } = this.global;
            const rect = this.getRect();

            const height = rect.height / zoom;
            const width = rect.width / zoom;
            const isChild = !!this.model.$parentId;
            const isVertical = model.writingMode === 'vertical-rl';
            let hasUpdated = false;

            const delta = { width: 0, height: 0, align: 'left' };

            // 延迟调用 updateRect 时，dom 可能并不存在，getRect 获取的宽高可能为 0
            if (width !== model.width && rect.originWidth !== 0 && model.autoAdaptive & 0b10) {
                delta.width = width - model.width;
                model.width = width;

                if (!isChild && isVertical) {
                    model.left -= {
                        top: delta.width,
                        middle: delta.width / 2,
                        bottom: delta.width * -1,
                    }[model.verticalAlign || 'top'];
                }

                hasUpdated = true;
            }

            if (height !== model.height && rect.originHeight !== 0 && model.autoAdaptive & 0b01) {
                delta.height = height - model.height;
                model.height = height;

                hasUpdated = true;
            }

            // 具备宽度自增时，left 需根据 textAlign 做效果
            const textAlignMap = {
                center: (w) => w / 2,
                right: (w) => w,
            };

            if (
                hasUpdated &&
                !isChild &&
                textAlignMap[model.textAlign] &&
                model.autoAdaptive & (isVertical ? 0b01 : 0b10, 0b11)
            ) {
                if (model.writingMode !== 'vertical-rl') {
                    model.left -= textAlignMap[model.textAlign](delta.width);
                } else {
                    model.top -= textAlignMap[model.textAlign](delta.height);
                }
            }

            if (hasUpdated && this.isDesignMode) {
                let textAlign = model.textAlign;

                if (isVertical) {
                    textAlign = {
                        top: 'right',
                        middle: 'center',
                        bottom: 'left',
                    }[model.verticalAlign || 'top'];
                }

                delta.align = textAlign;
                this.$events.$emit('element.rectUpdate', model, delta);
            }
        },

        _getRect() {
            let element = $(this.$el);
            let innerElement = element.find('.element-main');
            const zoom = this.global.zoom;

            if (this.model.$editing) {
                innerElement = $('.editor-text-editor .element-main');
            }

            if (innerElement.length) {
                element = innerElement;
            }

            let height;
            let width;

            if (this.isText && this.hasAdvancedFilling) {
                const rect = this.setEffectPadding(element);
                height = rect.height;
                width = rect.width;
            } else {
                height = element.prop('offsetHeight') || 0;
                width = element.prop('offsetWidth') || 0;
            }

            return {
                height: height * zoom,
                width: width * zoom,
            };
        },

        // rect
        getRect() {
            // const superMethods = BaseElement.find((v) => v.name === 'base-element').methods;
            const rect = this._getRect(); // .call(this);
            const { width, height } = rect;

            const zoom = this.global.zoom;
            // fontSizeScale
            const fontSizeScale = this.fontSizeScale;

            // dom 可能并不存在，getRect 获取的宽高可能为 0
            rect.originWidth = rect.width;
            rect.originHeight = rect.height;

            rect.height =
                height * fontSizeScale + (this.model.padding[0] + this.model.padding[2]) * zoom;
            rect.width =
                width * fontSizeScale + (this.model.padding[1] + this.model.padding[3]) * zoom;

            // 需减去最后一个字间距
            const isVertical = this.model.writingMode === 'vertical-rl';
            if (isVertical) {
                rect.height -= Math.max(0, this.model.letterSpacing * zoom);
            } else {
                rect.width -= Math.max(0, this.model.letterSpacing * zoom);
            }

            return rect;
        },

        // 将 DOM 实际 rect 参数同步到 model 中
        syncRect() {
            if (this.options.mode === 'preview' || this.model.$resizeApi) {
                return;
            }

            // DOM 可能未更新，需延调用
            this.$nextTick(this.updateRect);
        },

        setEffectPadding(element) {
            const cachePadding = element.css('padding');

            element.css('padding', 0);
            const height = element.prop('offsetHeight') || 0;
            const width = element.prop('offsetWidth') || 0;

            const isVertical = this.model.writingMode === 'vertical-rl';
            const bbox = utils.getBBoxByBBoxs(
                Array.from(element[0].children).map((item) => {
                    return {
                        width: item.offsetWidth,
                        height: item.offsetHeight,
                        left: item.offsetLeft,
                        top: item.offsetTop,
                    };
                }),
            );
            element.css('padding', cachePadding);

            // 当判断子元素包围盒超过，容器区域时，需要新增 padding 处理，避免特效被裁剪
            if (isVertical && !this.isFixedSize && bbox.width > width) {
                // chrome 竖排时，子节点 span 的 offsetLeft 计算方式有点奇怪，此时做个简单的校准
                // 出现以上情况时，子元素实际位置会大幅向左偏移，导致padding计算异常，所以这里按居中处理，做层 hack
                if (bbox.left * -1 < (bbox.width - width) / 5) {
                    bbox.left = ((bbox.width - width) / 2) * -1;
                }

                const paddingLeft = bbox.left * -1;
                this.$set(this.model, '$effectPadding', [
                    0,
                    bbox.width - paddingLeft - width,
                    0,
                    paddingLeft,
                ]);
            } else if (!isVertical && !this.isFixedSize && bbox.height > height) {
                const paddingTop = bbox.top * -1;
                this.$set(this.model, '$effectPadding', [
                    paddingTop,
                    0,
                    bbox.height - paddingTop - height,
                    0,
                ]);
            } else {
                this.$set(this.model, '$effectPadding', null);
            }

            return {
                width,
                height,
            };
        },
        deleteEffectPadding() {
            this.$delete(this.model, '$effectPadding');
        },
        checkAdvancedFilling(effect) {
            return (
                effect.filling &&
                effect.filling.enable &&
                effect.filling.type !== 0 &&
                effect.filling.type !== 'color'
            );
        },
    },

    watch: {
        hasAdvancedFilling(v) {
            if (v) return;
            this.deleteEffectPadding();
        },
        'model.fontFamily'() {
            this.checkLoad();
        },
        'model.listStyle'() {
            this.syncRect();
        },
        'model.autoAdaptive'() {
            this.syncRect();
        },
    },
    events: {
        'element.loaded'(model) {
            if (model === this.model) {
                this.syncRect();
            }
        },
        'element.transformStart'(model, { action, dir }) {
            if (action !== 'resize' || !this.isDesignMode) return;

            const autoAdaptive = this.model.autoAdaptive;
            // 手动拉大缩小文本宽度时取消高、宽自增
            if (dir.length === 1 && autoAdaptive) {
                let isInclude = false;

                if (isGroup(model)) {
                    const parents = this.editor.getParentGroups(this.model);
                    isInclude =
                        model.type !== 'flex' &&
                        parents
                            .map((item) => item.$id)
                            .concat(this.model.$id)
                            .includes(this.model.$id);
                } else {
                    isInclude = model === this.model;
                }
                const dirMap = {
                    s1: 0b00,
                    n1: 0b00,
                    w2: 0b00,
                    e2: 0b00,
                    s3: 0b10,
                    n3: 0b10,
                    w3: 0b01,
                    e3: 0b01,
                };

                if (isInclude && dirMap[dir + autoAdaptive] !== undefined) {
                    this.model.autoAdaptive = dirMap[dir + autoAdaptive];
                }
            }

            const { width, height } = this.rect;
            this.$textResizeMeta = {
                width,
                height,
                letterSpacing: this.model.letterSpacing,
                fontSize: this.model.fontSize,
                contents: cloneDeep(this.model.contents),
                padding: cloneDeep(this.model.padding),
            };
        },
        'element.transformEnd'(model, drag, { action }) {
            if (action !== 'resize' || !this.isDesignMode) return;
            delete this.$textResizeMeta;

            // TODO: 文字容器中单向拖拽，文字存在自动换行，此时需自适应
            // 若要在 transformResize 的过程实时更新 rect
            // 需更新 drag 的 cache 状态，group 的 cahce，svg 的 cache，较繁琐
            if (
                ['w', 'e', 'n', 's'].indexOf(drag.dir) !== -1 &&
                model === this.$parent.model &&
                model.autoGrow
            ) {
                const zoom = this.global.zoom;
                const rect = this.getRect();
                const height = rect.height / zoom - this.model.height;
                const width = rect.width / zoom - this.model.width;

                if (Math.abs(height) > 0.5 || Math.abs(width) > 0.5) {
                    this.model.height = rect.height / zoom;
                    this.model.width = rect.width / zoom;

                    this.$events.$emit(
                        'element.rectUpdate',
                        this.model,
                        {
                            height,
                            width,
                        },
                        true,
                    );
                }
            }
        },
        'element.transformResize'(drag, model) {
            if (model !== this.model || !this.isDesignMode) return;

            if (!model.autoScale) return;

            // 高度自增文本框，文本自增方向上拖拽则使用拖拽高度
            const isHorizontal = this.model.writingMode === 'horizontal-tb';
            const { dir } = drag;
            if (
                model.autoAdaptive &&
                ((isHorizontal && (dir === 'n' || dir === 's')) ||
                    (!isHorizontal && (dir === 'w' || dir === 'e')))
            ) {
                return;
            }

            // 对 autoScale 文本框，四角方向拖拽时作等比缩放
            if (dir.length > 1) {
                const currRect = this.rect;
                const baseText = this.$textResizeMeta;
                // 原文本框缩放至 0 宽高后，展开时按 1:1 处理
                const ratio = isHorizontal
                    ? currRect.width / (baseText.width || 1)
                    : currRect.height / (baseText.height || 1);

                fitText(model, baseText, ratio);
            }
            // 纵横向拖拽时与非 autoScale 一致, 拖拽过程可能换行需 syncRect
            else {
                this.syncRect();
            }
        },
        'element.change'(model, propName) {
            if (propName === 'contents' && this.isLinkWith(model)) {
                const contents = cloneDeep(this.model.contents);
                const content = model.contents
                    .reduce((list, content) => {
                        list.push(content.content);
                        return list;
                    }, [])
                    .join('');

                if (!contents || contents.length === 0) {
                    this.model.contents = [{ content: content }];
                } else {
                    contents.reduce((startIndex, contentBody, index) => {
                        if (startIndex < content.length) {
                            const length = contentBody.content.length;
                            let append = '';
                            if (
                                startIndex + length > content.length ||
                                index === contents.length - 1
                            ) {
                                append = content.substring(startIndex);
                            } else {
                                append = content.substring(startIndex, startIndex + length);
                            }
                            contentBody.content = append;
                            startIndex += append.length;
                        } else {
                            contentBody.content = '';
                        }

                        return startIndex;
                    }, 0);
                }

                this.editor.changeElement(
                    {
                        content,
                        contents,
                    },
                    this.model,
                    false,
                );
                this.syncRect();
            }
        },
    },

    mounted() {
        this.syncRect();
        this.$watch(
            () => this.model.$renderProps,
            () => debounceUpdateMaskInfo(this.model, this.editor),
            { deep: true },
        );
    },

    beforeDestroy() {
        const elem = this.editElement;
        const layout = this.editor.currentLayout;
        const isNeedDel = elem && !elem.content.trim();

        if (isNeedDel && layout.elements.find((el) => el === elem) && this.removeEmptyEnable) {
            this.editor.removeElement(elem, layout);
        }
    },
};
export default inherit(BaseElement, textBase);
