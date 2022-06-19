import _extends from "@babel/runtime/helpers/extends";
import _pickBy from "lodash/pickBy";
import _isEqual from "lodash/isEqual";
import get from 'lodash/get';
import tinycolor from 'tinycolor2';
import { CellModel } from "./cell-model";
import Vue from 'vue';
import TableComponent from "./table-controller/component/main.vue";

function getTableDom(model) {
  return document.body.querySelector("#__table-controller-" + model.$id + "__ table");
}
/**
 * 生成样式ID
 */


export function genStyleId(styles) {
  if (styles === void 0) {
    styles = {};
  }

  return ((Math.max.apply(Math, Object.keys(styles).filter(Boolean)) || 0) + 1).toString();
}
/**
 *  更新表格元素
 */

export function shotTableElement(model, editor, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
      _options$fixed = _options.fixed,
      fixed = _options$fixed === void 0 ? true : _options$fixed,
      _options$props = _options.props,
      props = _options$props === void 0 ? {} : _options$props;
  editor.$nextTick(function () {
    var $table = getTableDom(model);

    if (!fixed) {
      $table.style.height = 'auto';
    } else {
      if (props.width) {
        $table.style.width = props.width + 'px';
      }

      if (props.height) {
        $table.style.height = props.height + 'px';
      }

      completedTableSize($table, model);
    }

    Object.assign(model, _extends({}, props, {
      width: $table.offsetWidth,
      height: $table.offsetHeight
    }));
    $table.style.width = '100%';
    $table.style.height = '100%';
    model.syncTableData();
    editor.makeSnapshotByElement(model);
  });
} // 获取行doms

export function getTrDoms($table) {
  var $doms = [];
  $table.querySelectorAll('tbody>tr').forEach(function ($tr) {
    return $doms.push($tr);
  });
  return $doms;
} // 获取列doms

export function getColDoms($table) {
  var $doms = [];
  $table.querySelectorAll('colgroup>col').forEach(function ($col) {
    return $doms.push($col);
  });
  return $doms;
} // 补充表格尺寸规格

export function completedTableSize($table, model) {
  if (!$table || !model) return;
  var trHeights = getTrDoms($table).map(function ($tr) {
    return $tr.offsetHeight;
  });
  var colWidths = getColDoms($table).map(function ($col) {
    return getColOffsetWidth($col);
  });
  setTableSizeRule(model.tableData, {
    cols: colWidths,
    rows: trHeights
  });
}
/**
 * 合并单元格
 */

export function mergeCells(model, range) {
  var cells = model.$cells;
  var row = range.row,
      col = range.col,
      rowspan = range.rowspan,
      colspan = range.colspan;
  var currentCell = cells[row - 1][col - 1];
  Object.assign(currentCell, {
    rowspan: rowspan,
    colspan: colspan
  });
  var contents = [];

  for (var i = row - 1; i < row + rowspan - 1; i++) {
    var content = '';

    for (var j = col - 1; j < col + colspan - 1; j++) {
      var cell = cells[i][j];
      content += cell ? cell.content : '';
      if (i === row - 1 && j === col - 1) continue;
      replaceCell(cells, i, j, null);
    }

    content && contents.push(content);
  }

  currentCell.content = contents.join('\n');
  return cells;
}
/**
 * 拆分单元格
 */

export function splitCell(model, row, col) {
  var cells = model.$cells;
  var curCell = cells[row - 1][col - 1];

  for (var i = row; i < row + curCell.rowspan; i++) {
    for (var j = col; j < col + curCell.colspan; j++) {
      var cell = cells[i - 1][j - 1];

      if (!cell) {
        replaceCell(cells, i - 1, j - 1, new CellModel({
          content: '',
          styleIds: [].concat(curCell.styleIds)
        }, {
          table: model,
          position: [i - 1, j - 1]
        }));
      }
    }
  }

  curCell.rowspan = 1;
  curCell.colspan = 1;
  return cells;
}
/**
 * 是否可拆分单元格
 */

export function canSplitCell(cells, range) {
  if (!range) return false;
  if (range.colspan < 2 && range.rowspan < 2) return false;
  var cell = cells[range.row - 1][range.col - 1];
  if (!cell) return false;
  return _isEqual(range, _extends({}, range, {
    colspan: cell.colspan,
    rowspan: cell.rowspan
  }));
}
/**
 * 是否可合并单元格
 */

export function canMergeCells(cells, range) {
  if (!range || range.colspan === 1 && range.rowspan === 1) return false;
  var selectedRow = range.colspan === cells[0].length;
  var selectedCol = range.rowspan === cells.length;
  var selectedAll = selectedRow && selectedCol;
  if (selectedAll) return true;
  var suitRange = findSuitRange(cells, range, {
    row: range.row + range.rowspan - 1,
    col: range.col + range.colspan - 1
  });
  return _isEqual(suitRange, range);
}
/**
 * 设置表格行列尺寸规则
 */

