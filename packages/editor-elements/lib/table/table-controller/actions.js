import _extends from "@babel/runtime/helpers/extends";
import _isUndefined from "lodash/isUndefined";
import _get from "lodash/get";
import _cloneDeep from "lodash/cloneDeep";
import _clone from "lodash/clone";
var STYLE_KEYS = ['color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'textDecoration', 'textAlign', 'backgroundColor', 'width', 'lineHeight'];
var NO_UNIT_STYLE_KEYS = ['lineHeight', 'fontWeight'];
export function changeTableElement(props, model, editor) {
  Object.assign(model, props);
  editor.makeSnapshotByElement(model);
}
/**
 * 合并单元格
 */

export function mergeCells(model, range) {
  var cells = _clone(model.tableData.cells);

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
      cells[i][j] = null;
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
  var cells = _clone(model.tableData.cells);

  var curCell = cells[row - 1][col - 1];

  for (var i = row; i < row + curCell.rowspan; i++) {
    for (var j = col; j < col + curCell.colspan; j++) {
      var cell = cells[i - 1][j - 1];

      if (!cell) {
        cells[i - 1][j - 1] = {
          content: ''
        };
      }
    }
  }

  curCell.rowspan = 1;
  curCell.colspan = 1;
  return cells;
}

function _shotTableNodeSize($tableWrap) {
  var trDoms = $tableWrap.querySelectorAll('table>tbody>tr');
  var colDoms = $tableWrap.querySelectorAll('table>colgroup>col');
  var rows = [];
  var cols = [];
  trDoms.forEach(function (tr) {
    return rows.push(tr.offsetHeight);
  });
  colDoms.forEach(function (col) {
    return cols.push(col.offsetWidth);
  });
  return {
    width: $tableWrap.offsetWidth,
    height: $tableWrap.offsetHeight,
    rows: rows,
    cols: cols
  };
}

function _shotTableNodeSizeWithExcludeRange($tableWrap, excludeRange) {
  var _shotTableNodeSize2 = _shotTableNodeSize($tableWrap),
      width = _shotTableNodeSize2.width,
      height = _shotTableNodeSize2.height,
      rows = _shotTableNodeSize2.rows,
      cols = _shotTableNodeSize2.cols;

  var exCols = [];
  var exRows = [];

  if (excludeRange.rowspan === rows.length) {
    while (exCols.length < excludeRange.colspan) {
      exCols.push(excludeRange.col + exCols.length);
    }
  } else {
    while (exRows.length < excludeRange.rowspan) {
      exRows.push(excludeRange.row + exRows.length);
    }
  }

  return {
    width: width - exCols.reduce(function (w, c) {
      return cols[c - 1] + w;
    }, 0),
    height: height - exRows.reduce(function (h, r) {
      return rows[r - 1] + h;
    }, 0),
    rows: rows.filter(function (_, i) {
      return !exRows.includes(i + 1);
    }),
    cols: cols.filter(function (_, i) {
      return !exCols.includes(i + 1);
    })
  };
}
/**
 * 设置表格行列尺寸规则
 */


export function setTableSizeRule(table, _ref) {
  var cols = _ref.cols,
      rows = _ref.rows;
  cols.forEach(function (colW, i) {
    changeStripProp(table.cols, i + 1, {
      width: colW
    });
  });
  rows.forEach(function (trH, i) {
    changeStripProp(table.rows, i + 1, {
      height: trH
    });
  });
  return table;
}
/**
 * 计算添加行列model更新数据
 */

export function calCreateStripModelProps(model, type, index, count) {
  if (count === void 0) {
    count = 1;
  }

  var $tableWrap = document.getElementById('table-wrap-' + model.$id);
  if (!$tableWrap) return {};

  var _shotTableNodeSize3 = _shotTableNodeSize($tableWrap),
      width = _shotTableNodeSize3.width,
      height = _shotTableNodeSize3.height,
      cols = _shotTableNodeSize3.cols,
      rows = _shotTableNodeSize3.rows;

  var style = type === 'c' ? {
    width: Math.round(width / cols.length)
  } : {
    height: Math.round(height / rows.length)
  };
  type === 'c' ? cols.splice.apply(cols, [index, -count].concat(new Array(count).fill(style.width))) : rows.splice.apply(rows, [index, -count].concat(new Array(count).fill(style.height)));
  var table = setTableSizeRule(createStrip(model, type, index, count, style), {
    cols: cols,
    rows: rows
  });
  return {
    tableData: table,
    width: width + (style.width || 0),
    height: height + (style.height || 0)
  };
}
/**
 * 计算删除行列model更新数据
 */

export function calDeleteStripModelProps(model, range) {
  var $tableWrap = document.getElementById('table-wrap-' + model.$id);
  if (!$tableWrap) return {};

  var _shotTableNodeSizeWit = _shotTableNodeSizeWithExcludeRange($tableWrap, range),
      width = _shotTableNodeSizeWit.width,
      height = _shotTableNodeSizeWit.height,
      cols = _shotTableNodeSizeWit.cols,
      rows = _shotTableNodeSizeWit.rows;

  var table = setTableSizeRule(deleteStrips(model, range), {
    cols: cols,
    rows: rows
  });
  return {
    tableData: table,
    width: width,
    height: height,
    $currentRange: null
  };
}
/**
 * 添加行列
 */

export function createStrip(model, type, index, count, style) {
  if (style === void 0) {
    style = {};
  }

  var table = _cloneDeep(model.tableData);

  var cells = table.cells,
      _table$rows = table.rows,
      rows = _table$rows === void 0 ? [] : _table$rows,
      _table$cols = table.cols,
      cols = _table$cols === void 0 ? [] : _table$cols;
  var rules = type === 'r' ? rows : cols; // 首行列边框保留

  var firstBorders;

  if (index === 0) {
    var firstRule = rules.find(function (rule) {
      return rule.coefficient === 0 && rule.remainder === 1;
    });
    firstBorders = firstRule.borders;
    delete firstRule.borders;
  }

  rules.forEach(function (rule) {
    if (!rule.coefficient && rule.remainder && rule.remainder > index) {
      rule.remainder += count;
    }
  });

  for (var i = 1; i <= count; i++) {
    var rule = _extends({
      coefficient: 0,
      remainder: index + i
    }, style);

    if (i === 1) rule.borders = firstBorders;
    !rule.borders && delete rule.borders;
    rules.push(rule);
  }

  if (type === 'r') {
    _addRow2Cells(cells, index, count);
  } else {
    _addCol2Cells(cells, index, count);
  }

  return table;
} // cells添加行数据

function _addRow2Cells(cells, index, count) {
  var newStrips = [];
  var colLen = cells[0].length;
  newStrips[0] = [];
  var expandedSpan = [];

  for (var i = 0; i < colLen; i++) {
    var nextRow = cells[index];
    var preRow = cells[index - 1];
    var inSpan = index !== 0 && nextRow && !nextRow[i] && (!preRow[i] || preRow[i].rowspan > 1);

    if (inSpan) {
      (function () {
        newStrips[0].push(null);
        var range = findSpanCellRange(cells, index, i);

        if (!expandedSpan.find(function (span) {
          return span.row === range.row && span.col === range.col;
        })) {
          cells[range.row - 1][range.col - 1].rowspan += count;
          expandedSpan.push(range);
        }
      })();
    } else {
      newStrips[0].push({
        content: ''
      });
    }
  }

  for (var _i = 0; _i < count - 1; _i++) {
    newStrips.push(new Array(colLen).fill(null).map(function (_, cIdx) {
      return newStrips[0][cIdx] ? {
        content: ''
      } : null;
    }));
  }

  cells.splice.apply(cells, [index, 0].concat(newStrips));
}
/**
 * 寻找合并单元格主单元格
 */


function findSpanCellRange(cells, rIdx, cIdx) {
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
} // cells添加列数据


function _addCol2Cells(cells, index, count) {
  var cacheCells = _cloneDeep(cells);

  cells.forEach(function (row, rIdx) {
    var newCols = new Array(count).fill(0).map(function () {
      return {
        content: ''
      };
    }); // 合并单元格中插入列

    if (index !== 0 && !row[index] && !(_get(findSpanCellRange(cacheCells, rIdx, index), 'rowspan', 1) > 1)) {
      var cell = row[index - 1];

      if (!cell || cell.colspan > 1) {
        newCols = new Array(count).fill(0).map(function () {
          return null;
        });

        for (var i = index - 1; i >= 0; i--) {
          if (row[i]) {
            if (row[i].colspan && row[i].colspan > 1) {
              row[i].colspan += count;
            }

            break;
          }
        }
      }
    }

    row.splice.apply(row, [index, 0].concat(newCols));
  });
  return cells;
}
/**
 * 删除行列
 */


export function deleteStrips(model, range) {
  var table = _cloneDeep(model.tableData);

  var cells = table.cells,
      rows = table.rows,
      cols = table.cols;
  var type = range.rowspan === cells.length ? 'c' : 'r';
  var rules = type === 'r' ? rows : cols; // 首行列边框保留

  var firstBorders;

  if (type === 'r' && range.row === 1 || type === 'c' && range.col === 1) {
    var firstRule = rules.find(function (rule) {
      return rule.coefficient === 0 && rule.remainder === 1;
    });
    firstBorders = firstRule.borders;
  }

  if (type === 'c') {
    _updateDeleteStripRule(rules, range.col, range.colspan);

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
          row[range.col - 1 + range.colspan] = _extends({}, _spanCell, {
            colspan: spanDiff
          });
        }
      }

      row.splice(range.col - 1, range.colspan);
    });
  } else {
    _updateDeleteStripRule(rules, range.row, range.rowspan); // 合并单元格数据整合


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
          cells[i + 1][c] = _extends({}, cell, {
            rowspan: cell.rowspan - 1
          });
        }
      }
    }

    cells.splice(range.row - 1, range.rowspan);
  }

  if (firstBorders) {
    var rule = rules.find(function (rule) {
      return rule.coefficient === 0 && rule.remainder === 1;
    });
    if (rule) rule.borders = firstBorders;
  }

  model.$currentRange = null;
  return table;
} // 更新删除行列规则

