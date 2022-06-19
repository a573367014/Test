import { clone, cloneDeep, get, isUndefined } from 'lodash';

const STYLE_KEYS = [
    'color',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontWeight',
    'textDecoration',
    'textAlign',
    'backgroundColor',
    'width',
    'lineHeight',
];
const NO_UNIT_STYLE_KEYS = ['lineHeight', 'fontWeight'];

export function changeTableElement(props, model, editor) {
    Object.assign(model, props);
    editor.makeSnapshotByElement(model);
}

/**
 * 合并单元格
 */
export function mergeCells(model, range) {
    const cells = clone(model.tableData.cells);
    const { row, col, rowspan, colspan } = range;
    const currentCell = cells[row - 1][col - 1];
    Object.assign(currentCell, { rowspan, colspan });
    const contents = [];
    for (let i = row - 1; i < row + rowspan - 1; i++) {
        let content = '';
        for (let j = col - 1; j < col + colspan - 1; j++) {
            const cell = cells[i][j];
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
    const cells = clone(model.tableData.cells);
    const curCell = cells[row - 1][col - 1];
    for (let i = row; i < row + curCell.rowspan; i++) {
        for (let j = col; j < col + curCell.colspan; j++) {
            const cell = cells[i - 1][j - 1];
            if (!cell) {
                cells[i - 1][j - 1] = { content: '' };
            }
        }
    }
    curCell.rowspan = 1;
    curCell.colspan = 1;
    return cells;
}

function _shotTableNodeSize($tableWrap) {
    const trDoms = $tableWrap.querySelectorAll('table>tbody>tr');
    const colDoms = $tableWrap.querySelectorAll('table>colgroup>col');
    const rows = [];
    const cols = [];
    trDoms.forEach((tr) => rows.push(tr.offsetHeight));
    colDoms.forEach((col) => cols.push(col.offsetWidth));
    return {
        width: $tableWrap.offsetWidth,
        height: $tableWrap.offsetHeight,
        rows,
        cols,
    };
}

function _shotTableNodeSizeWithExcludeRange($tableWrap, excludeRange) {
    const { width, height, rows, cols } = _shotTableNodeSize($tableWrap);
    const exCols = [];
    const exRows = [];
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
        width: width - exCols.reduce((w, c) => cols[c - 1] + w, 0),
        height: height - exRows.reduce((h, r) => rows[r - 1] + h, 0),
        rows: rows.filter((_, i) => !exRows.includes(i + 1)),
        cols: cols.filter((_, i) => !exCols.includes(i + 1)),
    };
}

/**
 * 设置表格行列尺寸规则
 */
export function setTableSizeRule(table, { cols, rows }) {
    cols.forEach((colW, i) => {
        changeStripProp(table.cols, i + 1, { width: colW });
    });
    rows.forEach((trH, i) => {
        changeStripProp(table.rows, i + 1, { height: trH });
    });
    return table;
}

/**
 * 计算添加行列model更新数据
 */
export function calCreateStripModelProps(model, type, index, count = 1) {
    const $tableWrap = document.getElementById('table-wrap-' + model.$id);
    if (!$tableWrap) return {};
    const { width, height, cols, rows } = _shotTableNodeSize($tableWrap);
    const style =
        type === 'c'
            ? {
                  width: Math.round(width / cols.length),
              }
            : {
                  height: Math.round(height / rows.length),
              };
    type === 'c'
        ? cols.splice(index, -count, ...new Array(count).fill(style.width))
        : rows.splice(index, -count, ...new Array(count).fill(style.height));
    const table = setTableSizeRule(createStrip(model, type, index, count, style), {
        cols,
        rows,
    });
    return {
        tableData: table,
        width: width + (style.width || 0),
        height: height + (style.height || 0),
    };
}

/**
 * 计算删除行列model更新数据
 */
export function calDeleteStripModelProps(model, range) {
    const $tableWrap = document.getElementById('table-wrap-' + model.$id);
    if (!$tableWrap) return {};
    const { width, height, cols, rows } = _shotTableNodeSizeWithExcludeRange($tableWrap, range);
    const table = setTableSizeRule(deleteStrips(model, range), { cols, rows });
    return { tableData: table, width, height, $currentRange: null };
}

/**
 * 添加行列
 */
export function createStrip(model, type, index, count, style = {}) {
    const table = cloneDeep(model.tableData);
    const { cells, rows = [], cols = [] } = table;
    const rules = type === 'r' ? rows : cols;
    // 首行列边框保留
    let firstBorders;
    if (index === 0) {
        const firstRule = rules.find((rule) => rule.coefficient === 0 && rule.remainder === 1);
        firstBorders = firstRule.borders;
        delete firstRule.borders;
    }
    rules.forEach((rule) => {
        if (!rule.coefficient && rule.remainder && rule.remainder > index) {
            rule.remainder += count;
        }
    });
    for (let i = 1; i <= count; i++) {
        const rule = {
            coefficient: 0,
            remainder: index + i,
            ...style,
        };
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
}

// cells添加行数据
function _addRow2Cells(cells, index, count) {
    const newStrips = [];
    const colLen = cells[0].length;
    newStrips[0] = [];
    const expandedSpan = [];
    for (let i = 0; i < colLen; i++) {
        const nextRow = cells[index];
        const preRow = cells[index - 1];
        const inSpan =
            index !== 0 && nextRow && !nextRow[i] && (!preRow[i] || preRow[i].rowspan > 1);
        if (inSpan) {
            newStrips[0].push(null);
            const range = findSpanCellRange(cells, index, i);
            if (!expandedSpan.find((span) => span.row === range.row && span.col === range.col)) {
                cells[range.row - 1][range.col - 1].rowspan += count;
                expandedSpan.push(range);
            }
        } else {
            newStrips[0].push({ content: '' });
        }
    }
    for (let i = 0; i < count - 1; i++) {
        newStrips.push(
            new Array(colLen)
                .fill(null)
                .map((_, cIdx) => (newStrips[0][cIdx] ? { content: '' } : null)),
        );
    }
    cells.splice(index, 0, ...newStrips);
}

/**
 * 寻找合并单元格主单元格
 */
function findSpanCellRange(cells, rIdx, cIdx) {
    for (let r = 0; r <= rIdx; r++) {
        for (let c = 0; c <= cIdx; c++) {
            const cell = cells[r][c];
            if (cell && r + cell.rowspan > rIdx && c + cell.colspan > cIdx) {
                return {
                    row: r + 1,
                    col: c + 1,
                    rowspan: cell.rowspan || 1,
                    colspan: cell.colspan || 1,
                };
            }
        }
    }
}

// cells添加列数据
function _addCol2Cells(cells, index, count) {
    const cacheCells = cloneDeep(cells);
    cells.forEach((row, rIdx) => {
        let newCols = new Array(count).fill(0).map(() => ({ content: '' }));
        // 合并单元格中插入列
        if (
            index !== 0 &&
            !row[index] &&
            !(get(findSpanCellRange(cacheCells, rIdx, index), 'rowspan', 1) > 1)
        ) {
            const cell = row[index - 1];
            if (!cell || cell.colspan > 1) {
                newCols = new Array(count).fill(0).map(() => null);
                for (let i = index - 1; i >= 0; i--) {
                    if (row[i]) {
                        if (row[i].colspan && row[i].colspan > 1) {
                            row[i].colspan += count;
                        }
                        break;
                    }
                }
            }
        }
        row.splice(index, 0, ...newCols);
    });
    return cells;
}

/**
 * 删除行列
 */
export function deleteStrips(model, range) {
    const table = cloneDeep(model.tableData);
    const { cells, rows, cols } = table;
    const type = range.rowspan === cells.length ? 'c' : 'r';
    const rules = type === 'r' ? rows : cols;
    // 首行列边框保留
    let firstBorders;
    if ((type === 'r' && range.row === 1) || (type === 'c' && range.col === 1)) {
        const firstRule = rules.find((rule) => rule.coefficient === 0 && rule.remainder === 1);
        firstBorders = firstRule.borders;
    }
    if (type === 'c') {
        _updateDeleteStripRule(rules, range.col, range.colspan);
        cells.forEach((row, rIdx) => {
            // 合并单元格数据整合
            let spanCellIndex;
            let childCellLen = 0;
            for (let i = 0; i < range.colspan; i++) {
                const cell = row[range.col - 1 + i];
                if ((i === 0 && !cell) || (!cell && childCellLen)) childCellLen++;
                else childCellLen = 0;
                if (cell && cell.colspan > 1) {
                    spanCellIndex = i;
                }
            }
            if (childCellLen) {
                const spanCell = findSpanCellRange(cells, rIdx, range.col - 1);
                if (spanCell && spanCell.row === rIdx + 1) {
                    cells[spanCell.row - 1][spanCell.col - 1].colspan -= childCellLen;
                }
            }
            if (spanCellIndex >= 0) {
                const spanCell = row[range.col - 1 + spanCellIndex];
                const spanDiff = spanCell.colspan - (range.colspan - spanCellIndex);
                if (spanDiff > 0) {
                    row[range.col - 1 + range.colspan] = {
                        ...spanCell,
                        colspan: spanDiff,
                    };
                }
            }
            row.splice(range.col - 1, range.colspan);
        });
    } else {
        _updateDeleteStripRule(rules, range.row, range.rowspan);
        // 合并单元格数据整合
        for (let i = range.row - 1; i < range.row + range.rowspan - 1; i++) {
            const row = cells[i];
            for (let c = row.length - 1; c >= 0; c--) {
                const cell = row[c];
                if (!cell) {
                    const spanCell = findSpanCellRange(cells, i, c);
                    if (spanCell.row - 1 === i) continue;
                    const prevSpanCell =
                        spanCell.row - 1 < i &&
                        c > 0 &&
                        !row[c - 1] &&
                        findSpanCellRange(cells, i, c - 1);
                    if (
                        !prevSpanCell ||
                        spanCell.row !== prevSpanCell.row ||
                        spanCell.col !== prevSpanCell.col
                    ) {
                        cells[spanCell.row - 1][spanCell.col - 1].rowspan--;
                    }
                } else if (cell.rowspan > 1) {
                    cells[i + 1][c] = { ...cell, rowspan: cell.rowspan - 1 };
                }
            }
        }
        cells.splice(range.row - 1, range.rowspan);
    }
    if (firstBorders) {
        const rule = rules.find((rule) => rule.coefficient === 0 && rule.remainder === 1);
        if (rule) rule.borders = firstBorders;
    }
    model.$currentRange = null;
    return table;
}

// 更新删除行列规则
function _updateDeleteStripRule(rules, order, span) {
    const removeRules = [];

    rules.forEach((rule) => {
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
}

// 选择行列
export function selectStrips(cells, type, order, span = 1) {
    const rlen = cells.length;
    const clen = cells[0].length;
    const range =
        type === 'r'
            ? { row: order, col: 1, rowspan: span, colspan: clen }
            : { row: 1, col: order, rowspan: rlen, colspan: span };
    return range;
}

/**
 * 清除单元格内容
 */
export function clearCells(model, range) {
    const table = cloneDeep(model.tableData);
    const { cells } = table;
    for (let i = range.row; i < range.row + range.rowspan; i++) {
        for (let j = range.col; j < range.col + range.colspan; j++) {
            const cell = cells[i - 1][j - 1];
            cell && (cell.content = '');
        }
    }
    return table;
}

/**
 * 更新单元格属性
 */
export function changeCellsStyle(model, range, props = {}) {
    const table = cloneDeep(model.tableData);
    const cells = table.cells;
    if (!range) {
        range = { row: 1, col: 1, rowspan: cells.length, colspan: cells[0].length };
    }
    const selectedRow = range.colspan === cells[0].length;
    const selectedCol = range.rowspan === cells.length;
    const selectedAll = selectedRow && selectedCol;
    if (selectedAll) {
        deleteCellProps(cells, props, range);
        deleteRuleProps(table.rows, props);
        deleteRuleProps(table.cols, props);
        table.table = Object.assign(table.table, props);
    } else if (selectedRow) {
        deleteCellProps(cells, props, range);
        for (let i = range.row; i < range.row + range.rowspan; i++) {
            const rule = table.rows.find((r) => !r.coefficient && r.remainder === i);
            if (rule) Object.assign(rule, props);
            else table.rows.push({ coefficient: 0, remainder: i, ...props });
        }
    } else if (selectedCol) {
        deleteCellProps(cells, props, range);
        for (let i = range.col; i < range.col + range.colspan; i++) {
            const rule = table.cols.find((r) => !r.coefficient && r.remainder === i);
            if (rule) Object.assign(rule, props);
            else table.cols.push({ coefficient: 0, remainder: i, ...props });
        }
    } else {
        for (let i = range.row; i < range.row + range.rowspan; i++) {
            for (let j = range.col; j < range.col + range.colspan; j++) {
                const cell = table.cells[i - 1][j - 1];
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
    const list = [];
    const { table, rows, cols, cells } = model.tableData;
    const _cells = [];
    cells.forEach((row) => _cells.push(...row));
    [table, ...rows, ...cols, ..._cells].forEach((item) => {
        if (item && item.fontFamily && !list.includes(item.fontFamily)) list.push(item.fontFamily);
    });
    return list;
}

/**
 * 获取选取内容字体列表
 */
export function getRangeFontFamilies(model, range) {
    const { cells, rows, cols, table } = model.tableData;
    const families = new Set();
    for (let i = range.row; i < range.row + range.rowspan; i++) {
        for (let j = range.col; j < range.col + range.colspan; j++) {
            const cell = cells[i - 1][j - 1];
            if (cell.fontFamily) {
                families.add(cell.fontFamily);
            } else {
                const family =
                    getPropFromRules(cols, 'fontFamily', j) ||
                    getPropFromRules(rows, 'fontFamily', i) ||
                    table.fontFamily ||
                    model.fontFamily;
                family && families.add(family);
            }
        }
    }
    return [...families];
}

/**
 * 获取选取范围样式
 */
export function getRangeStyle(model, range, propNames) {
    range = range || {
        row: 1,
        col: 1,
        rowspan: model.tableData.cells.length,
        colspan: model.tableData.cells[0].length,
    };
    propNames = propNames || STYLE_KEYS;
    const rangeStyle = {};
    for (let i = range.row; i < range.row + range.rowspan; i++) {
        for (let j = range.col; j < range.col + range.colspan; j++) {
            const style = createTableCellStyle(model.tableData, i, j, false);
            for (let k = 0; k < propNames.length; k++) {
                const key = propNames[k];
                const value = style[key];
                if (rangeStyle[key] === undefined) rangeStyle[key] = [value];
                else if (!rangeStyle[key].includes(value)) rangeStyle[key].push(value);
            }
        }
    }
    for (const k in rangeStyle) {
        if (rangeStyle[k]) rangeStyle[k] = rangeStyle[k].filter((v) => !!v);
        if (rangeStyle[k].length === 1) {
            rangeStyle[k] = rangeStyle[k][0];
        }
    }
    return rangeStyle;
}

/**
 * 获取行列属性
 */
export function getPropFromRules(rules, name, order) {
    let value;
    rules.forEach((rule) => {
        if (
            (rule.coefficient && order % rule.coefficient === rule.remainder) ||
            rule.remainder === order
        ) {
            if (rule[name] === undefined) return;
            if (Array.isArray(value) && Array.isArray(rule[name]))
                value = [...value, ...rule[name]];
            else value = rule[name];
        }
    });
    return value;
}

/**
 * 合成单元格样式
 * 规则文档 https://doc.huanleguang.com/pages/viewpage.action?pageId=169960072
 */
export function createTableCellStyle(tableData, row, col, cssValue = true) {
    if (!tableData.cells[row - 1][col - 1]) return {};
    const style = {};
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
    return typeof value === 'number' ? `${value}px` : value;
}

/**
 * 反序列化样式数据
 */
export function dlzStyleData(data, cssValue = true) {
    const _data = {};
    Object.keys(data).forEach((key) => {
        if (!cssValue) {
            _data[key] = data[key];
        } else {
            if (NO_UNIT_STYLE_KEYS.includes(key)) _data[key] = data[key];
            else if (STYLE_KEYS.includes(key)) _data[key] = unit(data[key]);
        }
    });
    // 处理特色样式(border,padding等)
    Object.assign(_data, dlzBorders(data.borders, cssValue), dlzPadding(data.padding, cssValue));
    // 渐变背景
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
export function dlzBorders(borders, useUnit = true) {
    if (!borders || !borders.length) return {};
    const borderStyles = {};
    const sideNames = get4SizeNames('border');
    const dlzCssData = dlzCss4SideData(borders);
    dlzCssData.forEach((style, i) => {
        if (style && style.style) {
            Object.keys(style).forEach((key) => {
                const value = useUnit ? unit(style[key]) : style[key];
                borderStyles[`${sideNames[i]}${key[0].toUpperCase() + key.slice(1)}`] = value;
            });
        }
    });
    return borderStyles;
}

/**
 * 反序列padding数据
 */
export function dlzPadding(padding, useUnit = true) {
    if (!padding || !padding.length) return {};
    const paddingStyle = {};
    const sideNames = get4SizeNames('padding');
    dlzCss4SideData(padding).forEach((v, i) => {
        paddingStyle[sideNames[i]] = useUnit ? unit(v) : v;
    });
    return paddingStyle;
}

/**
 * css上[,右[,下[,左]]]省略语法解析
 */
export function dlzCss4SideData(data = []) {
    const res = new Array(4);
    let indexes = [0, 1, 2, 3];
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
    for (let i = 0; i < 4; i++) {
        res[i] = data[indexes[i]];
    }
    return res;
}

/**
 * 缩放属性值
 */
export function scaleProp(data, name, ratio = 1, format = (v, r) => v * r) {
    const cells = [];
    data.cells.forEach((row) => {
        cells.push(...row);
    });
    [data.table, ...data.rows, ...data.cols, ...cells].forEach((rule) => {
        if (rule && rule[name]) {
            if (Array.isArray(rule[name])) {
                rule[name] = rule[name].map((v) => (v ? format(v, ratio) : v));
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
    const cellReMap = {};
    cells.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            if (!cell) return false;
            if (cell.rowspan > 1 || cell.colspan > 1) {
                for (let r = rIdx + 1; r <= rIdx + (cell.rowspan || 1); r++) {
                    for (let c = cIdx + 1; c <= cIdx + (cell.colspan || 1); c++) {
                        const key = `${r}:${c}`;
                        cellReMap[key] = `${rIdx + 1}:${cIdx + 1}`;
                    }
                }
            }
            const key = `${rIdx + 1}:${cIdx + 1}`;
            cellReMap[key] = key;
        });
    });

    // format start&end
    const minRow = Math.min(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxRow = Math.max(start.row, end.row);
    const maxCol = Math.max(start.col, end.col);
    start = { row: minRow, col: minCol };
    end = { row: maxRow, col: maxCol };
    const startCell = cells[start.row - 1][start.col - 1];
    const endCell = cells[end.row - 1][end.col - 1];
    if (!startCell) {
        const [_row, _col] = cellReMap[`${start.row}:${start.col}`].split(':').map(Number);
        start.row = _row;
        start.col = _col;
    }
    if (!endCell) {
        const [_row, _col] = cellReMap[`${end.row}:${end.col}`].split(':').map(Number);
        end.row = _row;
        end.col = _col;
    }
    _fillRange(cells, start);
    _fillRange(cells, end);

    let left = start.col;
    let right = end.col + (end.colspan - 1 || 0);
    let top = start.row;
    let bottom = end.row + (end.rowspan - 1 || 0);
    function _findRange() {
        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                const cell = cells[r - 1][c - 1];
                if (!cell) {
                    const [_row, _col] = cellReMap[`${r}:${c}`].split(':').map(Number);
                    const cell = cells[_row - 1][_col - 1];
                    const rowspan = cell.rowspan || 1;
                    const colspan = cell.colspan || 1;
                    if (
                        _row < top ||
                        _row + rowspan - 1 > bottom ||
                        _col < left ||
                        _col + colspan - 1 > right
                    ) {
                        left = Math.min(_col, left);
                        right = Math.max(_col + colspan - 1, right);
                        top = Math.min(_row, top);
                        bottom = Math.max(_row + rowspan - 1, bottom);
                        return _findRange();
                    }
                }
            }
        }
        return {
            row: top,
            col: left,
            rowspan: bottom - top + 1,
            colspan: right - left + 1,
        };
    }
    return _findRange();
}

// 补充range
function _fillRange(cells, range) {
    const cell = cells[range.row - 1][range.col - 1];
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
function _createRuleStyle(rules = [], order, cssValue = true) {
    const style = {};
    rules.forEach((rule) => {
        if (
            isOrderRule(rule, order) ||
            isRevOrderRule(rules, rule, order) ||
            order % rule.coefficient === rule.remainder
        ) {
            _assignTableStyle(style, rule);
        }
    });
    return dlzStyleData(style, cssValue);
}

/**
 * 表格样式合并
 */
function _assignTableStyle(s1, s2) {
    let borders;
    if (s1.borders && s2.borders) {
        borders = dlzCss4SideData(s1.borders);
        const borders2 = dlzCss4SideData(s2.borders);
        borders2.forEach((v, i) => {
            v && (borders[i] = v);
        });
    }
    if (s2.backgroundColor || s2.backgroundImage) {
        delete s1.backgroundColor;
        delete s1.backgroundImage;
    }
    const res = Object.assign(s1, s2);
    borders && (res.borders = borders);
    return res;
}

/**
 * 清除单元格属性
 */
function deleteCellProps(cells, props, range) {
    // 清除单元格实现覆盖
    cells.slice(range.row - 1, range.row + range.rowspan - 1).forEach((row) => {
        row.slice(range.col - 1, range.col + range.colspan - 1).forEach((cell) => {
            if (!cell) return;
            Object.keys(props).forEach((prop) => {
                if (cell[prop] !== undefined) delete cell[prop];
            });
        });
    });
}

/**
 * 清除行列属性
 */
function deleteRuleProps(rules, props) {
    rules
        .filter((r) => !r.coefficient)
        .forEach((r) => {
            Object.keys(props).forEach((prop) => {
                if (r[prop] !== undefined) delete r[prop];
            });
        });
}

export function getGradientBackground(gradient) {
    const style = {};
    const result = [];
    result.push(90 - gradient.angle + 'deg');
    gradient.stops.forEach((item) => {
        result.push(`${item.color} ${item.offset * 100}%`);
    });
    const gradientString = result.join(',');
    style.backgroundImage = `linear-gradient(${gradientString})`;
    return style;
}

/**
 * 表格缩放
 */
export function resizeTable(model, ratio = 1) {
    scaleProp(model.tableData, 'width', ratio, (v) => Math.round(v * ratio));
    scaleProp(model.tableData, 'height', ratio, (v) => Math.round(v * ratio));
    scaleProp(model.tableData, 'fontSize', ratio, (v) => Math.round(v * ratio));
    scaleProp(model.tableData, 'padding', ratio);
    scaleProp(model.tableData, 'borders', ratio, (v, r) => {
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
export function mergeRulesProp(targetRules, rules, name = '') {
    rules.forEach((rule) => {
        if (isUndefined(rule[name])) return;
        const tRule = targetRules.find(
            (tRule) => tRule.remainder === rule.remainder && tRule.coefficient === rule.coefficient,
        );
        if (tRule) {
            tRule[name] = rule[name];
        } else {
            targetRules.push({
                coefficient: rule.coefficient,
                remainder: rule.remainder,
                [name]: rule[name],
            });
        }
    });
}

/**
 * 更新行列属性
 */
export function changeStripProp(rules, order, props) {
    if (Number.isInteger(order)) {
        const orderRule = getOrderRule(rules, order);
        if (orderRule) {
            Object.assign(orderRule, props);
        } else rules.push({ coefficient: 0, remainder: order, ...props });
        const revRule = getRevOrderRule(rules, order);
        if (revRule) Object.assign(revRule, props);
    } else if (typeof order === 'object') {
        // 斑马规则
        const rule = rules.find(
            (rule) => rule.coefficient === order.coefficient && rule.remainder === order.remainder,
        );
        if (rule) Object.assign(rule, props);
        else rules.unshift({ ...order, ...props });
    }
    return rules;
}

function isOrderRule(rule, order) {
    return !rule.coefficient && rule.remainder === order;
}
function isRevOrderRule(rules, rule, order) {
    rules = rules.filter((rule) => !rule.coefficient && rule.remainder > 0);
    return rule.remainder < 0 && rule.remainder + rules.length + 1 === order;
}
/**
 * 获取顺序单行列规则
 */
function getOrderRule(rules, order) {
    return rules.find((rule) => isOrderRule(rule, order));
}

/**
 * 获取逆序单行列规则
 */
function getRevOrderRule(rules, order) {
    return rules.find((rule) => isRevOrderRule(rules, rule, order));
}
