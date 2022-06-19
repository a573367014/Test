import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba, useEffects } from '@gaoding/editor-framework/src/utils/model-adaptation';
import { get, escape } from 'lodash';
import { version, serialize } from '@gaoding/editor-framework/src/utils/utils';
import { MODIFY_MIN_FONTSIZE_VERSION } from '@gaoding/editor-framework/src/utils/consts';

class TextModel extends BaseModel {
    constructor(data) {
        super(data);

        // Compatible 修正颜色 支持8为16进制： #000000FF
        if (this.backgroundColor) {
            this.backgroundColor = hexaToRgba(this.backgroundColor);
        }

        if (this.color) {
            this.color = hexaToRgba(this.color);
        }

        if (this.textShadow) {
            const shadow = this.textShadow;

            shadow.color = hexaToRgba(shadow.color);
        }

        if (this.textEffects && this.textEffects.length) {
            // 有效特效层并且无填充时，回退到文字颜色，主要避免右侧面板金字塔交互规则异常
            // this.textEffects.forEach((effect) => {
            //     if (!effect.enable) return;
            //     if (effect.filling && effect.filling.enable) return;
            //     const contents = this.contents || [];
            //     const colors = uniq(contents.map((item) => item.color).filter((color) => color));
            //     if (colors.length > 1) return;

            //     this.color = hexaToRgba(colors[0] || this.color);
            //     effect.filling = cloneDeep(editorDefaults.effect.filling);
            //     effect.filling.color = this.color;
            //     effect.filling.enable = true;
            // });

            this.textEffects.forEach((effect) => {
                if (effect.stroke) {
                    effect.stroke.color = hexaToRgba(effect.stroke.color);
                }

                if (effect.shadow) {
                    effect.shadow.color = hexaToRgba(effect.shadow.color);
                }

                if (effect.insetShadow) {
                    effect.insetShadow.color = hexaToRgba(effect.insetShadow.color);
                }

                if (effect.filling) {
                    effect.filling.color = hexaToRgba(effect.filling.color);
                    const stops = get(effect, 'filling.gradient.stops');
                    stops &&
                        stops.forEach((stopPoint) => {
                            stopPoint.color = hexaToRgba(stopPoint.color);
                        });
                }
            });
        }

        if (this.shadows) {
            this.shadows.forEach((shadow) => {
                if (shadow.color) {
                    shadow.color = hexaToRgba(shadow.color);
                }
            });
        }

        useEffects(this, true);

        // @TODO model schema
        // 修复行高为字符串问题
        if (typeof this.lineHeight === 'string') {
            this.lineHeight = Number(this.lineHeight) || 1.2;
        }

        // 修复子间距为字符串问题
        if (typeof this.letterSpacing === 'string') {
            this.letterSpacing = Number(this.letterSpacing) || 0;
        }

        // 自动配置文本 autoScale
        const { writingMode = 'horizontal-tb', resize } = data;

        // 6个点时字号大小强制支持自动缩放
        if (
            !this.autoScale &&
            ((writingMode === 'horizontal-tb' && resize === 0b101) ||
                (writingMode === 'vertical-rl' && resize === 0b011))
        ) {
            this.autoScale = true;
        }

        if (
            data.autoAdaptive === undefined &&
            this.writingMode === 'vertical-rl' &&
            this.resize === 0b101 &&
            this.autoScale
        ) {
            data.resize = this.resize = 0b011;
        } else if (
            data.autoAdaptive === undefined &&
            this.writingMode !== 'vertical-rl' &&
            this.resize === 0b011 &&
            this.autoScale
        ) {
            data.resize = this.resize = 0b101;
        }

        if (data.autoAdaptive === undefined) {
            const autoAdaptiveMap = {
                0b000: 0b11,
                0b001: 0b11,
                0b010: 0b10,
                0b011: 0b10,
                0b100: 0b01,
                0b101: 0b01,
                0b110: 0b00,
                0b111: 0b00,
            };
            this.autoAdaptive = autoAdaptiveMap[this.resize];
        }

        if (!this.contents || !this.contents.length) {
            const content = !this.listStyle
                ? escape(this.content)
                : `<ul><li>${escape(this.content)}</li></ul>`;
            this.contents = serialize.fromJSON(content || '', Object.assign({}, this), {
                listStyle: this.listStyle,
            });
        }

        // 修复PPT解析文件过来的错误数据，类型应该为number
        const getFontWeight = (fontWeight) => {
            return { normal: 400, bold: 700 }[fontWeight] || fontWeight || 400;
        };
        this.fontWeight = getFontWeight(this.fontWeight);

        // 修复历史数据 contents 没有存在默认值, content 为空的情况下过滤
        this.contents = this.contents
            .map((item) => {
                item = Object.assign(
                    {},
                    {
                        color: this.color,
                        fontFamily: this.fontFamily,
                        fontStyle: this.fontStyle || 'normal',
                        fontSize: this.fontSize,
                        fontWeight: this.fontWeight,
                        textDecoration: this.textDecoration || 'none',
                    },
                    item,
                );
                item.fontWeight = getFontWeight(item.fontWeight);
                return item;
            })
            .filter((item) => item.content);
    }

    get $miniFontSize() {
        return version.checkVersion(this.version, MODIFY_MIN_FONTSIZE_VERSION) ? 12 : 14;
    }

    get $renderProps() {
        return [
            this.maskInfo.enable,
            this.width,
            this.height,
            this.lineHeight,
            this.letterSpacing,
            this.fontFamily,
            this.fontSize,
            this.fontWeight,
            this.textAlign,
            this.autoAdaptive,
            this.textDecoration,
            this.textShadow,
            this.contents,
            this.opacity,
            this.textEffects,
            this.shadows,
        ];
    }
}

export default TextModel;