function _updateDeleteStripRule(rules, order, span) {
  var removeRules = [];
  rules.forEach(function (rule) {
    if (rule.remainder >= order && rule.remainder < order + span) {
      removeRules.push(rule);
    }

    if (!rule.coefficient && rule.remainder >= order + span) {
      rule.remainder -= span;
    }
  });

  while (removeRules.length) {
    rules.splice(rules.indexOf(removeRules.pop()), 1);
  }

  return rules;
} // 选择行列


export function selectStrips(cells, type, order, span) {
  if (span === void 0) {
    span = 1;
  }

  var rlen = cells.length;
  var clen = cells[0].length;
  var range = type === 'r' ? {
    row: order,
    col: 1,
    rowspan: span,
    colspan: clen
  } : {
    row: 1,
    col: order,
    rowspan: rlen,
    colspan: span
  };
  return range;
}
/**
 * 清除单元格内容
 */

export function clearCells(model, range) {
  var table = _cloneDeep(model.tableData);

  var cells = table.cells;

  for (var i = range.row; i < range.row + range.rowspan; i++) {
    for (var j = range.col; j < range.col + range.colspan; j++) {
      var cell = cells[i - 1][j - 1];
      cell && (cell.content = '');
    }
  }

  return table;
}
/**
 * 更新单元格属性
 */