export function setTableSizeRule(table, _ref) {
  var cols = _ref.cols,
      rows = _ref.rows;

  if (!table.cols.length) {
    table.cols = cols.map(function (v) {
      return {
        width: v
      };
    });
  } else {
    cols.forEach(function (colW, i) {
      table.cols[i].width = colW;
    });
  }

  if (!table.rows.length) {
    table.rows = rows.map(function (v) {
      return {
        height: v
      };
    });
  } else {
    rows.forEach(function (v, i) {
      table.rows[i].height = v;
    });
  }

  return table;
}
/**
 * 添加行列
 */

export function createStrips(model, editor, type, options) {
  if (options === void 0) {
    options = {};
  }

  var _model$tableData = model.tableData,
      _model$tableData$rows = _model$tableData.rows,
      rows = _model$tableData$rows === void 0 ? [] : _model$tableData$rows,
      _model$tableData$cols = _model$tableData.cols,
      cols = _model$tableData$cols === void 0 ? [] : _model$tableData$cols;
  var cells = model.$cells;
  var _options2 = options,
      _options2$baseIndex = _options2.baseIndex,
      baseIndex = _options2$baseIndex === void 0 ? 0 : _options2$baseIndex,
      _options2$direction = _options2.direction,
      direction = _options2$direction === void 0 ? 1 : _options2$direction,
      _options2$count = _options2.count,
      count = _options2$count === void 0 ? 1 : _options2$count;
  var index = baseIndex + direction;
  var rules = type === 'r' ? rows : cols;
  var rc = cells.length;
  var cc = cells[0].length;
  var cellMap = new Map();
  cells.forEach(function (row, rIdx) {
    row.forEach(function (cell, cIdx) {
      var id = rIdx + "$" + cIdx;

      if (cell) {
        cellMap.set(id, {
          cell: cell,
          top: rIdx + 1,
          bottom: rIdx + (cell.rowspan || 1),
          left: cIdx + 1,
          right: cIdx + (cell.colspan || 1),
          spaned: false
        });
      } else {
        var range = findSpanCellRange(cells, rIdx, cIdx);
        cellMap.set(id, {
          spanId: range.row - 1 + "$" + (range.col - 1)
        });
      }
    });
  });

  if (type === 'c') {
    var _loop = function _loop(r) {
      var item = cellMap.get(r + "$" + baseIndex);
      if (item.spanId) item = cellMap.get(item.spanId);
      var newCells = new Array(count).fill(null);

      if (index >= item.left && index < item.right) {
        if (!item.spaned) {
          item.cell.colspan += count;
          item.spaned = true;
        }
      } else {
        var styleIds = item.cell.styleIds;
        var cellOptions = {
          table: model,
          position: [r, index]
        };
        newCells = new Array(count).fill(null).map(function () {
          return new CellModel({
            content: '',
            styleIds: styleIds
          }, cellOptions);
        });
      }

      newCells.forEach(function (cell) {
        cells[r].splice(index, -1, cell);
      });
    };

    for (var r = 0; r < rc; r++) {
      _loop(r);
    }
  } else {
    (function () {
      var newCells = [];

      for (var c = 0; c < cc; c++) {
        var item = cellMap.get(baseIndex + "$" + c);
        if (item.spanId) item = cellMap.get(item.spanId);

        if (index >= item.top && index < item.bottom) {
          newCells.push(null);

          if (!item.spaned) {
            item.cell.rowspan += count;
            item.spaned = true;
          }
        } else {
          var styleIds = item.cell.styleIds;
          newCells.push(new CellModel({
            content: '',
            styleIds: styleIds
          }, {
            table: model
          }));
        }
      }

      var _count = count;

      while (_count--) {
        var row = newCells.map(function (cell, cIdx) {
          return cell ? cell.clone({
            table: model,
            position: [index + _count, cIdx]
          }) : cell;
        });
        cells.splice(index, -1, row);
      }
    })();
  } // 斑马样式重置


  if (type === 'r') {
    cells.slice(index + count).forEach(function (row, rIdx) {
      row.forEach(function (cell, cIdx) {
        cell && cell.rerender({
          table: model,
          position: [index + count + rIdx, cIdx]
        });
      });
    });
  } else {
    cells.forEach(function (row, rIdx) {
      row.slice(index + count).forEach(function (cell, c) {
        cell && cell.rerender({
          table: model,
          position: [rIdx, index + c + 1]
        });
      });
    });
  } // 规则位移


  var baseRule = rules[baseIndex];
  var _count = count;

  while (_count) {
    rules.splice(index, -1, _extends({}, baseRule));
    _count--;
  }

  editor.$events.$emit('table.createStrips', {
    element: model,
    layout: editor.currentLayout
  });
  shotTableElement(model, editor);
}
/**
 * 寻找合并单元格主单元格
 */

