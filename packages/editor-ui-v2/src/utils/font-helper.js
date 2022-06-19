import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { googleFontsLicense, ddxsFontsLicense } from './font-license';
import { i18n } from '../i18n';

// 需提示版权风险
const isDev = process.env.VUE_APP_ENV === 'dev';
const isEnterprise = (process.env.VUE_APP_PROJECT_NAME || '').includes('enterprise');
// [14半拓展授权、18无版权、40&41 不可商用]
export const FONT_BUSINESS = [14, 18];
export const NOT_BUSINESS = [isDev ? 41 : 40];

// 权益类型
const FREE_TYPE = 'free';
const RISK_TYPE = 'risk';
const NOT_BUSINESS_TYPE = 'notBusiness';
const VIP_TYPE = 'vip';
const PURCHASED_TYPE = 'purchased';

export const THREE_UNSUPPORT_FONT_LIST = [
    'BearHandBrush',
    'Morning Star',
    'Loongtype-ShirupozhuGB-Regular',
];

export const tips = {
    vip: {
        content: (font) => {
            const isSVIP = [2, 5].includes(font.user_over_role);
            return `<span class="eui-v2-font-vip-btn">${
                font && isSVIP ? i18n.$tsl('升级SVIP') : i18n.$tsl('开通会员')
            } </span>，${i18n.$tsl('可免费商用该字体')}`;
        },
        color: 'warning',
    },
    business: {
        get content() {
            return i18n.$tsl('若需商业使用，需自行向字体公司购买版权。');
        },
        color: 'error',
    },
    notBusiness: {
        get content() {
            return i18n.$tsl('当前字体仅限个人/公益使用，不可商用');
        },
        color: 'error',
    },
    dam: {
        get content() {
            return i18n.$tsl('个人上传的字体，请自行确认使用权');
        },
        color: 'warning',
    },
    google: {
        color: 'warning',
        content: (url) => {
            return `<span class="font-family-panel__footer__tip--license-warning">${i18n.html(
                i18n.$tsl('查看<link>Google Fonts 字体许可证</link>'),
                {
                    link(text) {
                        return `<a target="_blank" rel="noopener noreferrer" href="${url}">${text}</a></span>`;
                    },
                },
            )}`;
        },
    },
    ddxs: {
        color: 'warning',
        content: (url) => {
            return `<span class="font-family-panel__footer__tip--license-warning">${i18n.html(
                i18n.$tsl('查看<link>点点像素体 字体许可证</link>'),
                {
                    link(text) {
                        return `<a target="_blank" rel="noopener noreferrer" href="${url}">${text}</a></span>`;
                    },
                },
            )}`;
        },
    },
};

const FONT_LIST = [
    {
        get title() {
            return i18n.$tsl('当前模板字体');
        },
        propName: 'usedFonts',
    },
    {
        get title() {
            return i18n.$tsl('已购字体（可商用）');
        },
        propName: 'purchasedFonts',
    },
    {
        get title() {
            return i18n.$tsl('当前模板支持特效');
        },
        propName: 'styledFonts',
    },
    {
        get title() {
            return i18n.$tsl('免费字体 (可商用)');
        },
        propName: 'freeFonts',
    },
    {
        get title() {
            return i18n.$tsl('会员免费商用字体');
        },
        tip: tips.vip.content,
        propName: 'vipFonts',
        tipColor: tips.vip.color,
    },
    {
        get title() {
            return i18n.$tsl('不可商用字体（仅个人使用）');
        },
        tip: tips.business.content,
        propName: 'businessFonts',
        tipColor: tips.business.color,
    },
    {
        get title() {
            return i18n.$tsl('免费字体 (不可商用)');
        },
        propName: 'notBusinessFonts',
    },
];

// 注入字体证书
export function insertFontsLicense(fonts, isI18n = false) {
    if (!Array.isArray(fonts)) return [];

    fonts.forEach((font) => {
        if (!font || font.dam) return;

        const fontName = font.name.trim();
        if (ddxsFontsLicense[fontName]) {
            const url = isI18n
                ? ddxsFontsLicense[fontName].i18nHref
                : ddxsFontsLicense[fontName].href;

            font.license = { type: 'ddxs', url };
            font.tipColor = tips.ddxs.color;
            font.tip = tips.ddxs.content(url);
        } else if (googleFontsLicense[fontName]) {
            const url = isI18n
                ? googleFontsLicense[fontName].i18nHref
                : googleFontsLicense[fontName].href;

            font.license = { type: 'google', url };
            font.tipColor = tips.google.color;
            font.tip = tips.google.content(url);
        }
    });
    return fonts;
}

