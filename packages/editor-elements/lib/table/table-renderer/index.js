import { loadImage, loadFont, loadFonts } from "@gaoding/editor-framework/lib/utils/svg-text/utils/loader";
import $ from "@gaoding/editor-utils/lib/zepto";
var isEdge = window.navigator.userAgent.indexOf('Edge') > -1;
var isDebug = false;

var TableRenderer = /*#__PURE__*/function () {
  function TableRenderer(model, html, editor) {
    this._model = model;
    this._html = html;
    this.editor = editor;
  }

  var _proto = TableRenderer.prototype;

  _proto.createStyle = function createStyle() {
    return "<style>\n            .table-main {\n                -webkit-font-smoothing: antialiased;\n            }\n        </style>";
  };

  _proto.getUsedFonts = function getUsedFonts() {
    var fontsMap = {};
    var options = this.editor.options;

    var families = this._model.getFontFamilies();

    !Array.isArray(families) && (families = [families]);
    families.forEach(function (family) {
      var font = options.fontsMap[family] || options.defaultFont;
      fontsMap[font.name + font.family] = font;
    });
    var fonts = Object.values(fontsMap);
    return fonts;
  };

  _proto.renderImage = function renderImage() {
    var _this$editor$options,
        _this$editor$options$,
        _this$editor$options$2,
        _this = this;

    var fonts = this.getUsedFonts();
    var promise;

    if ((_this$editor$options = this.editor.options) !== null && _this$editor$options !== void 0 && (_this$editor$options$ = _this$editor$options.fontSubset) !== null && _this$editor$options$ !== void 0 && (_this$editor$options$2 = _this$editor$options$.supportTypes) !== null && _this$editor$options$2 !== void 0 && _this$editor$options$2.includes('table')) {
      promise = loadFonts(fonts, this.editor);
    } else {
      promise = Promise.all(fonts.map(function (font) {
        return loadFont(font);
      }));
    }

    return promise.then(function (fonts) {
      return _this.createSvg(fonts);
    });
  };

  _proto.createSvg = function createSvg(fonts) {
    var _this$_model = this._model,
        width = _this$_model.width,
        height = _this$_model.height;
    width = Math.round(width);
    height = Math.round(height);
    var styleHtml = '';
    fonts.forEach(function (font) {
      if (font.dataURL) {
        styleHtml += "@font-face {font-family: \"" + font.name + "\";src: url(" + font.dataURL + ") format('woff');font-display: swap;font-weight: " + font.weight + "}";
      }
    });
    var svgString = "<svg viewBox=\"0 0 " + width + " " + height + "\" width=\"" + width + "\" height=\"" + height + "\" xmlns=\"http://www.w3.org/2000/svg\">" + this.createStyle() + "<style>" + styleHtml + "</style><foreignObject x=\"0\" y=\"0\" width=\"" + width + "\" height=\"" + height + "\">" + this._html + "</foreignObject></svg>";

    if (isDebug) {
      $(svgString).appendTo(document.body);
    }

    var url;

    if (!isEdge) {
      url = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgString);
    } else {
      var blob = new Blob([svgString], {
        type: 'image/svg+xml'
      });
      url = URL.createObjectURL(blob);
    }

    return loadImage(url).delay(window.safari ? 1500 : 500).then(function (img) {
      if (isDebug) {
        document.body.appendChild(img);
      }

      return img;
    });
  };

  _proto.renderCanvas = function renderCanvas() {
    var _this2 = this;

    return this.renderImage().then(function (img) {
      var element = _this2._model;
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = element.width;
      canvas.height = element.height;
      ctx.drawImage(img, 0, 0, element.width, element.height);
      return canvas;
    });
  };

  return TableRenderer;
}();

export { TableRenderer as default };

TableRenderer.node2String = function (node, model) {
  node.style.visibility = '';
  return new XMLSerializer().serializeToString(node);
};