export function findSpanCellRange(cells, rIdx, cIdx) {
  var curCell = cells[rIdx][cIdx];
  if (curCell) return {
    row: rIdx + 1,
    col: cIdx + 1,
    rowspan: curCell.rowspan || 1,
    colspan: curCell.colspan || 1
  };

  for (var r = 0; r <= rIdx; r++) {
    for (var c = 0; c <= cIdx; c++) {
      var cell = cells[r][c];

      if (cell && r + cell.rowspan > rIdx && c + cell.colspan > cIdx) {
        return {
          row: r + 1,
          col: c + 1,
          rowspan: cell.rowspan || 1,
          colspan: cell.colspan || 1
        };
      }
    }
  }
}
/**
 * 删除行列
 */

export function deleteStrips(model, editor, range) {
  var _model$tableData2 = model.tableData,
      rows = _model$tableData2.rows,
      cols = _model$tableData2.cols;
  var cells = model.$cells;
  var type = range.rowspan === cells.length ? 'c' : 'r';
  var rules = type === 'r' ? rows : cols;
  var width = model.width;
  var height = model.height;

  if (type === 'c') {
    rules.splice(range.col - 1, range.colspan);
    width = rules.reduce(function (w, rule) {
      return w + rule.width;
    }, 0);
    cells.forEach(function (row, rIdx) {
      // 合并单元格数据整合
      var spanCellIndex;
      var childCellLen = 0;

      for (var i = 0; i < range.colspan; i++) {
        var cell = row[range.col - 1 + i];
        if (i === 0 && !cell || !cell && childCellLen) childCellLen++;else childCellLen = 0;

        if (cell && cell.colspan > 1) {
          spanCellIndex = i;
        }
      }

      if (childCellLen) {
        var spanCell = findSpanCellRange(cells, rIdx, range.col - 1);

        if (spanCell && spanCell.row === rIdx + 1) {
          cells[spanCell.row - 1][spanCell.col - 1].colspan -= childCellLen;
        }
      }

      if (spanCellIndex >= 0) {
        var _spanCell = row[range.col - 1 + spanCellIndex];
        var spanDiff = _spanCell.colspan - (range.colspan - spanCellIndex);

        if (spanDiff > 0) {
          var cIdx = range.col - 1 + range.colspan;
          replaceCell(cells, rIdx, cIdx, new CellModel(_extends({}, _spanCell, {
            colspan: spanDiff
          }), {
            table: model,
            position: [rIdx, cIdx]
          }));
        }
      }

      row.splice(range.col - 1, range.colspan);
    });
  } else {
    rules.splice(range.row - 1, range.rowspan);
    height = rules.reduce(function (v, rule) {
      return v + rule.height;
    }, 0); // 合并单元格数据整合

    for (var i = range.row - 1; i < range.row + range.rowspan - 1; i++) {
      var row = cells[i];

      for (var c = row.length - 1; c >= 0; c--) {
        var cell = row[c];

        if (!cell) {
          var spanCell = findSpanCellRange(cells, i, c);
          if (spanCell.row - 1 === i) continue;
          var prevSpanCell = spanCell.row - 1 < i && c > 0 && !row[c - 1] && findSpanCellRange(cells, i, c - 1);

          if (!prevSpanCell || spanCell.row !== prevSpanCell.row || spanCell.col !== prevSpanCell.col) {
            cells[spanCell.row - 1][spanCell.col - 1].rowspan--;
          }
        } else if (cell.rowspan > 1) {
          replaceCell(cells, i + 1, c, new CellModel(_extends({}, cell, {
            rowspan: cell.rowspan - 1
          }), {
            table: model,
            position: [i + 1, c]
          }));
        }
      }
    }

    cells.splice(range.row - 1, range.rowspan); // 斑马样式重置

    cells.slice(range.row - 1).forEach(function (row, rIdx) {
      row.forEach(function (cell, cIdx) {
        cell && cell.rerender({
          table: model,
          position: [range.row - 1 + rIdx, cIdx]
        });
      });
    });
  }

  model.$currentRange = null;
  Object.assign(model, {
    width: width,
    height: height
  });
  editor.$events.$emit('table.deleteStrips', {
    element: model,
    layout: editor.currentLayout
  });
  shotTableElement(model, editor);
}
/**
 * 清除单元格内容
 */

export function clearCells(model, range) {
  var cells = model.$cells;

  for (var i = range.row; i < range.row + range.rowspan; i++) {
    for (var j = range.col; j < range.col + range.colspan; j++) {
      var cell = cells[i - 1][j - 1];
      cell && (cell.content = '');
    }
  }
}
/**
 * 查找合适的选取范围
 * @param {*} cells 数据
 * @param {*} start 开始位置
 * @param {*} end 结束位置
 * @returns range
 */

