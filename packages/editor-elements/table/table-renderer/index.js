import {
    loadImage,
    loadFont,
    loadFonts,
} from '@gaoding/editor-framework/src/utils/svg-text/utils/loader';
import $ from '@gaoding/editor-utils/zepto';

const isEdge = window.navigator.userAgent.indexOf('Edge') > -1;
const isDebug = false;
export default class TableRenderer {
    constructor(model, html, editor) {
        this._model = model;
        this._html = html;
        this.editor = editor;
    }

    createStyle() {
        return `<style>
            .table-main {
                -webkit-font-smoothing: antialiased;
            }
        </style>`;
    }

    getUsedFonts() {
        const fontsMap = {};
        const options = this.editor.options;
        let families = this._model.getFontFamilies();
        !Array.isArray(families) && (families = [families]);
        families.forEach((family) => {
            const font = options.fontsMap[family] || options.defaultFont;
            fontsMap[font.name + font.family] = font;
        });
        const fonts = Object.values(fontsMap);
        return fonts;
    }

    renderImage() {
        const fonts = this.getUsedFonts();

        let promise;
        if (this.editor.options?.fontSubset?.supportTypes?.includes('table')) {
            promise = loadFonts(fonts, this.editor);
        } else {
            promise = Promise.all(fonts.map((font) => loadFont(font)));
        }

        return promise.then((fonts) => this.createSvg(fonts));
    }

    createSvg(fonts) {
        let { width, height } = this._model;
        width = Math.round(width);
        height = Math.round(height);

        let styleHtml = '';
        fonts.forEach((font) => {
            if (font.dataURL) {
                styleHtml += `@font-face {font-family: "${font.name}";src: url(${font.dataURL}) format('woff');font-display: swap;font-weight: ${font.weight}}`;
            }
        });

        const svgString = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${this.createStyle()}<style>${styleHtml}</style><foreignObject x="0" y="0" width="${width}" height="${height}">${
            this._html
        }</foreignObject></svg>`;
        if (isDebug) {
            $(svgString).appendTo(document.body);
        }

        let url;
        if (!isEdge) {
            url = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgString);
        } else {
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            url = URL.createObjectURL(blob);
        }

        return loadImage(url)
            .delay(window.safari ? 1500 : 500)
            .then((img) => {
                if (isDebug) {
                    document.body.appendChild(img);
                }
                return img;
            });
    }

    renderCanvas() {
        return this.renderImage().then((img) => {
            const element = this._model;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = element.width;
            canvas.height = element.height;
            ctx.drawImage(img, 0, 0, element.width, element.height);
            return canvas;
        });
    }
}

TableRenderer.node2String = function (node, model) {
    node.style.visibility = '';
    return new XMLSerializer().serializeToString(node);
};
