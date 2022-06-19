import Promise from 'bluebird';
import { get } from 'lodash';
import { getGsubVrtrCharMap } from './index';
import { load } from 'opentype.js';
import utils from '@gaoding/editor-framework/src/utils/utils';

const cache = {};
// 这些中文符号也需要旋转90度
const CN_WHILE_LIST = ['—', '…', '“', '”', '﹏', '﹋', '﹌', '‘', '’', '˜'];
// 这些英文符号也不需要旋转90度
const EN_BLACK_LIST = ['©', '®', '÷'];

export default class FontPath {
    /***
     * fontData = options.fontList[n]
     */
    constructor(fontData, model) {
        this.font = null;
        this.model = model;
        this.fontData = fontData;

        return new Proxy(this, {
            get(target, property) {
                if (target.font) {
                    return target.font['$' + property] || target.font[property] || target[property];
                } else {
                    return target[property];
                }
            },
        });
    }

    load() {
        const fontData = this.fontData;
        if (cache[fontData.name]) return cache[fontData.name];

        cache[fontData.name] = new Promise((resolve, reject) => {
            load(fontData.woff || fontData.ttf, (err, font) => {
                if (err) {
                    reject(err);
                    return;
                }

                this._initMethods(font);
                resolve(font);
            });
        })
            .then((font) => {
                this.font = font;
                return this;
            })
            .catch((e) => {
                delete cache[fontData.name];
                throw e;
            });

        return cache[fontData.name];
    }