export function findSuitRange(cells, start, end) {
  // 单元格映射
  var cellReMap = {};
  cells.forEach(function (row, rIdx) {
    row.forEach(function (cell, cIdx) {
      if (!cell) return false;

      if (cell.rowspan > 1 || cell.colspan > 1) {
        for (var r = rIdx + 1; r <= rIdx + (cell.rowspan || 1); r++) {
          for (var c = cIdx + 1; c <= cIdx + (cell.colspan || 1); c++) {
            var _key = r + ":" + c;

            cellReMap[_key] = rIdx + 1 + ":" + (cIdx + 1);
          }
        }
      }

      var key = rIdx + 1 + ":" + (cIdx + 1);
      cellReMap[key] = key;
    });
  }); // format start&end

  var minRow = Math.min(start.row, end.row);
  var minCol = Math.min(start.col, end.col);
  var maxRow = Math.max(start.row, end.row);
  var maxCol = Math.max(start.col, end.col);
  start = {
    row: minRow,
    col: minCol
  };
  end = {
    row: maxRow,
    col: maxCol
  };
  var startCell = cells[start.row - 1][start.col - 1];
  var endCell = cells[end.row - 1][end.col - 1];

  if (!startCell) {
    var _cellReMap$$split$map = cellReMap[start.row + ":" + start.col].split(':').map(Number),
        _row = _cellReMap$$split$map[0],
        _col = _cellReMap$$split$map[1];

    start.row = _row;
    start.col = _col;
  }

  if (!endCell) {
    var _cellReMap$$split$map2 = cellReMap[end.row + ":" + end.col].split(':').map(Number),
        _row2 = _cellReMap$$split$map2[0],
        _col2 = _cellReMap$$split$map2[1];

    end.row = _row2;
    end.col = _col2;
  }

  _fillRange(cells, start);

  _fillRange(cells, end);

  var left = start.col;
  var right = end.col + (end.colspan - 1 || 0);
  var top = start.row;
  var bottom = end.row + (end.rowspan - 1 || 0);

  function _findRange() {
    for (var r = top; r <= bottom; r++) {
      for (var c = left; c <= right; c++) {
        var cell = cells[r - 1][c - 1];

        if (!cell || cell.rowspan > 1 || cell.colspan > 1) {
          var _cellReMap$$split$map3 = cellReMap[r + ":" + c].split(':').map(Number),
              _row3 = _cellReMap$$split$map3[0],
              _col3 = _cellReMap$$split$map3[1];

          var _cell2 = cells[_row3 - 1][_col3 - 1];
          var rowspan = _cell2.rowspan || 1;
          var colspan = _cell2.colspan || 1;

          if (_row3 < top || _row3 + rowspan - 1 > bottom || _col3 < left || _col3 + colspan - 1 > right) {
            left = Math.min(_col3, left);
            right = Math.max(_col3 + colspan - 1, right);
            top = Math.min(_row3, top);
            bottom = Math.max(_row3 + rowspan - 1, bottom);
            return _findRange();
          }
        }
      }
    }

    return {
      row: top,
      col: left,
      rowspan: bottom - top + 1,
      colspan: right - left + 1
    };
  }

  return _findRange();
} // 补充range

function _fillRange(cells, range) {
  var cell = cells[range.row - 1][range.col - 1];
  if (!cell) return range;

  if (!range.rowspan) {
    range.rowspan = cell.rowspan || 1;
  }

  if (!range.colspan) {
    range.colspan = cell.colspan || 1;
  }

  return range;
}

export function getGradientBackground(gradient) {
  var result = [];
  result.push(90 - gradient.angle + 'deg');
  gradient.stops.forEach(function (item) {
    result.push(item.color + " " + item.offset * 100 + "%");
  });
  var gradientString = result.join(',');
  return "linear-gradient(" + gradientString + ")";
}
/**
 * 表格缩放
 */

export function resizeTable(model, ratio) {
  if (ratio === void 0) {
    ratio = 1;
  }

  var _model$tableData3 = model.tableData,
      rows = _model$tableData3.rows,
      cols = _model$tableData3.cols;
  rows.forEach(function (rule) {
    rule.height = Math.round(rule.height * ratio);
  });
  cols.forEach(function (rule) {
    rule.width = Math.round(rule.width * ratio);
  });
  resizeTableStyle(model, ratio);
}
/**
 * 原始表格数据缩放
 */

export function resizePlainTable(data, ratio) {
  if (ratio === void 0) {
    ratio = 1;
  }

  var _data$tableData = data.tableData,
      rows = _data$tableData.rows,
      cols = _data$tableData.cols;
  rows.forEach(function (rule) {
    rule.height = Math.round(rule.height * ratio);
  });
  cols.forEach(function (rule) {
    rule.width = Math.round(rule.width * ratio);
  });
  Object.values(data.tableData.styles).forEach(function (style) {
    style.fontSize && (style.fontSize = Math.round(style.fontSize * ratio));
    style.padding && (style.padding = style.padding.map(function (side) {
      return side * ratio;
    }));
    style.borders && style.borders.forEach(function (border) {
      if (border && border.width) {
        Math.max(1, Math.round(border.width * ratio));
      }
    });
  });
}
/**
 * 表格样式缩放
 */

