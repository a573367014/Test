import $ from '@gaoding/editor-utils/zepto';
import Promise from 'bluebird';
import pack from 'bin-pack';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import templetUtils from '@gaoding/editor-utils/templet';
import { getBrowserZoom } from '@gaoding/editor-utils/ua';
import { calculateExpand } from '@gaoding/editor-utils/effect/browser/expand';

import TextModel from './text-model';
import {
    checkLoaded,
    replaceUrl,
    createStyle,
    CLASS_PREFIX,
    isSupportCross,
    effectClassMap,
} from './utils';
import { loadFonts, loadImage } from './utils/loader';

let isSupportPromise;
const isEdge = window.navigator.userAgent.indexOf('Edge') > -1;
const debugHtml = false;
const { max, min, abs, ceil } = Math;

const filterTextModels = (models) => {
    const result = [];

    templetUtils.walkTemplet(
        (elem) => {
            if (
                elem.type === 'text' &&
                elem.width >= 1 &&
                elem.height >= 1 &&
                ['width', 'height'].every((val) => elem[val] < 13000)
            )
                result.push(elem);
        },
        // 水印内部文本canvas方案出图即可
        (element) => element.type !== 'watermark',
        [{ elements: models }],
    );

    return result;
};

export default class SvgText {
    constructor(models, editor) {
        models = filterTextModels(models.elements || models);

        this.editor = editor;
        this.canvas = createCanvas();

        this.fonts = [];
        this.spriteInfo = {};

        if (models.length) {
            this.init(models);
        }
    }

    getUsedFonts() {
        const fontsMap = {};
        const options = this.editor.options;
        const fontSubset = options.fontSubset;

        this.models.forEach((model) => {
            // get font info
            model.contents.forEach((item) => {
                const family = item.fontFamily || model.fontFamily;
                const font = options.fontsMap[family] || options.defaultFont;
                fontsMap[font.name + font.family] = font;
            });
        });

        const fonts = Object.values(fontsMap);

        // 是否启用子集化
        const exportEnableCallback =
            fontSubset.getUrl &&
            fontSubset.supportTypes &&
            fontSubset.supportTypes.includes('text') &&
            fontSubset.exportEnableCallback;
        const exportEnable = exportEnableCallback && exportEnableCallback(this.editor);

        if (fonts.length > 10 && !exportEnable) {
            throw new Error('字体最多为10个');
        }

        return fonts;
    }

    getSpriteRects() {
        let spriteRects = [];

        const browserZoom = getBrowserZoom();
        const { models, textModels } = this;
        const temWrap = $(
            `<div style="position: absolute; top: 0; left: -10000px;">${createStyle()}</div>`,
        );

        textModels.forEach((textModel) => temWrap.append(textModel.getHTML('', false)));
        temWrap.appendTo(document.body);

        temWrap.find(`.${CLASS_PREFIX}element`).each((i, elem) => {
            const elemBouding = elem.getBoundingClientRect();
            const boundings = [elemBouding];

            $(elem)
                .find(`.${CLASS_PREFIX}element-main span`)
                .each((spanI, spanElem) => boundings.push(spanElem.getBoundingClientRect()));

            // 浏览器缩放后会导致出图出现高宽误差
            const browserZoomExpand = max(
                0,
                (elemBouding.height * 100) / browserZoom - elemBouding.height,
            );

            const BBOX = {
                left: min(...boundings.map((r) => r.left)),
                top: min(...boundings.map((r) => r.top)),
                right: max(...boundings.map((r) => r.right)),
                bottom: max(...boundings.map((r) => r.bottom)) + browserZoomExpand,
            };

            BBOX.width = BBOX.right - BBOX.left;
            BBOX.height = BBOX.bottom - BBOX.top;

            const model = models[i];
            const expand = calculateExpand(model);

            // 防止文字下划线超出边界
            // 竖排在左边
            // 负间距会导致文本超出实际容器范围导致出图异常
            const letterSpacingExpand = min(0, model.letterSpacing) * -1;
            const baseNum = ceil(model.fontSize / 2) + letterSpacingExpand;

            expand.left = max(baseNum, expand.left);
            expand.top = max(baseNum, expand.top);
            expand.right = max(baseNum, expand.right);
            expand.bottom = max(baseNum, expand.bottom);

            spriteRects.push({
                id: model.$id,
                expand,
                width: BBOX.width + expand.left + expand.right,
                height: BBOX.height + expand.top + expand.bottom,
                offsetX: elemBouding.left - BBOX.left + expand.left,
                offsetY: elemBouding.top - BBOX.top + expand.top,
            });
        });

        temWrap.remove();

        // 雪碧图排列信息
        spriteRects = pack(spriteRects);
        spriteRects.itemsMap = spriteRects.items.reduce((obj, b) => {
            obj[b.item.id] = b;
            return obj;
        }, {});

        return spriteRects;
    }

