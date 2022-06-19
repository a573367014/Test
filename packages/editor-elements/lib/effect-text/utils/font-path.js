import _get from "lodash/get";
import Promise from 'bluebird';
import { getGsubVrtrCharMap } from "./index";
import { load as _load } from 'opentype.js';
import utils from "@gaoding/editor-framework/lib/utils/utils";
var cache = {}; // 这些中文符号也需要旋转90度

var CN_WHILE_LIST = ['—', '…', '“', '”', '﹏', '﹋', '﹌', '‘', '’', '˜']; // 这些英文符号也不需要旋转90度

var EN_BLACK_LIST = ['©', '®', '÷'];

var FontPath = /*#__PURE__*/function () {
  /***
   * fontData = options.fontList[n]
   */
  function FontPath(fontData, model) {
    this.font = null;
    this.model = model;
    this.fontData = fontData;
    return new Proxy(this, {
      get: function get(target, property) {
        if (target.font) {
          return target.font['$' + property] || target.font[property] || target[property];
        } else {
          return target[property];
        }
      }
    });
  }

  var _proto = FontPath.prototype;

  _proto.load = function load() {
    var _this = this;

    var fontData = this.fontData;
    if (cache[fontData.name]) return cache[fontData.name];
    cache[fontData.name] = new Promise(function (resolve, reject) {
      _load(fontData.woff || fontData.ttf, function (err, font) {
        if (err) {
          reject(err);
          return;
        }

        _this._initMethods(font);

        resolve(font);
      });
    }).then(function (font) {
      _this.font = font;
      return _this;
    }).catch(function (e) {
      delete cache[fontData.name];
      throw e;
    });
    return cache[fontData.name];
  };

  _proto._initMethods = function _initMethods(font) {
    var fontData = this.fontData,
        model = this.model;
    var vertialGlyphIndexMap = getGsubVrtrCharMap(font);

    var getIsVertical = function getIsVertical() {
      return model.writingMode.includes('vertical');
    };

    font.name = fontData.name;
    font.typoDescender = _get(font, 'tables.os2.sTypoDescender');
    font.typoAscender = _get(font, 'tables.os2.sTypoAscender');
    font.typoLinegap = _get(font, 'tables.os2.sTypoLineGap');
    font.usWinAscent = font.ascender; // get(font, 'tables.os2.usWinAscent') || font.ascender;

    font.usWinDescent = font.descender; // get(font, 'tables.os2.usWinDescent') || font.descender;

    font.$getInfo = function (word) {
      var content = word.content,
          fontSize = word.fontSize;
      var usWinAscent = this.usWinAscent,
          usWinDescent = this.usWinDescent,
          unitsPerEm = this.unitsPerEm,
          tables = this.tables;
      var fontSizePx = (usWinAscent + Math.abs(usWinDescent)) / unitsPerEm * fontSize;
      var baseLine = usWinAscent / unitsPerEm * fontSize;
      var yStrikeoutPosition = usWinAscent - tables.os2.yStrikeoutPosition;
      var yStrikeoutPositionPx = yStrikeoutPosition / unitsPerEm * fontSize;
      var yStrikeoutSize = tables.os2.yStrikeoutSize;
      var yStrikeoutSizePx = yStrikeoutSize / unitsPerEm * fontSize;
      var underlinePosition = usWinAscent - tables.post.underlinePosition;
      var underlinePositionPx = underlinePosition / unitsPerEm * fontSize;
      var underlineThickness = tables.post.underlineThickness;
      var underlineThicknessPx = underlineThickness / unitsPerEm * fontSize;
      var advanceWidthPx = font.getAdvanceWidth(content, fontSize);
      return {
        // 文字包围盒高度
        boxHeight: fontSizePx,
        // 文字包围盒宽度
        boxWidth: advanceWidthPx,
        // 下划线位置
        underlinePosition: underlinePositionPx,
        // 下划线线宽
        underlineThickness: underlineThicknessPx,
        // 删除线位置
        yStrikeoutPosition: yStrikeoutPositionPx,
        // 删除线线宽
        yStrikeoutSize: yStrikeoutSizePx,
        // 基线位置
        baseLine: baseLine
      };
    };

    font.$setItalic = function (path, word, basePoint) {
      if (fontData.style === 'italic') return;
      var content = word.content,
          left = word.left,
          top = word.top,
          fontSize = word.fontSize;

      var _font$$getInfo = font.$getInfo({
        fontSize: fontSize,
        content: content
      }),
          baseLine = _font$$getInfo.baseLine,
          boxWidth = _font$$getInfo.boxWidth;

      var base = basePoint || {
        y: top + baseLine,
        x: left + boxWidth / 2
      }; // 模拟浏览器斜体

      path.commands.forEach(function (item) {
        ['', '1', '2'].forEach(function (key) {
          if (item['x' + key]) {
            var point = utils.getSkewPoint({
              x: item['x' + key],
              y: item['y' + key]
            }, base, -0.24, 0);
            item['x' + key] = point.x;
            item['y' + key] = point.y;
          }
        });
      });
    };

    font.$setTextDecoration = function (path, word) {
      var isVertical = getIsVertical();
      var content = word.content,
          left = word.left,
          top = word.top,
          width = word.width,
          height = word.height,
          fontSize = word.fontSize;

      var _font$$getInfo2 = font.$getInfo({
        fontSize: fontSize,
        content: content
      }),
          yStrikeoutPosition = _font$$getInfo2.yStrikeoutPosition,
          underlinePosition = _font$$getInfo2.underlinePosition,
          boxHeight = _font$$getInfo2.boxHeight;

      var lineWidth = 0.1 * fontSize;

      var fnX = function fnX(y, lineWidth) {
        return [{
          type: 'M',
          x: left,
          y: y
        }, {
          type: 'L',
          x: left + width,
          y: y
        }, {
          type: 'L',
          x: left + width,
          y: y + lineWidth
        }, {
          type: 'L',
          x: left,
          y: y + lineWidth
        }, {
          type: 'Z'
        }];
      };

      var fnY = function fnY(x, lineWidth) {
        return [{
          type: 'M',
          x: x,
          y: top
        }, {
          type: 'L',
          x: x,
          y: top + height
        }, {
          type: 'L',
          x: x + lineWidth,
          y: top + height
        }, {
          type: 'L',
          x: x + lineWidth,
          y: top
        }, {
          type: 'Z'
        }];
      };

      if (isVertical) {
        path.lineThroughCommands = fnY(Math.max(left + width / 2, 1), lineWidth);
        path.underlineCommands = fnY(Math.max(left, 1), lineWidth);
        path.clickAreaCommands = fnY(Math.max(left, 1), boxHeight);
      } else {
        path.lineThroughCommands = fnX(Math.max(top + yStrikeoutPosition, 1), lineWidth);
        path.underlineCommands = fnX(Math.max(top + underlinePosition, 1), lineWidth);
        path.clickAreaCommands = fnX(Math.max(top, 1), boxHeight);
      }
    };

    font.$getPathByData = function (word) {
      var content = word.content,
          left = word.left,
          top = word.top,
          fontSize = word.fontSize,
          textWidth = word.textWidth,
          textHeight = word.textHeight;

      var _font$$getInfo3 = font.$getInfo({
        fontSize: fontSize,
        content: content
      }),
          baseLine = _font$$getInfo3.baseLine,
          boxHeight = _font$$getInfo3.boxHeight,
          boxWidth = _font$$getInfo3.boxWidth;

      var isVertical = getIsVertical(); // 根据竖排映射表匹配并替换中文符号

      var vertialIndex = isVertical && vertialGlyphIndexMap[font.charToGlyphIndex(content)];
      var dx = isVertical ? boxHeight - boxWidth : 0;
      var dy = isVertical && Math.abs(textWidth - textHeight) > 0.1 ? (this.usWinAscent - this.typoAscender) / (this.usWinAscent + Math.abs(this.usWinDescent)) * boxHeight : 0;
      var x = left + dx / 2;
      var y = top + baseLine - dy;
      var path; // 英文字母、符号需要旋转

      if (isVertical && (!EN_BLACK_LIST.includes(content) && content.charCodeAt() <= 256 || CN_WHILE_LIST.includes(content))) {
        path = font.getPath(content, x, top + baseLine - (boxHeight - boxWidth) / 2, fontSize); // 以横排的包围盒中心点为基点进行旋转

        var base = {
          y: top - (boxHeight - boxWidth) / 2 + boxHeight / 2,
          x: x + boxWidth / 2
        };

        if (word.fontStyle === 'italic') {
          this.$setItalic(path, word, isVertical ? {
            y: top - (boxHeight - boxWidth) / 2 + baseLine,
            x: base.x
          } : null);
        } // 旋转字符


        path.commands.forEach(function (item) {
          ['', '1', '2'].forEach(function (key) {
            if (item['x' + key]) {
              var point = utils.getPointPosition({
                x: item['x' + key],
                y: item['y' + key]
              }, base, 90);
              item['x' + key] = point.x;
              item['y' + key] = point.y;
            }
          });
        });
      } // 根据竖排映射表匹配并替换中文符号
      else if (vertialIndex) {
        path = font.glyphs.glyphs[vertialIndex].getPath(x, y, fontSize);

        if (word.fontStyle === 'italic') {
          this.$setItalic(path, word, isVertical ? {
            y: top + this.typoAscender / (this.usWinAscent + Math.abs(this.usWinDescent)) * boxHeight,
            x: x + boxWidth / 2
          } : null);
        }
      } else {
        path = font.getPath(content, x, y, fontSize);

        if (word.fontStyle === 'italic') {
          this.$setItalic(path, word, isVertical ? {
            y: y,
            x: x + boxHeight / 2
          } : null);
        }
      }

      this.$setTextDecoration(path, word);
      return path;
    };
  };

  return FontPath;
}();

export { FontPath as default };