export function changeCellsStyle(model, range, props) {
  if (props === void 0) {
    props = {};
  }

  var table = _cloneDeep(model.tableData);

  var cells = table.cells;

  if (!range) {
    range = {
      row: 1,
      col: 1,
      rowspan: cells.length,
      colspan: cells[0].length
    };
  }

  var selectedRow = range.colspan === cells[0].length;
  var selectedCol = range.rowspan === cells.length;
  var selectedAll = selectedRow && selectedCol;

  if (selectedAll) {
    deleteCellProps(cells, props, range);
    deleteRuleProps(table.rows, props);
    deleteRuleProps(table.cols, props);
    table.table = Object.assign(table.table, props);
  } else if (selectedRow) {
    deleteCellProps(cells, props, range);

    var _loop = function _loop(i) {
      var rule = table.rows.find(function (r) {
        return !r.coefficient && r.remainder === i;
      });
      if (rule) Object.assign(rule, props);else table.rows.push(_extends({
        coefficient: 0,
        remainder: i
      }, props));
    };

    for (var i = range.row; i < range.row + range.rowspan; i++) {
      _loop(i);
    }
  } else if (selectedCol) {
    deleteCellProps(cells, props, range);

    var _loop2 = function _loop2(_i2) {
      var rule = table.cols.find(function (r) {
        return !r.coefficient && r.remainder === _i2;
      });
      if (rule) Object.assign(rule, props);else table.cols.push(_extends({
        coefficient: 0,
        remainder: _i2
      }, props));
    };

    for (var _i2 = range.col; _i2 < range.col + range.colspan; _i2++) {
      _loop2(_i2);
    }
  } else {
    for (var _i3 = range.row; _i3 < range.row + range.rowspan; _i3++) {
      for (var j = range.col; j < range.col + range.colspan; j++) {
        var cell = table.cells[_i3 - 1][j - 1];
        cell && Object.assign(cell, props);
      }
    }
  }

  return table;
}
/**
 * 获取表格字体集合
 */