// 无版权、需提示风险
export function checkFontRisk(font) {
    if (!font) return false;

    const id = font.authorization_id || font?.authorization?.id;
    return FONT_BUSINESS.includes(id);
}
// 不可商用 风险
export function checkNotBusiness(font) {
    if (!font) return false;

    const id = font.authorization_id || font?.authorization?.id;
    return NOT_BUSINESS.includes(id);
}
// 已购买
export function checkPurchased(font) {
    return font.isPurchased;
}
// 免费
export function checkFree(font) {
    if (!font) return true;
    const { user_over_role } = font;
    const isPay = !!user_over_role;

    return !isPay;
}
/**
 * @description: 检测字体权益类型
 * @param {Object} font 字体对象
 * @param {Boolean} vipMode 是否开启vip字体检测, 关闭时, vip字体为免费字体
 * @return {String} 字体类型
 */
export function checkFontType(font, vipMode = true) {
    const isRisk = checkFontRisk(font);
    const isPurchased = checkPurchased(font);
    const isNotBusiness = checkNotBusiness(font);
    const isFree = checkFree(font);
    const isVip = !isNotBusiness && !isFree && !isRisk && vipMode;

    if (isPurchased) return PURCHASED_TYPE;
    if (isVip) return VIP_TYPE;
    if (isRisk) return RISK_TYPE;
    if (isNotBusiness) return NOT_BUSINESS_TYPE;
    return FREE_TYPE;
}

export function getHintText(font, vipMode = true) {
    const type = checkFontType(font, vipMode);

    if (font.lang === 'en') return '该字体不支持显示中文';
    switch (type) {
        case VIP_TYPE:
            if (font.isPurchased && !font.isExpried) return '';
            if (font.user_over_role === 2 || font.user_over_role === 5) {
                return `${i18n.$tsl('版权提示：')}<span class="eui-v2-font-vip-btn">${i18n.$tsl(
                    '升级SVIP',
                )}</span>${i18n.$tsl('可免费商用该字体')}`;
            }

            return `${i18n.$tsl('版权提示：')}<span class="eui-v2-font-vip-btn">${i18n.$tsl(
                '开通会员',
            )}</span>${i18n.$tsl('可免费商用该字体')}`;
        case RISK_TYPE:
            return i18n.$tsl('版权提示： 需自行购买版权, 不可商用');
        case NOT_BUSINESS_TYPE:
            return i18n.$tsl('当前字体仅限个人/公益使用，不可商用');
    }
}

export function getFonts(
    condition,
    editorFontList = [],
    usedFonts = [],
    fontListOfEffect = [],
    option = {},
) {
    const fontMap = {
        usedFonts: [],
        styledFonts: [],
        freeFonts: [],
        vipFonts: [],
        businessFonts: [],
        notBusinessFonts: [],
        purchasedFonts: [],
    };

    option = merge({ vipMode: true }, option);

    usedFonts.forEach((font) => {
        if (!condition(font)) {
            return;
        }

        const type = checkFontType(font, option.vipMode);
        switch (type) {
            case VIP_TYPE:
                font.tipIcon =
                    font.user_over_role === 2 || font.user_over_role === 5
                        ? option.svipIcon
                        : option.vipIcon;
                break;
            case RISK_TYPE:
                if (isEnterprise) return;
                font.tipIcon = option.businessIcon;
                break;
            case NOT_BUSINESS_TYPE:
                if (isEnterprise) return;
                font.tip = tips.notBusiness.content;
                font.tipColor = tips.notBusiness.color;
                break;
        }

        fontMap.usedFonts.push(font);
    });

    fontListOfEffect.forEach((font) => {
        if (!condition(font)) {
            return;
        }
        fontMap.styledFonts.push(font);
    });

    editorFontList.forEach((font) => {
        if (!condition(font)) {
            return;
        }

        const type = checkFontType(font, option.vipMode);
        switch (type) {
            case PURCHASED_TYPE:
                fontMap.purchasedFonts.push(font);

                break;
            case VIP_TYPE:
                fontMap.vipFonts.push(font);
                font.tipIcon =
                    font.user_over_role === 2 || font.user_over_role === 5
                        ? option.svipIcon
                        : option.vipIcon;

                break;
            case RISK_TYPE:
                if (isEnterprise) return;
                fontMap.businessFonts.push(font);
                font.tipIcon = option.businessIcon;

                break;
            case NOT_BUSINESS_TYPE:
                if (isEnterprise) return;
                font.tip = tips.notBusiness.content;
                font.tipColor = tips.notBusiness.color;
                fontMap.notBusinessFonts.push(font);

                break;
            case FREE_TYPE:
                fontMap.freeFonts.push(font);

                break;
        }
    });

    fontMap.purchasedFonts.sort((a) => {
        if (a.isExpried) {
            return 1;
        }

        return -1;
    });

    const fontList = [];
    FONT_LIST.forEach((list) => {
        const fonts = fontMap[list.propName];
        if (fonts && fonts.length) {
            const listData = cloneDeep(list);
            listData.fonts = fonts;
            fontList.push(listData);
        }
    });

    return fontList;
}

