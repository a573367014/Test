import { trim, escape, unescape, isArray, isObject, cloneDeep } from 'lodash';
import { CUSTOMIZE_MARK, styleMap, styleValueMap } from '../config';
import $ from '@gaoding/editor-utils/zepto';

// 不要用 \s，会匹配全角空格导致异常
const rTwoSpace = /[\u0020\u00A0]{2}/g;
const rBr = /<br\s*\/?>/gi;
const rBBr = /<bbr\s*\/?>/gi;
const rBreakLine = /(\r?\n|\r)/gm;
// 零宽字符
const rVoidWidth = /[\u200B-\u200D\uFEFF]/gm;
/* eslint-disable-next-line */
const rControl =
    /[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000b\u000c\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f\u007F]/gm;

// <p>test<br></p> | <span>test<br></span><p>test</p> | <span>test<br></span><bbr>test
// 在这种结构下br是无作用的, 删除最后一个br
// 如果是原本就存在的br就不需要删除，bbr是在fromJSON中判断做出的新增
const removeLastBr = (elem) => {
    elem.innerHTML = elem.innerHTML.replace(rBreakLine, '<br>');
    let lastChild = elem.lastChild;
    const blockTags = ['P', 'DIV'];
    const next = elem.nextSibling;

    if (
        !blockTags.includes(elem.nodeName) &&
        (!next || !['BBR', ...blockTags].includes(next.nodeName))
    ) {
        return;
    }

    while (lastChild) {
        if (lastChild.nodeName === 'BR') {
            lastChild.parentNode.removeChild(lastChild);
            break;
        } else {
            lastChild = lastChild.lastChild;
        }
    }

    elem.innerHTML = elem.innerHTML.replace(rBr, '\n');
    return null;
};