export function getTableFontFamilies(model) {
  var list = [];
  var _model$tableData = model.tableData,
      table = _model$tableData.table,
      rows = _model$tableData.rows,
      cols = _model$tableData.cols,
      cells = _model$tableData.cells;
  var _cells = [];
  cells.forEach(function (row) {
    return _cells.push.apply(_cells, row);
  });
  [table].concat(rows, cols, _cells).forEach(function (item) {
    if (item && item.fontFamily && !list.includes(item.fontFamily)) list.push(item.fontFamily);
  });
  return list;
}
/**
 * 获取选取内容字体列表
 */

export function getRangeFontFamilies(model, range) {
  var _model$tableData2 = model.tableData,
      cells = _model$tableData2.cells,
      rows = _model$tableData2.rows,
      cols = _model$tableData2.cols,
      table = _model$tableData2.table;
  var families = new Set();

  for (var i = range.row; i < range.row + range.rowspan; i++) {
    for (var j = range.col; j < range.col + range.colspan; j++) {
      var cell = cells[i - 1][j - 1];

      if (cell.fontFamily) {
        families.add(cell.fontFamily);
      } else {
        var family = getPropFromRules(cols, 'fontFamily', j) || getPropFromRules(rows, 'fontFamily', i) || table.fontFamily || model.fontFamily;
        family && families.add(family);
      }
    }
  }

  return [].concat(families);
}
/**
 * 获取选取范围样式
 */

export function getRangeStyle(model, range, propNames) {
  range = range || {
    row: 1,
    col: 1,
    rowspan: model.tableData.cells.length,
    colspan: model.tableData.cells[0].length
  };
  propNames = propNames || STYLE_KEYS;
  var rangeStyle = {};

  for (var i = range.row; i < range.row + range.rowspan; i++) {
    for (var j = range.col; j < range.col + range.colspan; j++) {
      var style = createTableCellStyle(model.tableData, i, j, false);

      for (var k = 0; k < propNames.length; k++) {
        var key = propNames[k];
        var value = style[key];
        if (rangeStyle[key] === undefined) rangeStyle[key] = [value];else if (!rangeStyle[key].includes(value)) rangeStyle[key].push(value);
      }
    }
  }

  for (var _k in rangeStyle) {
    if (rangeStyle[_k]) rangeStyle[_k] = rangeStyle[_k].filter(function (v) {
      return !!v;
    });

    if (rangeStyle[_k].length === 1) {
      rangeStyle[_k] = rangeStyle[_k][0];
    }
  }

  return rangeStyle;
}
/**
 * 获取行列属性
 */

export function getPropFromRules(rules, name, order) {
  var value;
  rules.forEach(function (rule) {
    if (rule.coefficient && order % rule.coefficient === rule.remainder || rule.remainder === order) {
      if (rule[name] === undefined) return;
      if (Array.isArray(value) && Array.isArray(rule[name])) value = [].concat(value, rule[name]);else value = rule[name];
    }
  });
  return value;
}
/**
 * 合成单元格样式
 * 规则文档 https://doc.huanleguang.com/pages/viewpage.action?pageId=169960072
 */

export function createTableCellStyle(tableData, row, col, cssValue) {
  if (cssValue === void 0) {
    cssValue = true;
  }

  if (!tableData.cells[row - 1][col - 1]) return {};
  var style = {};

  _assignTableStyle(style, dlzStyleData(tableData.table, cssValue));

  _assignTableStyle(style, _createRuleStyle(tableData.cols, col, cssValue));

  _assignTableStyle(style, _createRuleStyle(tableData.rows, row, cssValue));

  _assignTableStyle(style, dlzStyleData(tableData.cells[row - 1][col - 1], cssValue));

  return style;
}
/**
 * @description 10 -> '10px' or '10%' -> '10%'
 * @param {string | number} value
 */

