import { unescape } from 'lodash';
import templetUtils from '@gaoding/editor-utils/templet';

const MAX_LENGTH = 500;
/* eslint-disable-next-line */
const rControl =
    /[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000b\u000c\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f\u007F]/gm;
const rEmoji = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;
const rBreakLine = /<br>|\r|\n/g;

const listStyleMap = {
    decimal: '0123456789.',
    'upper-alpha': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.',
    'lower-alpha': 'abcdefghijklmnopqrstuvwxyz.',
    'cjk-ideographic': '一二三四五六七八九十、',
    'decimal-leading-zero': '0123456789.',
};

function getFontsSubset(layouts, options) {
    const { supportTypes = ['text'] } = options.fontSubset || {};
    const fontsContent = {};
    const textElements = [];

    templetUtils.walkTemplet(
        (element) => {
            const hasContent = (element.contents && element.contents.length) || element.content;
            if (supportTypes.indexOf(element.type) !== -1 && hasContent) {
                textElements.push(element);
            }
        },
        true,
        layouts,
    );

    textElements.forEach((element) => {
        let { contents, content, fontFamily } = element;
        contents = contents && contents.length > 0 ? contents : [{ content: content }];

        contents.forEach((item) => {
            const defFont = options.fontsMap[fontFamily];
            const font = options.fontsMap[item.fontFamily] || defFont;

            if (!font) return;
            if (!fontsContent[font.name]) {
                fontsContent[font.name] = options.fontSubset.defaultContent || '';
            }

            fontsContent[font.name] += item.content;

            if (!defFont || !listStyleMap[element.listStyle]) return;
            if (!fontsContent[defFont.name]) {
                fontsContent[defFont.name] = '';
            }

            fontsContent[defFont.name] += listStyleMap[element.listStyle];
        });
    });

    Object.keys(fontsContent).forEach((key) => {
        fontsContent[key] = unescape(fontsContent[key]);
        fontsContent[key] = new Set(fontsContent[key]);
        fontsContent[key] = Array.from(fontsContent[key]);
        fontsContent[key] = fontsContent[key].sort().join('');
        fontsContent[key] = fontsContent[key]
            .replace(rBreakLine, '')
            .replace(rEmoji, '')
            .replace(rControl, '');
    });

    return fontsContent;
}

function getUpdateFontsSubset(layouts, options) {
    const fontsContent = getFontsSubset(layouts, options);
    const result = {};
    const arr = Object.keys(fontsContent).filter((key) => {
        const font = options.fontsMap[key];
        const content = fontsContent[key];
        const cacheContent =
            options.fontSubsetsMap[font.name] && options.fontSubsetsMap[font.name].subsetContent;

        if (!cacheContent) {
            result[key] = content;
            return true;
        }

        // 有一个字不在之前的缓存中，就判断需要更新字体子集
        for (let i = 0; i < content.length; i++) {
            const str = content.charAt(i);
            if (cacheContent.indexOf(str) === -1) {
                result[key] = fontsContent[key];
                return true;
            }
        }

        return false;
    });

    return arr.length ? result : null;
}

function loadFontsSubset(layouts, options) {
    const fontData = getUpdateFontsSubset(layouts, options);

    if (fontData && options.fontSubset.getUrl) {
        Object.keys(fontData).forEach((key) => {
            const font = options.fontsMap[key];
            const fontSubset = options.fontSubsetsMap[font.name];

            if (fontData[key] && fontData[key].length < MAX_LENGTH) {
                options.fontSubsetsMap[font.name] = {
                    loadType: fontSubset ? fontSubset.loadType : 'subset',
                    subsetContent: fontData[key],
                    subsetPromise: options.fontSubset.getUrl(font, fontData[key]),
                };
            } else {
                delete options.fontSubsetsMap[font.name];
            }
        });
    }
}

export { loadFontsSubset, getFontsSubset, getUpdateFontsSubset };
