import _extends from "@babel/runtime/helpers/extends";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _clone from "lodash/clone";
import _get from "lodash/get";
import _pickBy from "lodash/pickBy";
import _cloneDeep from "lodash/cloneDeep";
import _isEqual from "lodash/isEqual";
import _set from "lodash/set";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { CellModel, dlzBorders, dlzPadding, get4SizeNames } from "./cell-model";
import TableRenderer from "./table-renderer";
import { convertObsoleteTableData, convertOldTable, createTableDom, genStyleId, getTableMinSize, resizeTable as _resizeTable } from "./utils";

var Table = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(Table, _BaseModel);

  function Table(data) {
    var _this;

    // 过滤metaInfo中的冗余字体信息
    if (_get(data, 'metaInfo.materials')) {
      _set(data, 'metaInfo.materials', data.metaInfo.materials.filter(function (item) {
        return item.type !== 'font';
      }));
    }

    if (!data.fontFamily) {
      data.fontFamily = 'SourceHanSansSC-Regular';
    }

    convertOldTable(data);
    convertObsoleteTableData(data);
    _this = _BaseModel.call(this, data) || this;
    _this._currentRange = null;
    _this.$lastRange = null;
    _this.$lastStyleId = null;
    _this.$cells = [];
    _this.$styleMap = new Map();

    _this._init(data.tableData);

    _this.$getResizeLimit = function () {
      var minSize = getTableMinSize(_assertThisInitialized(_this));
      return {
        maxWidth: Infinity,
        maxHeight: Infinity,
        minWidth: minSize.width,
        minHeight: minSize.height
      };
    };

    return _this;
  }

  var _proto = Table.prototype;

  _proto._init = function _init(tableData) {
    var _this2 = this;

    this.$styleMap = new Map(Object.entries(tableData.styles));
    this.$cells = []; // 样式数据展开

    this.$styleMap.forEach(function (style) {
      if (style.borders) {
        Object.assign(style, dlzBorders(style.borders));
        delete style.borders;
      }

      if (style.padding) {
        Object.assign(style, dlzPadding(style.padding));
        delete style.padding;
      }
    });
    tableData.cells.forEach(function (row, rIdx) {
      var _row = [];
      row.forEach(function (cell, cIdx) {
        _row.push(cell ? new CellModel(cell, {
          table: _this2,
          position: [rIdx, cIdx]
        }) : null);
      });

      _this2.$cells.push(_row);
    });
  };

  _proto.getCurrentStyleId = function getCurrentStyleId() {
    if (_isEqual(this.$lastRange, this.$currentRange) && this.$lastStyleId) {
      return this.$lastStyleId;
    }

    var style = {};
    var key = genStyleId(this.tableData.styles);
    this.tableData.styles[key] = style;
    this.$styleMap.set(key, style);
    this.$lastStyleId = key;
    this.$lastRange = this.$currentRange;
    return this.$lastStyleId;
  };

  _proto.getCurrentStyle = function getCurrentStyle() {
    return this.$styleMap.get(this.getCurrentStyleId());
  };

  _proto.resizeTable = function resizeTable(ratio) {
    _resizeTable(this, ratio);
  };

  _proto.load = function load() {
    this.syncTableData();

    this._init(this.tableData);
  };

  _proto.render = function render(editor) {
    var _this3 = this;

    return this.renderImage(editor).then(function (img) {
      var canvas = createCanvas(_this3.width, _this3.height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, _this3.width, _this3.height);
      return canvas;
    });
  };

  _proto.renderImage = function renderImage(editor) {
    var $table = createTableDom(editor, this);
    var cloneNode = $table.cloneNode(true); // table出图内容展示优先级高于尺寸
    // 获取table dom尺寸(table可见尺寸可能大于size)

    Object.assign(cloneNode.style, {
      width: this.width + 'px',
      height: this.height + 'px'
    });
    document.body.appendChild(cloneNode);
    this.width = cloneNode.offsetWidth;
    this.height = cloneNode.offsetHeight; // 1px边框缩放视觉还原

    try {
      var zoom = editor.zoom;

      if (zoom < 1) {
        var borderWidth = 0;
        var firstCell = this.$cells[0][0];
        get4SizeNames('border').forEach(function (name) {
          name += 'Width';
          borderWidth = Math.max(borderWidth, firstCell.$style[name]);
        });

        if (borderWidth === 1) {
          cloneNode.querySelectorAll('tbody>tr>td').forEach(function ($td) {
            $td.style.borderWidth = '1px';
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    document.body.removeChild(cloneNode);
    var tableRenderer = new TableRenderer(this, TableRenderer.node2String(cloneNode, this), editor);
    return tableRenderer.renderImage();
  };

  _proto.getFontFamilies = function getFontFamilies() {
    var list = [];
    this.$styleMap.forEach(function (style) {
      if (style.fontFamily && !list.includes(style.fontFamily)) {
        list.push(style.fontFamily);
      }
    });
    return list;
  };

  _proto.getColors = function getColors() {
    var colors = [];
    this.$styleMap.forEach(function (style) {
      var colorStyle = _pickBy(style, function (v, k) {
        return /color$/i.test(k);
      });

      colors.push.apply(colors, Object.values(colorStyle));
    });
    return colors;
  };

  _proto.exportData = function exportData(editor) {
    this.syncTableData();
    var fonts = this.getFontFamilies().map(function (name) {
      return editor.options.fontsMap[name];
    }).filter(Boolean).map(function (font) {
      return {
        id: font.id,
        type: 'font'
      };
    });

    _set(this, 'metaInfo.materials', _get(this, 'metaInfo.materials', []).concat(fonts));

    return this;
  }
  /**
   * 同步表格数据
   */
  ;

  _proto.syncTableData = function syncTableData() {
    var _model = this;

    var cells = [];
    var usedStyleMap = {};

    _model.$cells.forEach(function (row) {
      var _row = [];
      row.forEach(function (cell) {
        _row.push(cell ? cell.toObject() : null);

        if (!cell) return;
        var styleIds = cell.styleIds;
        var cellStyle = {};

        for (var i = styleIds.length - 1; i >= 0; i--) {
          var id = styleIds[i];

          var curStyle = _clone(_model.$styleMap.get(id));

          if (!curStyle) continue;
          var cellStyleKeys = Object.keys(cellStyle);
          var curStyleKeys = Object.keys(curStyle);
          var existCount = 0;

          for (var j = 0; j < curStyleKeys.length; j++) {
            var key = curStyleKeys[j];
            if (!cellStyleKeys.includes(key)) break;
            existCount++;
          }

          if (existCount === curStyleKeys.length) {
            cell.styleIds.splice(i, 1);
          } else {
            Object.assign(cellStyle, curStyle);
            !usedStyleMap[id] && (usedStyleMap[id] = true);
          }
        }
      });
      cells.push(_row);
    });

    var styles = {}; // 冗余样式过滤

    _model.$styleMap.forEach(function (style, id) {
      if (usedStyleMap[id] || [_model.tableData.all].concat(_model.tableData.rules).find(function (d) {
        return d.styleId === id;
      })) {
        var _style = _extends({}, style); // 样式数据压缩


        get4SizeNames('border').forEach(function (name, i) {
          if (_style[name + 'Style']) {
            !_style.borders && (_style.borders = new Array(4).fill(null));
            _style.borders[i] = {
              style: _style[name + 'Style'],
              width: _style[name + 'Width'],
              color: _style[name + 'Color']
            };
            delete _style[name + 'Style'];
            delete _style[name + 'Width'];
            delete _style[name + 'Color'];
          }
        }); // 简化边框

        if (_style.borders && _isEqual(_style.borders[0], _style.borders[0]) && _isEqual(_style.borders[0], _style.borders[1]) && _isEqual(_style.borders[0], _style.borders[2]) && _isEqual(_style.borders[0], _style.borders[3])) {
          _style.borders = [_style.borders[0]];
        }

        if (_style.paddingTop) {
          _style.padding = [_style.paddingTop];
          get4SizeNames('padding').forEach(function (name) {
            delete _style[name];
          });
        }

        styles[id] = _style;
      }
    });

    _model.tableData.cells = cells;
    _model.tableData.styles = styles;
  }
  /**
   * 更新样式
   */
  ;

  _proto.changeStyle = function changeStyle(props) {
    if (!props) return;
    var styleId = this.getCurrentStyleId();
    var style = this.$styleMap.get(styleId);
    Object.assign(style, props);
    var range = this.$currentRange || {
      row: 1,
      col: 1,
      rowspan: this.$cells.length,
      colspan: this.$cells[0].length
    };

    for (var r = range.row - 1; r < range.row + range.rowspan - 1; r++) {
      for (var c = range.col - 1; c < range.col + range.colspan - 1; c++) {
        var cell = this.$cells[r][c];

        if (cell) {
          Object.assign(cell.$style, _cloneDeep(style));

          if (!cell.styleIds.includes(styleId)) {
            cell.styleIds.push(styleId);
          }
        }
      }
    }
  };

  _createClass(Table, [{
    key: "$currentRange",
    get: function get() {
      return this._currentRange;
    },
    set: function set(range) {
      this._currentRange = range;
    }
  }, {
    key: "$tableData",
    set: function set(v) {
      this.tableData = v;

      this._init(v);
    }
  }]);

  return Table;
}(BaseModel);

export default Table;