export function unit(value) {
  return typeof value === 'number' ? value + "px" : value;
}
/**
 * 反序列化样式数据
 */

export function dlzStyleData(data, cssValue) {
  if (cssValue === void 0) {
    cssValue = true;
  }

  var _data = {};
  Object.keys(data).forEach(function (key) {
    if (!cssValue) {
      _data[key] = data[key];
    } else {
      if (NO_UNIT_STYLE_KEYS.includes(key)) _data[key] = data[key];else if (STYLE_KEYS.includes(key)) _data[key] = unit(data[key]);
    }
  }); // 处理特色样式(border,padding等)

  Object.assign(_data, dlzBorders(data.borders, cssValue), dlzPadding(data.padding, cssValue)); // 渐变背景

  if (cssValue) {
    if (_data.backgroundColor && typeof _data.backgroundColor === 'object') {
      Object.assign(_data, getGradientBackground(_data.backgroundColor));
      delete _data.backgroundColor;
    }
  }

  return _data;
}
/**
 * 反序列borders数据
 */

export function dlzBorders(borders, useUnit) {
  if (useUnit === void 0) {
    useUnit = true;
  }

  if (!borders || !borders.length) return {};
  var borderStyles = {};
  var sideNames = get4SizeNames('border');
  var dlzCssData = dlzCss4SideData(borders);
  dlzCssData.forEach(function (style, i) {
    if (style && style.style) {
      Object.keys(style).forEach(function (key) {
        var value = useUnit ? unit(style[key]) : style[key];
        borderStyles["" + sideNames[i] + (key[0].toUpperCase() + key.slice(1))] = value;
      });
    }
  });
  return borderStyles;
}
/**
 * 反序列padding数据
 */