export function resizeTableStyle(model, ratio) {
  if (ratio === void 0) {
    ratio = 1;
  }

  model.$styleMap.forEach(function (style) {
    _scaleStyle(style, ratio);
  });
  model.$cells.forEach(function (row) {
    row.forEach(function (cell) {
      if (!cell) return;

      _scaleStyle(cell.$style, ratio);
    });
  });
}

function _scaleStyle(style, ratio) {
  style.fontSize && (style.fontSize = Math.round(style.fontSize * ratio));
  get4SizeNames('padding').forEach(function (name) {
    if (style[name]) style[name] *= ratio;
  });
  get4SizeNames('border').forEach(function (name) {
    name = name + 'Width';

    if (style[name]) {
      style[name] = Math.round(style[name] * ratio);
      if (style[name] < 1) style[name] = 1;
    }
  });
}
/**
 * 获取四边属性名称
 */


export function get4SizeNames(name) {
  return [name + 'Top', name + 'Right', name + 'Bottom', name + 'Left'];
}
/** 获取table边框尺寸
 * border-collapse计算规则 https://www.w3.org/TR/CSS2/tables.html#borders
 */

export function getTableBorderSizes(model) {
  var cells = model.$cells;
  var sizes = new Array(4).fill(0);
  sizes[0] = (cells[0][0].$style.borderTopStyle !== 'none' && cells[0][0].$style.borderTopWidth || 0) / 2;
  sizes[3] = (cells[0][0].$style.borderLeftStyle !== 'none' && cells[0][0].$style.borderLeftWidth || 0) / 2;
  var headRow = cells[0];
  var lastHeadRowCellIndex;

  for (var i = headRow.length - 1; i >= 0; i--) {
    if (headRow[i]) {
      lastHeadRowCellIndex = i;
      break;
    }
  }

  if (cells[0] && cells[0][lastHeadRowCellIndex]) {
    sizes[1] = (cells[0][lastHeadRowCellIndex].$style.borderRightStyle !== 'none' && cells[0][lastHeadRowCellIndex].$style.borderRightWidth || 0) / 2;
  }

  return sizes;
}
/**
 * 获取表格可视宽
 */

export function getTableViewportWidth(model) {
  var borderSizes = getTableBorderSizes(model);
  var width = getTableDom(model).offsetWidth + borderSizes[3] + borderSizes[1];
  return width;
}
/**
 * 获取表格可视宽高
 */

export function getTableViewportSize(model) {
  return {
    width: getTableViewportWidth(model),
    height: getTableDom(model).offsetHeight
  };
}
/**
 * 添加默认表格
 */

export function createDefaultTable(rc, cc) {
  var cells = [];

  for (var r = 0; r < rc; r++) {
    var row = [];

    for (var c = 0; c < cc; c++) {
      row.push({
        content: ''
      });
    }

    cells.push(row);
  }

  var defaultStyle = {
    fontSize: 13,
    fontFamily: 'SourceHanSansSC-Regular',
    lineHeight: 1.5,
    fontWeight: 200,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    backgroundColor: '#ffffffff',
    color: '#333333'
  };
  return {
    cells: cells,
    styles: {
      1: _extends({}, defaultStyle, {
        borders: [{
          style: 'solid',
          width: 1,
          color: '#b4b8bfff'
        }],
        padding: [4]
      })
    },
    all: {
      styleId: '1'
    },
    rules: [],
    rows: [],
    cols: []
  };
}
/**
 * 获取纯表格数据字体
 */

export function getPlainTableDataFontFamilies(data) {
  var families = [];

  if (!data.tableData) {
    return families;
  } else if (data.tableData.styles) {
    Object.values(data.tableData.styles).forEach(function (style) {
      if (style.fontFamily && families.includes(style.fontFamily)) families.push(style.fontFamily);
    });
    return families;
  } else if (data.tableData.table) {
    var _data$tableData2 = data.tableData,
        table = _data$tableData2.table,
        rows = _data$tableData2.rows,
        cols = _data$tableData2.cols,
        cells = _data$tableData2.cells;
    var _cells = [];
    cells.forEach(function (row) {
      return _cells.push.apply(_cells, row);
    });
    [table].concat(rows, cols, _cells).forEach(function (item) {
      if (item && item.fontFamily && !families.includes(item.fontFamily)) families.push(item.fontFamily);
    });
    return families;
  }

  return families;
}
/**
 * 转化过时TableData
 */