    _initMethods(font) {
        const { fontData, model } = this;
        const vertialGlyphIndexMap = getGsubVrtrCharMap(font);
        const getIsVertical = () => {
            return model.writingMode.includes('vertical');
        };

        font.name = fontData.name;
        font.typoDescender = get(font, 'tables.os2.sTypoDescender');
        font.typoAscender = get(font, 'tables.os2.sTypoAscender');
        font.typoLinegap = get(font, 'tables.os2.sTypoLineGap');
        font.usWinAscent = font.ascender; // get(font, 'tables.os2.usWinAscent') || font.ascender;
        font.usWinDescent = font.descender; // get(font, 'tables.os2.usWinDescent') || font.descender;

        font.$getInfo = function (word) {
            const { content, fontSize } = word;
            const { usWinAscent, usWinDescent, unitsPerEm, tables } = this;

            const fontSizePx = ((usWinAscent + Math.abs(usWinDescent)) / unitsPerEm) * fontSize;
            const baseLine = (usWinAscent / unitsPerEm) * fontSize;

            const yStrikeoutPosition = usWinAscent - tables.os2.yStrikeoutPosition;
            const yStrikeoutPositionPx = (yStrikeoutPosition / unitsPerEm) * fontSize;

            const yStrikeoutSize = tables.os2.yStrikeoutSize;
            const yStrikeoutSizePx = (yStrikeoutSize / unitsPerEm) * fontSize;

            const underlinePosition = usWinAscent - tables.post.underlinePosition;
            const underlinePositionPx = (underlinePosition / unitsPerEm) * fontSize;

            const underlineThickness = tables.post.underlineThickness;
            const underlineThicknessPx = (underlineThickness / unitsPerEm) * fontSize;

            const advanceWidthPx = font.getAdvanceWidth(content, fontSize);

            return {
                // 文字包围盒高度
                boxHeight: fontSizePx,
                // 文字包围盒宽度
                boxWidth: advanceWidthPx,
                // 下划线位置
                underlinePosition: underlinePositionPx,
                // 下划线线宽
                underlineThickness: underlineThicknessPx,
                // 删除线位置
                yStrikeoutPosition: yStrikeoutPositionPx,
                // 删除线线宽
                yStrikeoutSize: yStrikeoutSizePx,
                // 基线位置
                baseLine,
            };
        };

        font.$setItalic = function (path, word, basePoint) {
            if (fontData.style === 'italic') return;
            const { content, left, top, fontSize } = word;
            const { baseLine, boxWidth } = font.$getInfo({ fontSize, content });
            const base = basePoint || {
                y: top + baseLine,
                x: left + boxWidth / 2,
            };

            // 模拟浏览器斜体
            path.commands.forEach((item) => {
                ['', '1', '2'].forEach((key) => {
                    if (item['x' + key]) {
                        const point = utils.getSkewPoint(
                            {
                                x: item['x' + key],
                                y: item['y' + key],
                            },
                            base,
                            -0.24,
                            0,
                        );

                        item['x' + key] = point.x;
                        item['y' + key] = point.y;
                    }
                });
            });
        };

        font.$setTextDecoration = function (path, word) {
            const isVertical = getIsVertical();

            const { content, left, top, width, height, fontSize } = word;
            const { yStrikeoutPosition, underlinePosition, boxHeight } = font.$getInfo({
                fontSize,
                content,
            });
            const lineWidth = 0.1 * fontSize;

            const fnX = (y, lineWidth) => {
                return [
                    {
                        type: 'M',
                        x: left,
                        y,
                    },
                    {
                        type: 'L',
                        x: left + width,
                        y,
                    },
                    {
                        type: 'L',
                        x: left + width,
                        y: y + lineWidth,
                    },
                    {
                        type: 'L',
                        x: left,
                        y: y + lineWidth,
                    },
                    {
                        type: 'Z',
                    },
                ];
            };

            const fnY = (x, lineWidth) => {
                return [
                    {
                        type: 'M',
                        x,
                        y: top,
                    },
                    {
                        type: 'L',
                        x,
                        y: top + height,
                    },
                    {
                        type: 'L',
                        x: x + lineWidth,
                        y: top + height,
                    },
                    {
                        type: 'L',
                        x: x + lineWidth,
                        y: top,
                    },
                    {
                        type: 'Z',
                    },
                ];
            };

            if (isVertical) {
                path.lineThroughCommands = fnY(Math.max(left + width / 2, 1), lineWidth);

                path.underlineCommands = fnY(Math.max(left, 1), lineWidth);

                path.clickAreaCommands = fnY(Math.max(left, 1), boxHeight);
            } else {
                path.lineThroughCommands = fnX(Math.max(top + yStrikeoutPosition, 1), lineWidth);

                path.underlineCommands = fnX(Math.max(top + underlinePosition, 1), lineWidth);

                path.clickAreaCommands = fnX(Math.max(top, 1), boxHeight);
            }
        };

        font.$getPathByData = function (word) {
            const { content, left, top, fontSize, textWidth, textHeight } = word;
            const { baseLine, boxHeight, boxWidth } = font.$getInfo({ fontSize, content });
            const isVertical = getIsVertical();

            // 根据竖排映射表匹配并替换中文符号
            const vertialIndex = isVertical && vertialGlyphIndexMap[font.charToGlyphIndex(content)];

            const dx = isVertical ? boxHeight - boxWidth : 0;
            const dy =
                isVertical && Math.abs(textWidth - textHeight) > 0.1
                    ? ((this.usWinAscent - this.typoAscender) /
                          (this.usWinAscent + Math.abs(this.usWinDescent))) *
                      boxHeight
                    : 0;

            const x = left + dx / 2;
            const y = top + baseLine - dy;
            let path;

            // 英文字母、符号需要旋转
            if (
                isVertical &&
                ((!EN_BLACK_LIST.includes(content) && content.charCodeAt() <= 256) ||
                    CN_WHILE_LIST.includes(content))
            ) {
                path = font.getPath(
                    content,
                    x,
                    top + baseLine - (boxHeight - boxWidth) / 2,
                    fontSize,
                );

                // 以横排的包围盒中心点为基点进行旋转
                const base = {
                    y: top - (boxHeight - boxWidth) / 2 + boxHeight / 2,
                    x: x + boxWidth / 2,
                };

                if (word.fontStyle === 'italic') {
                    this.$setItalic(
                        path,
                        word,
                        isVertical
                            ? {
                                  y: top - (boxHeight - boxWidth) / 2 + baseLine,
                                  x: base.x,
                              }
                            : null,
                    );
                }

                // 旋转字符
                path.commands.forEach((item) => {
                    ['', '1', '2'].forEach((key) => {
                        if (item['x' + key]) {
                            const point = utils.getPointPosition(
                                {
                                    x: item['x' + key],
                                    y: item['y' + key],
                                },
                                base,
                                90,
                            );

                            item['x' + key] = point.x;
                            item['y' + key] = point.y;
                        }
                    });
                });
            }
            // 根据竖排映射表匹配并替换中文符号
            else if (vertialIndex) {
                path = font.glyphs.glyphs[vertialIndex].getPath(x, y, fontSize);

                if (word.fontStyle === 'italic') {
                    this.$setItalic(
                        path,
                        word,
                        isVertical
                            ? {
                                  y:
                                      top +
                                      (this.typoAscender /
                                          (this.usWinAscent + Math.abs(this.usWinDescent))) *
                                          boxHeight,
                                  x: x + boxWidth / 2,
                              }
                            : null,
                    );
                }
            } else {
                path = font.getPath(content, x, y, fontSize);

                if (word.fontStyle === 'italic') {
                    this.$setItalic(
                        path,
                        word,
                        isVertical
                            ? {
                                  y,
                                  x: x + boxHeight / 2,
                              }
                            : null,
                    );
                }
            }

            this.$setTextDecoration(path, word);
            return path;
        };
    }
}
