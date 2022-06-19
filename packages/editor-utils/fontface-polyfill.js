/**
 * utils/fontface-polyfill
 */

import { assign, noop } from 'lodash';
import Promise from 'bluebird';
import FontFaceObserver from 'fontfaceobserver';

let FontFace = window.FontFace;

// supported
if (!document.fonts || !document.fonts.load) {
    FontFace = window.FontFace = function (name, url, descriptors) {
        this.name = name;
        this.url = url;

        // descriptors
        // https://www.w3.org/TR/css-font-loading/
        assign(
            this,
            {
                style: 'normal',
                weight: 'normal',
                // stretch: 'normal',
                // variant: 'normal',
                // featureSettings: 'normal',
                // unicodeRange: 'U+0-10FFFF',
            },
            descriptors,
        );

        // promise
        const _dfd = (this._dfd = {});

        _dfd.promise = new Promise((resolve, reject) => {
            _dfd.resolve = resolve;
            _dfd.reject = reject;
        });
    };

    assign(FontFace.prototype, {
        toCSS() {
            let css = '@font-face {\n';

            css += 'font-family: ' + this.name + ';\n';
            css += 'src: ' + this.url + ';';

            // descriptors
            css += 'font-weight: ' + this.weight + ';';
            css += 'font-style: ' + this.style + ';';

            css += '}';

            return css;
        },
        load() {
            return this._dfd.promise;
        },
    });

    // document.fonts
    const fonts = (document.fonts = {
        ready: Promise.resolve(),
        check: noop,
        _fonts: [],
        size: 0,
        loadTimeout: 1000,
        add(fontFace) {
            let style = fonts.style;
            if (!style) {
                style = fonts.style = document.createElement('style');
                document.head.appendChild(style);
            }

            // check
            if (!(fontFace instanceof FontFace)) {
                throw new TypeError('Only support FontFace');
            }

            // size
            fonts._fonts.push(fontFace);
            fonts.size = fonts._fonts.length;

            // loader
            const dfd = fontFace._dfd;

            new FontFaceObserver(fontFace.name)
                .load('BESbswy', fonts.loadTimeout)
                .then(dfd.resolve, (font) => {
                    // dfd.reject(new Error('Font load error, ' + fontFace.name));

                    // IE FontFaceObserver 检测有问题，默认其加载成功
                    dfd.resolve(font);
                });

            // css inject
            let cssText = style.innerHTML;

            cssText += '\n';
            cssText += fontFace.toCSS();

            style.innerHTML = cssText;

            return fonts;
        },
        load() {
            const promises = fonts._fonts.map((font) => {
                return font.load();
            });

            return Promise.all(promises);
        },
    });
}

export default FontFace;
