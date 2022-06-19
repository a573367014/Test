import { escape } from 'lodash';

/* eslint-disable-next-line */
export const rControl =
    /[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000a\u000b\u000c\u000d\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f\u007F]/gm;

// 获取粘贴的纯文本
export function getPasteText(e, format) {
    const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
    let pasteText;

    if (clipboardData == null) {
        pasteText = window.clipboardData && window.clipboardData.getData('text');
    } else {
        // let pasteHtml = clipboardData.getData('text/html');
        pasteText = clipboardData.getData('text');

        // TODO: 富文本粘贴支持暂时关闭
        // if(
        //     model.type === 'text' &&
        //     pasteHtml
        // ) {
        //     const tempDom = $('<span style="position: absolute; top: -1000000px;"></span>').append(pasteHtml);
        //     tempDom.appendTo(document.body);

        //     const forChildren = (children) => {
        //         $(children).each((i, el) => {
        //             const style = getComputedStyle(el);
        //             let cssText = '';
        //             styleProps.forEach(prop => {
        //                 cssText += `${prop}: ${style[prop]};`;
        //             });

        //             el.style.cssText = cssText;
        //             forChildren(el.children);
        //         });
        //     };

        //     forChildren(tempDom.children());
        //     tempDom.find('style, meta, head').remove();

        //     const body = tempDom.find('body');
        //     pasteHtml = body[0] ? body.html() : tempDom.html();

        //     const contents = serialize.fromJSON(pasteHtml);
        //     contents.forEach(item => {
        //         if(item.fontFamily && editorOptions && !editorOptions.fontsMap[item.fontFamily]) {
        //             item.fontFamily = editorOptions.fontsMap[item.fontFamily] || editorOptions.defaultFont;
        //         }
        //     });

        //     // 粘贴外部内容时，字号可能跟 model.fontSize 字号相差非常大
        //     const sizes = contents.filter(item => !!item.fontSize).map(item => item.fontSize);
        //     const ratio = !sizes.length ? 1 : model.fontSize / Math.max(...sizes);

        //     contents.forEach(item => {
        //         if(item.fontSize) {
        //             item.fontSize = Math.round(item.fontSize * ratio);
        //         }
        //     });

        //     pasteHtml = serialize.fromHTML(contents);
        //     tempDom.remove();

        //     return pasteHtml;
        // }
    }

    // 截取长度，避免性能问题，一般不会超过1500
    return format
        ? format(pasteText)
        : escape(pasteText.slice(0, 1500))
              .replace(/(\r\n|\r|\n)/g, '<br/>')
              .replace(rControl, '');
}