export function dlzPadding(padding, useUnit) {
  if (useUnit === void 0) {
    useUnit = true;
  }

  if (!padding || !padding.length) return {};
  var paddingStyle = {};
  var sideNames = get4SizeNames('padding');
  dlzCss4SideData(padding).forEach(function (v, i) {
    paddingStyle[sideNames[i]] = useUnit ? unit(v) : v;
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
 * 缩放属性值
 */

export function scaleProp(data, name, ratio, format) {
  if (ratio === void 0) {
    ratio = 1;
  }

  if (format === void 0) {
    format = function format(v, r) {
      return v * r;
    };
  }

  var cells = [];
  data.cells.forEach(function (row) {
    cells.push.apply(cells, row);
  });
  [data.table].concat(data.rows, data.cols, cells).forEach(function (rule) {
    if (rule && rule[name]) {
      if (Array.isArray(rule[name])) {
        rule[name] = rule[name].map(function (v) {
          return v ? format(v, ratio) : v;
        });
      } else rule[name] = format(rule[name], ratio);
    }
  });
  return data;
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

        if (!cell) {
          var _cellReMap$$split$map3 = cellReMap[r + ":" + c].split(':').map(Number),
              _row3 = _cellReMap$$split$map3[0],
              _col3 = _cellReMap$$split$map3[1];

          var _cell = cells[_row3 - 1][_col3 - 1];
          var rowspan = _cell.rowspan || 1;
          var colspan = _cell.colspan || 1;

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
/**
 * 合并行(列)规则样式
 */


function _createRuleStyle(rules, order, cssValue) {
  if (rules === void 0) {
    rules = [];
  }

  if (cssValue === void 0) {
    cssValue = true;
  }

  var style = {};
  rules.forEach(function (rule) {
    if (isOrderRule(rule, order) || isRevOrderRule(rules, rule, order) || order % rule.coefficient === rule.remainder) {
      _assignTableStyle(style, rule);
    }
  });
  return dlzStyleData(style, cssValue);
}
/**
 * 表格样式合并
 */


function _assignTableStyle(s1, s2) {
  var borders;

  if (s1.borders && s2.borders) {
    borders = dlzCss4SideData(s1.borders);
    var borders2 = dlzCss4SideData(s2.borders);
    borders2.forEach(function (v, i) {
      v && (borders[i] = v);
    });
  }

  if (s2.backgroundColor || s2.backgroundImage) {
    delete s1.backgroundColor;
    delete s1.backgroundImage;
  }

  var res = Object.assign(s1, s2);
  borders && (res.borders = borders);
  return res;
}
/**
 * 清除单元格属性
 */


function deleteCellProps(cells, props, range) {
  // 清除单元格实现覆盖
  cells.slice(range.row - 1, range.row + range.rowspan - 1).forEach(function (row) {
    row.slice(range.col - 1, range.col + range.colspan - 1).forEach(function (cell) {
      if (!cell) return;
      Object.keys(props).forEach(function (prop) {
        if (cell[prop] !== undefined) delete cell[prop];
      });
    });
  });
}
/**
 * 清除行列属性
 */


function deleteRuleProps(rules, props) {
  rules.filter(function (r) {
    return !r.coefficient;
  }).forEach(function (r) {
    Object.keys(props).forEach(function (prop) {
      if (r[prop] !== undefined) delete r[prop];
    });
  });
}

export function getGradientBackground(gradient) {
  var style = {};
  var result = [];
  result.push(90 - gradient.angle + 'deg');
  gradient.stops.forEach(function (item) {
    result.push(item.color + " " + item.offset * 100 + "%");
  });
  var gradientString = result.join(',');
  style.backgroundImage = "linear-gradient(" + gradientString + ")";
  return style;
}
/**
 * 表格缩放
 */

export function resizeTable(model, ratio) {
  if (ratio === void 0) {
    ratio = 1;
  }

  scaleProp(model.tableData, 'width', ratio, function (v) {
    return Math.round(v * ratio);
  });
  scaleProp(model.tableData, 'height', ratio, function (v) {
    return Math.round(v * ratio);
  });
  scaleProp(model.tableData, 'fontSize', ratio, function (v) {
    return Math.round(v * ratio);
  });
  scaleProp(model.tableData, 'padding', ratio);
  scaleProp(model.tableData, 'borders', ratio, function (v, r) {
    v.width = Math.round(v.width * r);
    if (v.width < 1) v.width = 1;
    return v;
  });
}
/**
 * 获取四边属性名称
 */

export function get4SizeNames(name) {
  return [name + 'Top', name + 'Right', name + 'Bottom', name + 'Left'];
}
/**
 * 合并规则属性
 */

export function mergeRulesProp(targetRules, rules, name) {
  if (name === void 0) {
    name = '';
  }

  rules.forEach(function (rule) {
    if (_isUndefined(rule[name])) return;
    var tRule = targetRules.find(function (tRule) {
      return tRule.remainder === rule.remainder && tRule.coefficient === rule.coefficient;
    });

    if (tRule) {
      tRule[name] = rule[name];
    } else {
      var _targetRules$push;

      targetRules.push((_targetRules$push = {
        coefficient: rule.coefficient,
        remainder: rule.remainder
      }, _targetRules$push[name] = rule[name], _targetRules$push));
    }
  });
}
/**
 * 更新行列属性
 */

export function changeStripProp(rules, order, props) {
  if (Number.isInteger(order)) {
    var orderRule = getOrderRule(rules, order);

    if (orderRule) {
      Object.assign(orderRule, props);
    } else rules.push(_extends({
      coefficient: 0,
      remainder: order
    }, props));

    var revRule = getRevOrderRule(rules, order);
    if (revRule) Object.assign(revRule, props);
  } else if (typeof order === 'object') {
    // 斑马规则
    var rule = rules.find(function (rule) {
      return rule.coefficient === order.coefficient && rule.remainder === order.remainder;
    });
    if (rule) Object.assign(rule, props);else rules.unshift(_extends({}, order, props));
  }

  return rules;
}

function isOrderRule(rule, order) {
  return !rule.coefficient && rule.remainder === order;
}

function isRevOrderRule(rules, rule, order) {
  rules = rules.filter(function (rule) {
    return !rule.coefficient && rule.remainder > 0;
  });
  return rule.remainder < 0 && rule.remainder + rules.length + 1 === order;
}
/**
 * 获取顺序单行列规则
 */


function getOrderRule(rules, order) {
  return rules.find(function (rule) {
    return isOrderRule(rule, order);
  });
}
/**
 * 获取逆序单行列规则
 */


function getRevOrderRule(rules, order) {
  return rules.find(function (rule) {
    return isRevOrderRule(rules, rule, order);
  });
}