export function getFontsByLang(
    lang,
    editorFontList = [],
    usedFonts = [],
    fontListOfEffect = [],
    option = {},
) {
    // 字体前置条件判断(非中英文字体，统一归为'其他')
    const condition = (font) => {
        if (!font.lang) return false;
        if (lang === 'all') {
            return true;
        } else if (['zh', 'en'].includes(lang)) {
            return font.lang === lang;
        } else {
            return !['zh', 'en'].includes(font.lang);
        }
    };

    let fontList = getFonts(condition, editorFontList, usedFonts, fontListOfEffect, option);

    if (lang === 'all') {
        fontList = fontList.filter(
            (list) =>
                !['freeFonts', 'vipFonts', 'notBusinessFonts', 'businessFonts'].includes(
                    list.propName,
                ),
        );

        // 非中英文字体，归为'其他'
        // interventionTop = 人工干预需置顶
        const langMap = {
            zh: {
                title: i18n.$tsl('中文字体'),
                interventionTop: [],
                free: [],
                vip: [],
                risk: [],
                notBusiness: [],
            },
            en: {
                title: i18n.$tsl('英文字体'),
                interventionTop: [],
                free: [],
                vip: [],
                risk: [],
                notBusiness: [],
            },
            other: {
                title: i18n.$tsl('其他字体'),
                interventionTop: [],
                free: [],
                vip: [],
                risk: [],
                notBusiness: [],
            },
        };

        // 根据不同语言来聚合字体
        const setLangFonts = (font, key) => {
            for (const lang of Object.keys(langMap)) {
                if (lang === font.lang) {
                    langMap[lang][key].push(font);
                }
            }
        };

        editorFontList.map((font) => {
            const role = font.user_over_role;
            const type = checkFontType(font, option.vipMode);
            let added = false;

            if (font?.ext?.dist_code?.includes('intervention_top')) {
                setLangFonts(font, 'interventionTop');
                added = true;
            }

            switch (type) {
                case VIP_TYPE:
                    font.tip = tips.vip.content;
                    font.tipColor = tips.vip.color;
                    font.tipIcon = role === 2 || role === 5 ? option.svipIcon : option.vipIcon;
                    !added && setLangFonts(font, 'vip');

                    break;
                case RISK_TYPE:
                    if (isEnterprise) return;
                    font.tip = tips.business.content;
                    font.tipColor = tips.business.color;
                    font.tipIcon = option.businessIcon;
                    !added && setLangFonts(font, 'risk');

                    break;
                case NOT_BUSINESS_TYPE:
                    if (isEnterprise) return;
                    font.tip = tips.notBusiness.content;
                    font.tipColor = tips.notBusiness.color;
                    !added && setLangFonts(font, 'notBusiness');

                    break;
                case FREE_TYPE:
                    !added && setLangFonts(font, 'free');

                    break;
            }
        });

        const langFonts = [];
        for (const [key, value] of Object.entries(langMap)) {
            langFonts.push({
                title: value.title,
                propName: `${key}Fonts`,
                fonts: [
                    ...value.interventionTop,
                    ...value.free,
                    ...value.vip,
                    ...value.risk,
                    ...value.notBusiness,
                ],
            });
        }

        fontList = [...fontList, ...langFonts];
    }
    return fontList;
}