export function convertObsoleteTableData(model) {
  var _styles;

  var tableData = model.tableData;
  if (!tableData.table) return true;

  var _pickColStyle = function _pickColStyle(rule) {
    return _pickBy(rule, function (v, k) {
      return !['coefficient', 'remainder', 'width'].includes(k);
    });
  };

  var _pickRowStyle = function _pickRowStyle(rule) {
    return _pickBy(rule, function (v, k) {
      return !['coefficient', 'remainder', 'height'].includes(k);
    });
  };

  var rows = [];
  var cols = [];
  var rules = [];
  var table = tableData.table,
      srcCols = tableData.cols,
      srcRows = tableData.rows,
      srcCells = tableData.cells;
  var id = 1;
  var styles = (_styles = {}, _styles[id] = _extends({}, table), _styles);
  var colDivideRules = srcCols.filter(function (rule) {
    return rule.coefficient;
  });
  var colOrderRules = srcCols.filter(function (rule) {
    return !rule.coefficient;
  });
  var colOrderStyles = [];
  var colRulestyles = colDivideRules.map(function (rule) {
    return [(++id).toString(), _pickColStyle(rule), rule.coefficient, rule.remainder];
  });
  colOrderRules.forEach(function (rule) {
    if (rule.width) cols[rule.remainder - 1] = {
      width: rule.width
    };
    colOrderStyles.push([(++id).toString(), _pickColStyle(rule), rule.remainder]);
  });
  var rowDivideRules = srcRows.filter(function (rule) {
    return rule.coefficient;
  });
  var rowOrderRules = srcRows.filter(function (rule) {
    return !rule.coefficient;
  });
  var rowOrderStyles = [];
  var rowRulestyles = rowDivideRules.map(function (rule) {
    return [(++id).toString(), _pickBy(rule, function (v, k) {
      return !['coefficient', 'remainder', 'height'].includes(k);
    }), rule.coefficient, rule.remainder];
  });
  rowOrderRules.forEach(function (rule) {
    if (rule.height) rows[rule.remainder - 1] = {
      height: rule.height
    };
    rowOrderStyles.push([(++id).toString(), _pickRowStyle(rule), rule.remainder]);
  });
  var cells = [];
  var cellStyles = [];
  srcCells.forEach(function (row, rIdx) {
    var _row = [];
    row.forEach(function (cell, cIdx) {
      if (!cell) return _row.push(null);
      var _cell = {
        content: cell.content,
        styleIds: []
      };
      if (cell.rowspan) _cell.rowspan = cell.rowspan;
      if (cell.colspan) _cell.colspan = cell.colspan;
      colOrderStyles.forEach(function (style) {
        if (cIdx + 1 === style[2]) {
          _cell.styleIds.push(style[0]);
        }
      });
      rowOrderStyles.forEach(function (style) {
        if (rIdx + 1 === style[2]) {
          _cell.styleIds.push(style[0]);
        }
      });

      var cellStyle = _pickBy(cell, function (v, k) {
        return !['content', 'rowspan', 'colspan'].includes(k);
      });

      if (Object.keys(cellStyle).length) {
        var style = [(++id).toString(), cellStyle];
        cellStyles.push(style);

        _cell.styleIds.push(style[0]);
      }

      _row.push(_cell);
    });
    cells.push(_row);
  });
  [].concat(colRulestyles, colOrderStyles, rowRulestyles, rowOrderStyles, cellStyles).forEach(function (style) {
    styles[style[0]] = style[1];
  });
  rowRulestyles.forEach(function (style) {
    rules.push({
      type: 'row',
      styleId: style[0],
      coefficient: style[2],
      remainder: style[3]
    });
  });
  colRulestyles.forEach(function (style) {
    rules.push({
      type: 'col',
      styleId: style[0],
      coefficient: style[2],
      remainder: style[3]
    });
  });
  model.tableData = {
    cells: cells,
    rows: rows,
    cols: cols,
    styles: styles,
    rules: rules,
    all: {
      styleId: '1'
    }
  };
}
/**
 * 旧table元素转换成新数据
 */