export default {
    fromHTML(contentModel, options) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');
        let html = '';
        options = Object.assign({ zoom: 1, listStyle: '' }, options);

        if (options.listStyle) {
            const result = [];

            contentModel.forEach((item, i) => {
                const nextItem = contentModel[i + 1];
                const preItem = contentModel[i - 1];

                if ((!preItem || !preItem.closeParentTag) && item.beginParentTag) {
                    result.push('<ul>');
                }

                const tag = window.safari ? 'span' : 'div';
                item.beginParentTag && result.push(`<li><${tag}>`);
                result.push(this._fromHTML([item], options));
                item.closeParentTag && result.push(`</${tag}></li>`);

                if ((!nextItem || !nextItem.beginParentTag) && item.closeParentTag) {
                    result.push('</ul>');
                }
            });

            html = result.join('');
        } else {
            html = this._fromHTML(contentModel, options);
        }

        return html;
    },
    fromJSON(html, inheritStyle = {}, options) {
        options = Object.assign({ zoom: 1, listStyle: '' }, options);

        if (!html) return [];
        const $elem = $('<span></span>').append(html);
        let childResult = [];

        if (options.listStyle) {
            $elem.children('span').each((i, span) => {
                $(span).replaceWith($('<div></div>').append($(span).clone(true)));
            });

            const $blocks = $(
                $elem.children('div, p, span').concat($elem.children('ul, ol').children('li')),
            );

            $blocks.each((i, node) => {
                const children = this._fromJSON($(node), inheritStyle, options.zoom);
                if (!children.length) return;
                childResult = childResult.concat(children);

                children[0].beginParentTag = 'li';
                children[children.length - 1].closeParentTag = 'li';
            });
        } else {
            childResult = this._fromJSON($elem, inheritStyle, options.zoom);
        }

        return childResult;
    },

    // 注入指定的style props
    injectStyleProps(contentModel, injectStyle = {}) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');
        if (!isObject(injectStyle)) throw new TypeError('injectStyle must be a object');

        const newModel = cloneDeep(contentModel);
        newModel.forEach((item) => {
            for (const k in injectStyle) {
                if (Object.prototype.hasOwnProperty.call(styleMap, k)) {
                    item[k] = injectStyle[k];
                }
            }
        });

        return newModel;
    },
    // 删除指定的style props
    removeStyleProps(contentModel, removeStyle = {}) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');
        if (!isObject(removeStyle)) throw new TypeError('removeStyle must be a object');

        const newModel = cloneDeep(contentModel);

        newModel.forEach((item) => {
            for (const k in removeStyle) {
                if (Object.prototype.hasOwnProperty.call(styleMap, k)) {
                    delete item[k];
                }
            }
        });

        return this.mergeChild(newModel);
    },
    // 提取全部相等的style props
    getAllEqualStyleProps(contentModel) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');
        contentModel = contentModel.filter(
            (item) => item.content && !!item.content.replace(rBreakLine, ''),
        );
        const props = {};
        const defaultValueMap = {
            textDecoration: 'none',
            fontStyle: 'normal',
            fontWeight: 400,
        };

        // 提取model形势的属性 fontSize...
        for (const k in styleMap) {
            if (k.indexOf('-') === -1) props[k] = null;
        }

        for (const k in props) {
            contentModel.forEach((item) => {
                const val = item[k] || defaultValueMap[k];

                if (props[k] === null) {
                    // 值初始化
                    props[k] = val;
                } else if (props[k] !== val) {
                    // 与上一次不相等,意味着不可能所有元素style全部相等
                    delete props[k];
                }
            });
        }

        for (const k in props) {
            if (props[k] === null || props[k] === undefined) delete props[k];
        }

        return props;
    },

    // 合并style相等的元素
    mergeChild(contentModel, notDeepCopy) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');

        const newModel = notDeepCopy ? contentModel : cloneDeep(contentModel);
        const result = newModel.reduce((newChildren, next) => {
            const lastIndex = newChildren.length - 1;
            const lastChild = newChildren[lastIndex];

            // 数组还是空的
            if (!lastChild) {
                newChildren.push(next);
                return newChildren;
            }

            // 合并style相同的span,去除冗余
            const styleEqual = this._getStyleString(lastChild) === this._getStyleString(next);

            if (
                styleEqual &&
                !lastChild.beginParentTag &&
                !lastChild.closeParentTag &&
                !next.beginParentTag &&
                !next.closeParentTag
            ) {
                lastChild.content += next.content;
            } else {
                newChildren.push(next);
            }

            return newChildren;
        }, []);

        return result;
    },

    _fromJSON($elem, inheritStyle = {}, zoom = 1) {
        const _inheritStyle = {};

        const elem = $elem[0];
        const blocks = ['P', 'DIV', 'LI'];

        $.each($elem.find('*').not('br').get().reverse(), (i, el) => {
            const $el = $(el);
            const html = $el.html().trim();

            if (html === '' && !blocks.includes(el.nodeName)) {
                $el.remove();
            } else if (html === '<br>') {
                $el.replaceWith('<br>');
            } else if (html === '<br><br>') {
                $el.replaceWith('<br><br>');
            }
        });

        $elem.find('p,div,li').each((i, el) => {
            const next = el.nextSibling;
            const prev = el.previousSibling;

            // span + div || div + div
            // 内联 + 块级 或 块级 + 块级， 需在块级元素之前添加br
            // 这个生成bbr因为后续操作需要做区分
            if (prev && prev.nodeName !== 'BR') {
                const br = $('<bbr>');
                $(el).before(br);
            }

            // div + span
            // 块级+内联， 需在内联元素之前添加br
            if (next && !blocks.includes(next.nodeName)) {
                $(el).after('<br>');
            }
        });

        // 白名单过滤
        for (const k in inheritStyle) {
            if (Object.prototype.hasOwnProperty.call(styleMap, k))
                _inheritStyle[k] = inheritStyle[k];
        }

        let children = this._getChildJSON(elem, _inheritStyle);

        children.forEach((item) => {
            if (item.fontSize) item.fontSize = item.fontSize / zoom;
        });

        children = this.mergeChild(children, true);

        children.forEach((item) => {
            if (item.content) {
                item.content = item.content.replace(rControl, '');
            }
        });

        return children.filter((item) => !!item.content);
    },
    _fromHTML(contentModel, options = {}) {
        if (!isArray(contentModel)) throw new TypeError('contentModel must be a array');

        let result = '';

        contentModel.forEach((node) => {
            if (node && node.content) {
                let style = {};

                Object.keys(node).forEach((name) => {
                    if (Object.prototype.hasOwnProperty.call(styleMap, name)) {
                        style[name] =
                            name === 'fontSize' ? node[name] * (options.zoom || 1) : node[name];
                    }
                });

                style = this._getStyleString(style);

                // 兼容旧有数据，防止 <br> 被转义而失效
                let content = node.content.replace(rBr, '\n');

                // 转义HTML相关
                content = escape(unescape(content))
                    // 换行替换为 <br>
                    .replace(rBreakLine, '<br>')
                    // 修正连续空格展示、参照浏览器的空格行为
                    .replace(rTwoSpace, '&nbsp; ')
                    .replace(rTwoSpace, ' &nbsp;')
                    // 最后一个段落若为空格结尾会被识别为零宽
                    .replace(/[\u0020\u00A0](<br>|$)/g, '&nbsp;$1')
                    // 非法控制字符过滤
                    .replace(rControl, '');

                const brstr = content.slice(-4);

                /**
                 * <span>234<br></span> 这种br在span后面的结构
                 * 在chrome上会因为 br 导致行距异常, 做单独处理转为 <span>234</span><br>
                 */
                if (brstr === '<br>' && !options.listStyle) {
                    content = content.slice(0, -4);
                    result += !style
                        ? content
                        : `<span ${CUSTOMIZE_MARK}="1" style='${style}'>${content}</span>`;
                    result += brstr;
                } else {
                    result += !style
                        ? content
                        : `<span ${CUSTOMIZE_MARK}="1" style='${style}'>${content}</span>`;
                }
            }
        });

        return result;
    },
    _getChildJSON(elem, inheritStyle = {}, isSingle) {
        // 空节点直接返回
        if (!elem.innerHTML) return [];

        let result = [];
        let nodeType;
        let elemResult;

        // 普通 DOM 节点处理
        const nodeType1 = (curElem) => {
            const styleStr = curElem.getAttribute('style') || '';
            const styleJSON = styleStr ? this._getStyleJSON(styleStr, inheritStyle.fontWeight) : {};

            removeLastBr(curElem);

            // 递归合并
            result = result.concat(this._getChildJSON(curElem, { ...inheritStyle, ...styleJSON }));
        };

        // 文本节点处理
        const nodeType3 = (curElem) => {
            if (curElem.textContent) {
                elemResult = {
                    ...inheritStyle,
                    content: unescape(escape(curElem.textContent).replace(rVoidWidth, '')),
                };
            }
        };

        const check = (curElem) => {
            nodeType = curElem.nodeType;
            elemResult = null;

            // 普通 DOM 节点
            if (nodeType === 1) {
                nodeType1(curElem);
            }
            // 文本节点
            else if (nodeType === 3) {
                nodeType3(curElem);
            }

            elemResult && result.push(elemResult);
        };

        if (!isSingle) {
            elem = elem.cloneNode(true);
            elem.innerHTML = elem.innerHTML.replace(rBr, '\n').replace(rBBr, '\n');

            const children = Array.from(elem.childNodes);
            children.forEach(check);
        } else {
            check(elem);
        }

        return result;
    },
    _getStyleJSON(style, defaultFontWeight) {
        const result = {
            fontWeight: defaultFontWeight || 400,
        };

        style.split(';').forEach((expression) => {
            let [name, value] = expression.split(':');
            name = styleMap[trim(name)];
            value = trim(value);

            // 白名单过滤
            if (name) result[name] = styleValueMap[name] ? styleValueMap[name](value) : value;
        });

        return result;
    },
    _getStyleString(style) {
        let result = '';

        Object.keys(style)
            .sort()
            .forEach((name) => {
                const value = style[name];
                name = styleMap[name];

                // 白名单过滤
                if (name) {
                    // const val = ['font-family', 'fontFamily'].includes(name) ? `"${value}"` : value;
                    result += `${name}: ${
                        styleValueMap[name] ? styleValueMap[name](value) : value
                    };`;
                }
            });
        return result;
    },
};