    init(models) {
        // models 可能被后续加工，列入 newModel = {...model},
        // 导致无法查看到到原始 model $loaded 的状态, 此处需获取实际的 model 去checkloaded
        models = models.map((model) => {
            return (
                this.editor.getElement(model.$id, { queryCurrntElement: false, deep: true }) ||
                model
            );
        });

        this.models = models;
        this.textModels = models.map((model) => new TextModel(model, this.editor));

        this._initPromise = Promise.map(this.models, checkLoaded)
            .then(() => {
                return this.getSpriteRects();
            })
            .then((spriteInfo) => {
                if (spriteInfo.width > 16000 || spriteInfo.height > 16000) {
                    throw new Error('精灵图尺寸超出 canvas 最大限制');
                }

                this.spriteInfo = spriteInfo;
                this.fonts = this.getUsedFonts();
                return this.fonts;
            });
    }

    createSvg(fonts) {
        const {
            spriteInfo: { width, height, itemsMap },
            textModels,
        } = this;

        const contentHtml = textModels
            .map((textModel) => {
                const box = itemsMap[textModel.model.$id];
                return textModel.getHTML(
                    `left: ${box.x + box.item.offsetX}px; top: ${box.y + box.item.offsetY}px`,
                );
            })
            .join('');

        let effectStyle = '';
        effectClassMap.forEach((value) => {
            effectStyle += value.styleStr;
        });

        return Promise.all([replaceUrl(effectStyle), replaceUrl(contentHtml)])
            .then(([effectStyle, contentHtml]) => {
                let styleHtml = effectStyle;
                fonts.forEach((font) => {
                    if (font.dataURL) {
                        styleHtml += `@font-face {font-family: "${font.name}";src: url(${font.dataURL}) format('woff');font-display: swap;font-weight: ${font.weight}}`;
                    }
                });

                const svgString = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${createStyle()}<style>${styleHtml}</style><foreignObject x="0" y="0" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px; position: relative">${contentHtml}</div></foreignObject></svg>`;

                let url;
                if (!isEdge) {
                    url = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgString);
                } else {
                    const blob = new Blob([svgString], { type: 'image/svg+xml' });
                    url = URL.createObjectURL(blob);
                }

                debugHtml && $(svgString).appendTo(document.body);
                return loadImage(url).delay(window.safari ? 3000 : 500);
            })
            .then((img) => {
                debugHtml && $(img).appendTo(document.body);
                return img;
            });
    }

    createCanvas(fonts) {
        return this.createSvg(fonts).then((spriteImg) => {
            const { width, height } = spriteImg;

            // 预留10个像素，部分手机如 ios 版本 14，draimage 全参数时，实际内容不能超出 canvas 大小，否则无法正常渲染
            const canvas = createCanvas(width + 10, height + 10);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(spriteImg, 0, 0, width, height);
            return canvas;
        });
    }

    drawTexts() {
        if (!this._initPromise) return Promise.resolve([]);
        console.time('svg export');

        if (!isSupportPromise) {
            isSupportPromise = isSupportCross();
        }

        return isSupportPromise
            .then((isSupport) => {
                if (!isSupport) {
                    throw new Error('不支持svg导出');
                }

                return this._initPromise;
            })
            .then((fonts) => {
                console.time('loadFonts');
                return loadFonts(fonts, this.editor);
            })
            .then((fonts) => {
                console.timeEnd('loadFonts');
                console.time('svg export createSvg');

                return this.createCanvas(fonts).then((canvas) => {
                    /*
                     *TODO: 待修复, 目前先兼容处理
                     *safari 采用 svg 出图并拥有图片填充时, 第一次绘制存在文字丢失
                     *怀疑是浏览器对 svg 出图的加载或缓存相关兼容问题
                     *尝试重复执行加载无效，必须重复加载 + 绘制
                     */
                    const needRepeat =
                        window.safari && this.textModels.some((model) => model.hasImageFilling);
                    return needRepeat ? this.createCanvas(fonts) : canvas;
                });
            })
            .then((spriteCanvas) => {
                debugHtml && $(spriteCanvas).appendTo(document.body);
                console.timeEnd('svg export createSvg');
                const { itemsMap } = this.spriteInfo;

                return Promise.map(this.models, (model) => {
                    const data = itemsMap[model.$id];
                    const canvas = createCanvas(Math.max(1, data.width), Math.max(1, data.height));
                    canvas
                        .getContext('2d')
                        .drawImage(
                            spriteCanvas,
                            Math.round(data.x),
                            Math.round(data.y),
                            Math.round(data.width),
                            Math.round(data.height),
                            0,
                            0,
                            Math.round(data.width),
                            Math.round(data.height),
                        );

                    debugHtml && $(canvas).appendTo(document.body);

                    return {
                        modelId: model.$id,
                        offsetX: data.item.offsetX,
                        offsetY: data.item.offsetY,
                        canvas,
                    };
                });
            })
            .then((datas) => {
                console.timeEnd('svg export');
                return datas;
            });
    }
}