export function convertOldTable(model) {
  model.contents = null;
  model.content = null;
  if (!model.gridData || model.tableData) return model.tableData;
  var gridData = model.gridData,
      gridTheme = model.gridTheme,
      gridOptions = model.gridOptions;
  var colors = gridTheme.colors,
      container = gridTheme.container,
      grids = gridTheme.grids,
      lines = gridTheme.lines;
  var tableData = {
    table: {
      fontSize: model.fontSize,
      fontFamily: model.fontFamily || 'SourceHanSansSC-Regular'
    },
    rows: [{
      coefficient: 1,
      remainder: 0
    }],
    cols: [{
      coefficient: 1,
      remainder: 0
    }],
    cells: new Array(gridData.length)
  }; // content

  gridData.forEach(function (row, rIdx) {
    tableData.cells[rIdx] = [];
    row.forEach(function (content, cIdx) {
      tableData.cells[rIdx][cIdx] = {
        content: content
      };
    });
  });

  var convertBorder = function convertBorder(border) {
    var borders = [];

    if (border.style) {
      borders = new Array(4).fill(null).map(function () {
        return _extends({}, border);
      });
    } else {
      borders = [border.top, border.right, border.bottom, border.left];
    }

    borders.forEach(function (border) {
      border && (border.color = colors[border.color] || border.color);
    });
    return borders;
  };

  var convertBackground = function convertBackground(background) {
    return {
      backgroundColor: Number.isInteger(background.color) ? colors[background.color] : background.color
    };
  };

  var convertFont = function convertFont(font) {
    var style = {};
    Object.keys(font).forEach(function (key) {
      style["font" + (key[0].toUpperCase() + key.slice(1))] = font[key];
    });
    return style;
  };

  var justifyMap = {
    start: 'left',
    end: 'right',
    center: 'center'
  };

  var convertUI = function convertUI(ui) {
    if (ui === void 0) {
      ui = {};
    }

    var style = {};
    ui.color !== undefined && (style.color = colors[ui.color] || ui.color);
    ui.background && Object.assign(style, convertBackground(ui.background));
    ui.border && (style.borders = convertBorder(ui.border));
    ui.font && Object.assign(style, convertFont(ui.font));
    ui.justifyContent && (style.textAlign = justifyMap[ui.justifyContent]);
    ui.padding && (style.padding = ui.padding);
    return style;
  }; // container
  // 默认居中


  tableData.table.textAlign = 'center';
  var containerStyle = convertUI(container); // 去除container字体数据

  delete containerStyle.fontFamily;
  Object.assign(tableData.table, containerStyle); // container边框转换成上下左右行(列)边框

  if (tableData.table.borders) {
    // 上右下左
    [1, gridData[0].length, gridData.length, 1].forEach(function (remainder, i) {
      var borders = new Array(4);
      borders[i] = tableData.table.borders[i];
      tableData[i % 2 ? 'cols' : 'rows'].push({
        coefficient: 0,
        remainder: remainder,
        borders: borders
      });
    });
    delete tableData.table.borders;
  } // rule转换


  var convertRule = function convertRule(lines, coefficient, remainder, ui) {
    if (lines === void 0) {
      lines = [];
    }

    var line = lines.find(function (line) {
      return line.coefficient === coefficient && line.remainder === remainder;
    });

    if (line) {
      Object.assign(line, convertUI(ui));
    } else {
      var newRule = _extends({
        coefficient: coefficient,
        remainder: remainder
      }, convertUI(ui));

      coefficient ? lines.unshift(newRule) : lines.push(newRule);
    }
  };

  [].concat(grids, lines).forEach(function (grid) {
    switch (grid.type) {
      case 'common':
        Object.assign(tableData.table, convertUI(grid.ui));
        break;

      case 'repeat':
        if (grid.match.row) {
          convertRule(tableData.rows, grid.match.row.coefficient, grid.match.row.remainder, grid.ui);
        } else if (grid.match.col) {
          convertRule(tableData.cols, grid.match.col.coefficient, grid.match.col.remainder, grid.ui);
        }

        break;

      case 'single':
        if (Number.isInteger(grid.match.row)) {
          convertRule(tableData.rows, 0, grid.match.row + 1, grid.ui);
        } else if (Number.isInteger(grid.match.col)) {
          convertRule(tableData.cols, 0, grid.match.col + 1, grid.ui);
        }

        break;
    }
  }); // 渐变背景色

  if (get(gridOptions, 'gradient')) {
    var colorMap = getGradientColorMapWithContent(model);
    tableData.cells.forEach(function (row) {
      row.forEach(function (cell) {
        colorMap[cell.content] && (cell.backgroundColor = colorMap[cell.content]);
      });
    });
  } // checkbox转换


  var checkedList = get(gridOptions, 'checkbox.checked');

  if (checkedList) {
    var checkboxUIList = get(gridTheme, 'checkbox.ui');
    var checkedStyle = convertUI(checkboxUIList[0]);
    var uncheckedStyle = convertUI(checkboxUIList[1]);
    tableData.cells.forEach(function (row, rIdx) {
      row.forEach(function (cell, cIdx) {
        if (cIdx === 0) return;
        var checked = checkedList.find(function (item) {
          return item.row === rIdx && item.col === cIdx;
        });
        Object.assign(cell, checked ? checkedStyle : uncheckedStyle);
      });
    });
  } // 特殊预设设置


  if (['table-checkbox-1', 'table-checkbox-2'].includes(gridTheme.name)) {
    var rule = tableData.rows.find(function (rule) {
      return rule.coefficient === 1 && rule.remainder === 0;
    });

    if (rule) {
      rule.borders = [{
        color: '#ffffff00',
        width: 10,
        style: 'solid'
      }, null, null, null];
    }
  }

  model.tableData = tableData;
  delete model.gridData;
  delete model.gridTheme;
  delete model.gridOptions;
}
/**
 * @description 将颜色统一成 rgba
 * @param {strinf} color
 */

export function toRGBA(color) {
  var colorObject = tinycolor(color); // eslint-disable-next-line

  var _colorObject$toRgb = colorObject.toRgb(),
      r = _colorObject$toRgb.r,
      g = _colorObject$toRgb.g,
      b = _colorObject$toRgb.b,
      a = _colorObject$toRgb.a;

  return [r, g, b, a];
}
/**
 * @description 根据起始与结束颜色按梯度划分生成过度颜色
 * @param {string} startColor 起始颜色
 * @param {string} endColor 结束颜色
 * @param {number} step 渐变梯度
 */

