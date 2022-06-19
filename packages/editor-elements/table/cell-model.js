import { isObject } from 'lodash';
import { getGradientBackground } from './utils';

const defaultContentStyle = {
    color: '#333333',
    fontFamily: 'SourceHanSansSC-Regular',
    fontSize: 14,
    fontWeight: 200,
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: 1,
};
const defaultWrapStyle = {
    backgroundColor: '#ffffff00',
    textAlign: 'center',
};
get4SizeNames('border').forEach((name) => {
    ['Style', 'Width', 'Color'].forEach((prop) => {
        defaultWrapStyle[name + prop] = null;
    });
});
const defaultStyle = { ...defaultContentStyle, ...defaultWrapStyle };

// 计算css值
const cssStyleActions = {
    backgroundColor: (v, model) => {
        if (isObject(v)) {
            model.$wrapCssStyle.backgroundImage = getGradientBackground(v);
        } else {
            model.$wrapCssStyle.backgroundColor = v;
            model.$wrapCssStyle.backgroundImage = '';
        }
    },
    fontSize: (v, model) => {
        // 小于12px处理
        if (v < 12 && navigator.userAgent.indexOf('Chrome') > -1) {
            model.$contentCssStyle.zoom = v / 12;
        } else {
            model.$contentCssStyle.zoom = 1;
        }
        model.$contentCssStyle.fontSize = v + 'px';
    },
    fontFamily: (v, model) => {
        model.$contentCssStyle.fontFamily = v;
    },
    fontWeight: (v, model) => {
        model.$contentCssStyle.fontWeight = v;
    },
    fontStyle: (v, model) => {
        model.$contentCssStyle.fontStyle = v;
    },
    color: (v, model) => {
        model.$contentCssStyle.color = v;
    },
    textAlign: (v, model) => {
        model.$wrapCssStyle.textAlign = v;
    },
    textDecoration: (v, model) => {
        model.$contentCssStyle.textDecoration = v;
    },
    lineHeight: (v, model) => {
        model.$contentCssStyle.lineHeight = v;
    },
};
get4SizeNames('padding').forEach((name) => {
    cssStyleActions[name] = (v, model) => {
        model.$contentCssStyle[name] = v + 'px';
    };
});
get4SizeNames('border').forEach((name) => {
    cssStyleActions[`${name}Width`] = (v, model) => {
        model.$wrapCssStyle[`${name}Width`] = v + 'px';
    };
    cssStyleActions[`${name}Style`] = (v, model) => {
        model.$wrapCssStyle[`${name}Style`] = v;
    };
    cssStyleActions[`${name}Color`] = (v, model) => {
        model.$wrapCssStyle[`${name}Color`] = v;
    };
});
const cssStyleReaction = new Map(Object.entries(cssStyleActions));

export class CellModel {
    constructor(data, globalInfo, options = {}) {
        this.content = data.content;
        this.rowspan = data.rowspan || 1;
        this.colspan = data.colspan || 1;
        this.styleIds = data.styleIds || [];

        this._init(globalInfo, options);
    }

    content = '';

    colspan = 1;

    rowspan = 1;

    styleIds = [];

    $style = {};

    $styleMap = new Map();

    $wrapCssStyle = { ...defaultWrapStyle };

    $contentCssStyle = { ...defaultContentStyle };

    clone(globalInfo, options) {
        return new CellModel(this.toObject(), globalInfo, options);
    }

    toObject() {
        return {
            content: this.content,
            colspan: this.colspan,
            rowspan: this.rowspan,
            styleIds: [...this.styleIds],
        };
    }

    _init(globalInfo) {
        const { table, position } = globalInfo;
        const that = this;
        const styleIds = this.styleIds;
        this.$styleMap = new Map();
        this.$style = new Proxy(
            { ...defaultStyle },
            {
                set(style, prop, value) {
                    style[prop] = value;
                    cssStyleReaction.has(prop) && cssStyleReaction.get(prop)(value, that);
                    return true;
                },
            },
        );

        // 样式聚合
        const _styleIds = [table.tableData.all.styleId];
        if (position) {
            const useRules = table.tableData.rules.filter((rule) => {
                const idx = rule.type === 'col' ? 1 : 0;
                return (position[idx] + 1) % rule.coefficient === rule.remainder;
            });
            _styleIds.push(...useRules.map((rule) => rule.styleId));
        }
        _styleIds.push(...(styleIds || []));

        _styleIds.forEach((id) => {
            const style = table.$styleMap.get(id);
            this.$styleMap.set(id, style);
        });
        this.$styleMap.forEach((style) => {
            Object.assign(this.$style, style);
        });
    }

    rerender(globalInfo) {
        this._init(globalInfo);
    }
}

/**
 * 反序列borders数据
 */
export function dlzBorders(borders) {
    if (!borders || !borders.length) return {};
    const borderStyles = {};
    const sideNames = get4SizeNames('border');
    const dlzCssData = dlzCss4SideData(borders);
    dlzCssData.forEach((style, i) => {
        if (style) {
            Object.keys(style).forEach((key) => {
                const value = style[key];
                borderStyles[`${sideNames[i]}${key[0].toUpperCase() + key.slice(1)}`] = value;
            });
        }
    });
    return borderStyles;
}

/**
 * 反序列padding数据
 */
export function dlzPadding(padding) {
    if (!padding || !padding.length) return {};
    const paddingStyle = {};
    const sideNames = get4SizeNames('padding');
    dlzCss4SideData(padding).forEach((v, i) => {
        paddingStyle[sideNames[i]] = v;
    });
    return paddingStyle;
}

/**
 * css上[,右[,下[,左]]]省略语法解析
 */
export function dlzCss4SideData(data = []) {
    const res = new Array(4);
    let indexes = [0, 1, 2, 3];
    switch (data.length) {
        case 1:
            indexes = [0, 0, 0, 0];
            break;
        case 2:
            indexes = [0, 1, 0, 1];
            break;
        case 3:
            indexes = [0, 1, 2, 1];
            break;
    }
    for (let i = 0; i < 4; i++) {
        res[i] = data[indexes[i]];
    }
    return res;
}

/**
 * 获取四边属性名称
 */
export function get4SizeNames(name) {
    return [name + 'Top', name + 'Right', name + 'Bottom', name + 'Left'];
}
