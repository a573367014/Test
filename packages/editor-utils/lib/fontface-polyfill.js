"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _noop2 = _interopRequireDefault(require("lodash/noop"));

var _assign2 = _interopRequireDefault(require("lodash/assign"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _fontfaceobserver = _interopRequireDefault(require("fontfaceobserver"));

let FontFace = window.FontFace;

if (!document.fonts || !document.fonts.load) {
  FontFace = window.FontFace = function (name, url, descriptors) {
    this.name = name;
    this.url = url;
    (0, _assign2.default)(this, {
      style: 'normal',
      weight: 'normal'
    }, descriptors);

    const _dfd = this._dfd = {};

    _dfd.promise = new _bluebird.default((resolve, reject) => {
      _dfd.resolve = resolve;
      _dfd.reject = reject;
    });
  };

  (0, _assign2.default)(FontFace.prototype, {
    toCSS() {
      let css = '@font-face {\n';
      css += 'font-family: ' + this.name + ';\n';
      css += 'src: ' + this.url + ';';
      css += 'font-weight: ' + this.weight + ';';
      css += 'font-style: ' + this.style + ';';
      css += '}';
      return css;
    },

    load() {
      return this._dfd.promise;
    }

  });
  const fonts = document.fonts = {
    ready: _bluebird.default.resolve(),
    check: _noop2.default,
    _fonts: [],
    size: 0,
    loadTimeout: 1000,

    add(fontFace) {
      let style = fonts.style;

      if (!style) {
        style = fonts.style = document.createElement('style');
        document.head.appendChild(style);
      }

      if (!(fontFace instanceof FontFace)) {
        throw new TypeError('Only support FontFace');
      }

      fonts._fonts.push(fontFace);

      fonts.size = fonts._fonts.length;
      const dfd = fontFace._dfd;
      new _fontfaceobserver.default(fontFace.name).load('BESbswy', fonts.loadTimeout).then(dfd.resolve, font => {
        dfd.resolve(font);
      });
      let cssText = style.innerHTML;
      cssText += '\n';
      cssText += fontFace.toCSS();
      style.innerHTML = cssText;
      return fonts;
    },

    load() {
      const promises = fonts._fonts.map(font => {
        return font.load();
      });

      return _bluebird.default.all(promises);
    }

  };
}

var _default = FontFace;
exports.default = _default;