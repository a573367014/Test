import _extends from "@babel/runtime/helpers/extends";
import _isObject from "lodash/isObject";
import { getGradientBackground } from "./utils";
var defaultContentStyle = {
  color: '#333333',
  fontFamily: 'SourceHanSansSC-Regular',
  fontSize: 14,
  fontWeight: 200,
  fontStyle: 'normal',
  textDecoration: 'none',
  lineHeight: 1
};
var defaultWrapStyle = {
  backgroundColor: '#ffffff00',
  textAlign: 'center'
};
get4SizeNames('border').forEach(function (name) {
  ['Style', 'Width', 'Color'].forEach(function (prop) {
    defaultWrapStyle[name + prop] = null;
  });
});

var defaultStyle = _extends({}, defaultContentStyle, defaultWrapStyle); // 计算css值


var cssStyleActions = {
  backgroundColor: function backgroundColor(v, model) {
    if (_isObject(v)) {
      model.$wrapCssStyle.backgroundImage = getGradientBackground(v);
    } else {
      model.$wrapCssStyle.backgroundColor = v;
      model.$wrapCssStyle.backgroundImage = '';
    }
  },
  fontSize: function fontSize(v, model) {
    // 小于12px处理
    if (v < 12 && navigator.userAgent.indexOf('Chrome') > -1) {
      model.$contentCssStyle.zoom = v / 12;
    } else {
      model.$contentCssStyle.zoom = 1;
    }

    model.$contentCssStyle.fontSize = v + 'px';
  },
  fontFamily: function fontFamily(v, model) {
    model.$contentCssStyle.fontFamily = v;
  },
  fontWeight: function fontWeight(v, model) {
    model.$contentCssStyle.fontWeight = v;
  },
  fontStyle: function fontStyle(v, model) {
    model.$contentCssStyle.fontStyle = v;
  },
  color: function color(v, model) {
    model.$contentCssStyle.color = v;
  },
  textAlign: function textAlign(v, model) {
    model.$wrapCssStyle.textAlign = v;
  },
  textDecoration: function textDecoration(v, model) {
    model.$contentCssStyle.textDecoration = v;
  },
  lineHeight: function lineHeight(v, model) {
    model.$contentCssStyle.lineHeight = v;
  }
};
get4SizeNames('padding').forEach(function (name) {
  cssStyleActions[name] = function (v, model) {
    model.$contentCssStyle[name] = v + 'px';
  };
});
get4SizeNames('border').forEach(function (name) {
  cssStyleActions[name + "Width"] = function (v, model) {
    model.$wrapCssStyle[name + "Width"] = v + 'px';
  };

  cssStyleActions[name + "Style"] = function (v, model) {
    model.$wrapCssStyle[name + "Style"] = v;
  };

  cssStyleActions[name + "Color"] = function (v, model) {
    model.$wrapCssStyle[name + "Color"] = v;
  };
});
var cssStyleReaction = new Map(Object.entries(cssStyleActions));
export var CellModel = /*#__PURE__*/function () {
  function CellModel(data, globalInfo, options) {
    if (options === void 0) {
      options = {};
    }

    this.content = '';
    this.colspan = 1;
    this.rowspan = 1;
    this.styleIds = [];
    this.$style = {};
    this.$styleMap = new Map();
    this.$wrapCssStyle = _extends({}, defaultWrapStyle);
    this.$contentCssStyle = _extends({}, defaultContentStyle);
    this.content = data.content;
    this.rowspan = data.rowspan || 1;
    this.colspan = data.colspan || 1;
    this.styleIds = data.styleIds || [];

    this._init(globalInfo, options);
  }

  var _proto = CellModel.prototype;

  _proto.clone = function clone(globalInfo, options) {
    return new CellModel(this.toObject(), globalInfo, options);
  };

  _proto.toObject = function toObject() {
    return {
      content: this.content,
      colspan: this.colspan,
      rowspan: this.rowspan,
      styleIds: [].concat(this.styleIds)
    };
  };

  _proto._init = function _init(globalInfo) {
    var _this = this;

    var table = globalInfo.table,
        position = globalInfo.position;
    var that = this;
    var styleIds = this.styleIds;
    this.$styleMap = new Map();
    this.$style = new Proxy(_extends({}, defaultStyle), {
      set: function set(style, prop, value) {
        style[prop] = value;
        cssStyleReaction.has(prop) && cssStyleReaction.get(prop)(value, that);
        return true;
      }
    }); // 样式聚合

    var _styleIds = [table.tableData.all.styleId];

    if (position) {
      var useRules = table.tableData.rules.filter(function (rule) {
        var idx = rule.type === 'col' ? 1 : 0;
        return (position[idx] + 1) % rule.coefficient === rule.remainder;
      });

      _styleIds.push.apply(_styleIds, useRules.map(function (rule) {
        return rule.styleId;
      }));
    }

    _styleIds.push.apply(_styleIds, styleIds || []);

    _styleIds.forEach(function (id) {
      var style = table.$styleMap.get(id);

      _this.$styleMap.set(id, style);
    });

    this.$styleMap.forEach(function (style) {
      Object.assign(_this.$style, style);
    });
  };

  _proto.rerender = function rerender(globalInfo) {
    this._init(globalInfo);
  };

  return CellModel;
}();
/**
 * 反序列borders数据
 */

export function dlzBorders(borders) {
  if (!borders || !borders.length) return {};
  var borderStyles = {};
  var sideNames = get4SizeNames('border');
  var dlzCssData = dlzCss4SideData(borders);
  dlzCssData.forEach(function (style, i) {
    if (style) {
      Object.keys(style).forEach(function (key) {
        var value = style[key];
        borderStyles["" + sideNames[i] + (key[0].toUpperCase() + key.slice(1))] = value;
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
  var paddingStyle = {};
  var sideNames = get4SizeNames('padding');
  dlzCss4SideData(padding).forEach(function (v, i) {
    paddingStyle[sideNames[i]] = v;
  });
  return paddingStyle;
}
/**
 * css上[,右[,下[,左]]]省略语法解析
 */

export function dlzCss4SideData(data) {
  if (data === void 0) {
    data = [];
  }

  var res = new Array(4);
  var indexes = [0, 1, 2, 3];

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

  for (var i = 0; i < 4; i++) {
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