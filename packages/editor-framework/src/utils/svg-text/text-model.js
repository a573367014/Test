import serialize from '../rich-text/utils/serialize';
import { get } from 'lodash';
import tinycolor from 'tinycolor2';
import { CLASS_PREFIX, effectClassMap, setEffectClassMap } from './utils';
import ua from '@gaoding/editor-utils/ua';
import { getEffectShadowList } from '@gaoding/editor-utils/effect/browser/adaptor';
import { TextEffectEngine } from '@gaoding/editor-utils/effect/browser/text-effect-engine';

const { max, min } = Math;
const isFox = ua.isFox();

// 驼峰转中划线
function hyphenate(str) {
    return str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

export default class TextModel {
    constructor(model, editor) {
        this.model = model;
        this.editor = editor;
        this.options = editor.options;
        this.minFontSize = window.safari ? 1 : model.$miniFontSize;
        this.fallbackFonts = 'Arial,SimSun,Sans-Serif';
    }

    get color() {
        return this.model.color && tinycolor(this.model.color).toString('rgb');
    }

    get fontFamily() {
        let font = this.lastFont;
        if (!font || this.model.$loaded) {
            font = this.getCloseFont();
        }

        const fontNames = [
            `'${font.name + this.options.subsetSuffix}'`,
            `'${font.family + this.options.subsetSuffix}'`,
            `'${font.name}'`,
            `'${font.family}'`,
            this.fallbackFonts,
        ];

        return fontNames.join(',');
    }

    get isVertical() {
        const model = this.model;
        const writingMode = model.writingMode;
        return writingMode && writingMode.indexOf('vertical') > -1;
    }

    // 宽度自增
    get widthAutoScale() {
        const model = this.model;
        return [this.isVertical ? 0b01 : 0b10, 0b11].includes(model.autoAdaptive);
    }

    get contentsHTML() {
        const { model, options } = this;
        const contentsHTML = serialize.fromHTML(
            model.contents.map((content) => {
                const family = content.fontFamily || model.fontFamily;
                const font = options.fontsMap[family] || options.defaultFont;
                const fontSubsetEnable = this.options.fontSubset.getUrl;
                const subsetSuffix = this.options.subsetSuffix;

                const fontNames = (
                    fontSubsetEnable
                        ? [`"${font.name + subsetSuffix}"`, `"${font.family + subsetSuffix}"`]
                        : []
                ).concat([`"${font.name}"`, `"${font.family}"`, this.fallbackFonts]);

                return {
                    ...content,
                    fontFamily: fontNames.join(','),
                    textDecoration: content.textDecoration || model.textDecoration,
                    fontStyle: content.fontStyle || model.fontStyle,
                    fontWeight: content.fontWeight || model.fontWeight,
                };
            }),
            {
                listStyle: model.listStyle,
            },
        );
        // 需替换、否则svg转图片将失败
        return contentsHTML.replace(/<br>/g, '<br/>').replace(/&nbsp;/g, '&#160;');
    }

    get fontSizeScale() {
        const { model } = this;
        return Math.min(1, model.fontSize / this.minFontSize);
    }

    get letterSpacingScale() {
        const { model } = this;
        return this.fontSizeScale < 1 ? this.minFontSize / model.fontSize : 1;
    }

    get transformOrigin() {
        const { model } = this;
        const origin = [0, 0];
        const align = model.verticalAlign;

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
    }

    get mainTransform() {
        const fontSizeScale = this.fontSizeScale;
        return fontSizeScale < 1 ? 'scale(' + fontSizeScale + ')' : null;
    }

    get mainMinHeight() {
        const { model } = this;
        if (!this.isVertical) {
            return model.fontSize * model.lineHeight * this.fontSizeScale + 'px';
        } else {
            return 'initial';
        }
    }

    get mainMinWidth() {
        const { model } = this;
        if (this.isVertical) {
            return model.fontSize * model.lineHeight * this.fontSizeScale + 'px';
        } else {
            return 'initial';
        }
    }

    get mainWidth() {
        const fontSizeScale = this.fontSizeScale;
        const width = 100 / fontSizeScale;

        if (this.isVertical) {
            return 'auto';
        } else {
            return this.widthAutoScale ? 'auto' : `calc(${width}% + ${this.model.letterSpacing}px)`;
        }
    }

    get mainHeight() {
        const fontSizeScale = this.fontSizeScale;
        const height = 100 / fontSizeScale;

        if (!this.isVertical) {
            return 'auto';
        } else {
            return this.widthAutoScale
                ? 'auto'
                : `calc(${height}% + ${this.model.letterSpacing}px)`;
        }
    }

    get cssStyle() {
        const { model } = this;
        return [
            `height: ${model.height}px`,
            `width: ${model.width}px`,
            `overflow: ${model.autoAdaptive === 0 ? 'hidden' : 'visible'};`,
        ].join(';');
    }

    get innerStyle() {
        const { model } = this;

        return [
            `padding: ${model.padding.join('px ') + 'px'}`,
            `text-align: ${model.textAlign}`,
            `line-height: ${model.lineHeight}`,
        ].join(';');
    }

    get textStyle() {
        const { model } = this;
        const styles = [
            `font-family:${this.fontFamily}`,
            `font-size: ${Math.max(this.minFontSize, model.fontSize)}px`,
            `letter-spacing: ${model.letterSpacing}px`,
            `vertical-align: ${model.verticalAlign}`,
            `transform: ${this.mainTransform || 'none'}`,
            `transform-origin: ${this.transformOrigin}`,
            `min-width: ${this.mainMinWidth}`,
            `min-height: ${this.mainMinHeight}`,
            `width: ${this.mainWidth}`,
            `height: ${this.mainHeight}`,
            `color: ${this.color}`,
            `white-space: ${this.widthAutoScale ? 'nowrap' : ''}`,
        ];

        const $effectPadding = model.$effectPadding;
        if ($effectPadding) {
            styles.push(
                `padding: ${$effectPadding[0]}px ${$effectPadding[1]}px ${$effectPadding[2]}px ${$effectPadding[3]}px`,
                `margin-top: ${$effectPadding[0] * -1}px`,
                `margin-right: ${$effectPadding[3] * -1}px`,
            );
        }

        return styles.join(';');
    }

    get beforeStyle() {
        return `${!this.isVertical ? 'height: 100%; width: 0;' : 'width: 100%; height: 0'}`;
    }

    get hasEffects() {
        return this.effectShadowList.length;
    }

    get effectShadowList() {
        return getEffectShadowList(this.model);
    }

    getCloseFont(name = '') {
        const { fontsMap, defaultFont, fontList } = this.options;

        if (!name) {
            name = this.model.fontFamily;
        }

        return fontsMap[name] || fontsMap[defaultFont] || fontList[0];
    }

    getEffectShadowStyle(effect, enableEffect) {
        let style = {};

        if (!enableEffect) {
            return '';
        }
        const textEffectEngine = new TextEffectEngine();
        if (effect.shadow && effect.shadow.enable) {
            style = textEffectEngine.drawShadow(effect.shadow, this.model);

            // TODO: safari阴影偏移在 DOM 与 canvas 存在差异
            if (window.safari) {
                const isVertical = this.isVertical;
                let { offsetX, offsetY, color, blur } = effect.shadow;

                if (!isVertical) {
                    offsetY *= -1;
                } else if (isVertical) {
                    const temY = offsetY;
                    offsetY = offsetX;
                    offsetX = temY;
                }

                style.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
            }
        } else {
            style = textEffectEngine.drawEffect(effect, this.model);
        }

        const styles = Object.keys(style).reduce((r, _key) => {
            let key = hyphenate(_key);
            key = (key.indexOf('webkit') === 0 ? '-' : '') + key;

            r.push(key + ':' + style[_key]);
            return r;
        }, []);
        return styles.join(';');
    }

    getEffectsExpand() {
        const collect = {
            offset: {
                x: [0],
                y: [0],
            },
            shadow: {
                xblur: [0],
                yblur: [0],
            },
            stroke: [0],
        };

        this.effectShadowList.forEach(({ offset, shadow, stroke }) => {
            if (offset && offset.enable) {
                collect.offset.x.push(offset.x);
                collect.offset.y.push(offset.y);
            }
            if (shadow && shadow.enable) {
                const blur = shadow.blur + 0;
                let { offsetY, offsetX } = shadow;

                if (window.safari && !this.isVertical) {
                    offsetY *= -1;
                } else if (window.safari && this.isVertical) {
                    const temY = offsetY;
                    offsetY = offsetX;
                    offsetX = temY;
                }

                collect.shadow.xblur.push(offsetX + blur);
                collect.shadow.xblur.push(offsetX - blur);
                collect.shadow.yblur.push(offsetY + blur);
                collect.shadow.yblur.push(offsetY - blur);
            }
            if (stroke && stroke.enable) {
                // 10 是容错值，计算公式不一定准确
                collect.stroke.push(stroke.width + 10);
            }
        });

        const expand = {
            offset: {
                downX: max(...collect.offset.x),
                downY: max(...collect.offset.y),
                upX: min(...collect.offset.x),
                upY: min(...collect.offset.y),
            },
            shadow: {
                downXBlur: max(...collect.shadow.xblur),
                downYBlur: max(...collect.shadow.yblur),
                upXBlur: min(...collect.shadow.xblur),
                upYBlur: min(...collect.shadow.yblur),
            },
            stroke: max(...collect.stroke),
        };
        return {
            upX: expand.offset.upX + min(expand.shadow.upXBlur, -expand.stroke),
            upY: expand.offset.upY + min(expand.shadow.upYBlur, -expand.stroke),
            downX: expand.offset.downX + max(expand.shadow.downXBlur, expand.stroke),
            downY: expand.offset.downY + max(expand.shadow.downYBlur, expand.stroke),
        };
    }

    getHTML(style = '', enableEffect = true) {
        let i = 0;
        const {
            hasEffects,
            textStyle,
            contentsHTML,
            beforeStyle,
            effectShadowList,
            innerStyle,
            cssStyle,
            model,
        } = this;

        const effectStyles = effectShadowList.map((effect) => {
            setEffectClassMap(effect);
            const effectStyle = this.getEffectShadowStyle(effect, enableEffect);
            return textStyle + ';' + effectStyle;
        });

        const effectClassNames = effectShadowList.map((effect) => {
            if (
                get(effect, 'filling.enable') === false ||
                ![1, 'image'].includes(get(effect, 'filling.type')) ||
                !get(effect, 'filling.imageContent.image')
            )
                return '';

            const cache = effectClassMap.get(get(effect, 'filling.imageContent.image'));
            return cache ? cache.className : '';
        });

        const listStyle = model.listStyle;
        const elems = model.contents.filter((item) => item.beginParentTag === 'li');
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

        const listStyleClass = classArr.join(' ');

        const middleVClass = model.writingMode.includes('vertical') ? 'middle-v' : '';

        // element-position 的 middleVClass 不能去，ios 竖排出图会异常
        const html = hasEffects
            ? effectShadowList.reduce((str) => {
                  str += `
                <div class="${CLASS_PREFIX}element-position ${middleVClass}">
                    <div class="${CLASS_PREFIX}element-content ${listStyleClass} ${middleVClass}" style="${innerStyle}">
                        <span class="${CLASS_PREFIX}element-before" style="${beforeStyle}"></span>
                        <div class="${CLASS_PREFIX}element-main ${effectClassNames[i]}" style="${effectStyles[i]}">${contentsHTML}</div>
                    </div>
                </div>`;
                  i++;
                  return str;
              }, '')
            : `
        <div class="${CLASS_PREFIX}element-position ${middleVClass}">
            <div class="${CLASS_PREFIX}element-content ${listStyleClass} ${middleVClass}" style="${innerStyle}">
                <span class="${CLASS_PREFIX}element-before" style="${beforeStyle}"></span>
                <div class="${CLASS_PREFIX}element-main" style="${textStyle}">${contentsHTML}</div>
            </div>
        </div>`;

        return `<div class="${CLASS_PREFIX}element" style="${cssStyle + style}">${html}</div>`;
    }
}