export function createGradientColors(startColor, endColor, step) {
  var _toRGBA = toRGBA(startColor),
      sr = _toRGBA[0],
      sg = _toRGBA[1],
      sb = _toRGBA[2],
      sa = _toRGBA[3];

  var _toRGBA2 = toRGBA(endColor),
      er = _toRGBA2[0],
      eg = _toRGBA2[1],
      eb = _toRGBA2[2],
      ea = _toRGBA2[3];

  var dr = (er - sr) / step;
  var dg = (eg - sg) / step;
  var db = (eb - sb) / step;
  var da = (ea - sa) / step;
  var colorList = [];

  for (var i = 0; i < step; i += 1) {
    var rgba = [Math.floor(sr + dr * i), Math.floor(sg + dg * i), Math.floor(sb + db * i), Math.floor(sa + da * i)];
    colorList.push("rgba(" + rgba.join(',') + ")");
  }

  return colorList;
}
/**
 * 由表格内容自动生成对应单元渐变色
 */

function getGradientColorMapWithContent(model) {
  var gridOptions = model.gridOptions,
      gridTheme = model.gridTheme,
      data = model.gridData;
  var colors = gridTheme.colors,
      _gridTheme$gradientCo = gridTheme.gradientColors,
      gradientColors = _gridTheme$gradientCo === void 0 ? [] : _gridTheme$gradientCo;

  var _getContentRange = getContentRange(gridOptions, data),
      start = _getContentRange.start,
      end = _getContentRange.end;

  var gridCol = data[0].length;
  var contentMap = {};
  /* eslint-disable */

  /**
   * 按从左到右从上至下的索引设置单元格内容权重
   */

  for (var row = start.row; row <= end.row; row += 1) {
    for (var col = start.col; col <= end.col; col += 1) {
      var content = data[row] ? data[row][col] : '';

      if (content) {
        var weight = col * gridCol + row;
        contentMap[content] = Math.max(contentMap[content] || 0, weight);
      }
    }
  } // 按权重排序


  var sequence = Object.entries(contentMap).sort(function (a, b) {
    return a[1] - b[1];
  }).map(function (_ref2) {
    var key = _ref2[0];
    return key;
  });
  var standardColors = gradientColors.map(function (color) {
    return colors[color] || color;
  }); // 按内容渐变

  if (sequence && sequence.length) {
    var colorList = createGradientColors(standardColors[0], standardColors[1], sequence.length);
    var colorMap = {};
    sequence.forEach(function (value, index) {
      colorMap[value] = colorList[index];
    });
    return colorMap;
  }

  return {};
} // 除去标题栏表格的内容区域


function getContentRange(gridOptions, girdData) {
  var header = gridOptions.header;
  var gridRow = girdData.length;
  var gridCol = girdData[0].length;

  var _ref3 = header || {},
      _ref3$row = _ref3.row,
      headerRows = _ref3$row === void 0 ? [] : _ref3$row,
      _ref3$col = _ref3.col,
      headerCols = _ref3$col === void 0 ? [] : _ref3$col;

  var start = {
    row: headerRows.length ? Math.max.apply(null, headerRows) + 1 : 0,
    col: headerCols.length ? Math.max.apply(null, headerCols) + 1 : 0
  };
  var end = {
    row: Math.max(gridRow - 1, 0),
    col: Math.max(gridCol - 1, 0)
  };
  return {
    start: start,
    end: end
  };
}
/**
 * 替换单元格
 * 解决vue数组替换不响应
 */


export function replaceCell(cells, rIdx, cIdx, cell) {
  cells[rIdx].splice(cIdx, 1);
  cells[rIdx].splice(cIdx, -1, cell);
}
/**
 * 创建表格DOM
 */

export function createTableDom(editor, model) {
  var Table = Vue.extend(TableComponent);
  var comp = new Table({
    propsData: {
      model: model,
      zoom: editor.zoom
    }
  });
  comp.$mount();
  return comp.$el;
}
/**
 * 获取表格最小缩放比例
 */

export function getTableMinSize(table) {
  var width = table.width,
      height = table.height,
      tableData = table.tableData;
  var _tableData$rows = tableData.rows,
      rows = _tableData$rows === void 0 ? [] : _tableData$rows,
      _tableData$cols = tableData.cols,
      cols = _tableData$cols === void 0 ? [] : _tableData$cols,
      cells = tableData.cells;
  var heights = rows.length ? rows.map(function (rule) {
    return rule.height;
  }) : [height / cells.length];
  var widths = cols.length ? cols.map(function (rule) {
    return rule.width;
  }) : [width / cells[0].length];
  return {
    width: Math.min.apply(Math, widths),
    height: Math.min.apply(Math, heights)
  };
} // 获取col元素宽度

export function getColOffsetWidth($col) {
  var width = $col.offsetWidth;
  if (!!width) return width;
  var order = $col.getAttribute('col');
  var $td = $col.parentNode.parentNode.querySelector("table>tbody>tr>td:nth-child(" + order + ")");
  return $td ? $td.offsetWidth : 0;
}