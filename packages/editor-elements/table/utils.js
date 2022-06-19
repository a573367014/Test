import { isEqual, pickBy } from 'lodash';
import get from 'lodash/get';
import tinycolor from 'tinycolor2';
import { CellModel } from './cell-model';
import Vue from 'vue';
import TableComponent from './table-controller/component/main.vue';

function getTableDom(model) {
    return document.body.querySelector(`#__table-controller-${model.$id}__ table`);
}

/**
 * 生成样式ID
 */
export function genStyleId(styles = {}) {
    return ((Math.max(...Object.keys(styles).filter(Boolean)) || 0) + 1).toString();
}

/**
 *  更新表格元素
 */
export function shotTableElement(model, editor, options = {}) {
    const { fixed = true, props = {} } = options;
    editor.$nextTick(() => {
        const $table = getTableDom(model);
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
        Object.assign(model, {
            ...props,
            width: $table.offsetWidth,
            height: $table.offsetHeight,
        });
        $table.style.width = '100%';
        $table.style.height = '100%';
        model.syncTableData();
        editor.makeSnapshotByElement(model);
    });
}

// 获取行doms
export function getTrDoms($table) {
    const $doms = [];
    $table.querySelectorAll('tbody>tr').forEach(($tr) => $doms.push($tr));
    return $doms;
}
// 获取列doms
export function getColDoms($table) {
    const $doms = [];
    $table.querySelectorAll('colgroup>col').forEach(($col) => $doms.push($col));
    return $doms;
}

// 补充表格尺寸规格
export function completedTableSize($table, model) {
    if (!$table || !model) return;
    const trHeights = getTrDoms($table).map(($tr) => $tr.offsetHeight);
    const colWidths = getColDoms($table).map(($col) => getColOffsetWidth($col));
    setTableSizeRule(model.tableData, { cols: colWidths, rows: trHeights });
}

/**
 * 合并单元格
 */
export function mergeCells(model, range) {
    const cells = model.$cells;
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
    const cells = model.$cells;
    const curCell = cells[row - 1][col - 1];
    for (let i = row; i < row + curCell.rowspan; i++) {
        for (let j = col; j < col + curCell.colspan; j++) {
            const cell = cells[i - 1][j - 1];
            if (!cell) {
                replaceCell(
                    cells,
                    i - 1,
                    j - 1,
                    new CellModel(
                        { content: '', styleIds: [...curCell.styleIds] },
                        { table: model, position: [i - 1, j - 1] },
                    ),
                );
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
    const cell = cells[range.row - 1][range.col - 1];
    if (!cell) return false;
    return isEqual(range, { ...range, colspan: cell.colspan, rowspan: cell.rowspan });
}

/**
 * 是否可合并单元格
 */
export function canMergeCells(cells, range) {
    if (!range || (range.colspan === 1 && range.rowspan === 1)) return false;
    const selectedRow = range.colspan === cells[0].length;
    const selectedCol = range.rowspan === cells.length;
    const selectedAll = selectedRow && selectedCol;
    if (selectedAll) return true;
    const suitRange = findSuitRange(cells, range, {
        row: range.row + range.rowspan - 1,
        col: range.col + range.colspan - 1,
    });
    return isEqual(suitRange, range);
}

/**
 * 设置表格行列尺寸规则
 */
export function setTableSizeRule(table, { cols, rows }) {
    if (!table.cols.length) {
        table.cols = cols.map((v) => ({ width: v }));
    } else {
        cols.forEach((colW, i) => {
            table.cols[i].width = colW;
        });
    }
    if (!table.rows.length) {
        table.rows = rows.map((v) => ({ height: v }));
    } else {
        rows.forEach((v, i) => {
            table.rows[i].height = v;
        });
    }
    return table;
}

/**
 * 添加行列
 */
export function createStrips(model, editor, type, options = {}) {
    const { rows = [], cols = [] } = model.tableData;
    const cells = model.$cells;
    const { baseIndex = 0, direction = 1, count = 1 } = options;
    const index = baseIndex + direction;
    const rules = type === 'r' ? rows : cols;
    const rc = cells.length;
    const cc = cells[0].length;

    const cellMap = new Map();
    cells.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const id = `${rIdx}$${cIdx}`;
            if (cell) {
                cellMap.set(id, {
                    cell,
                    top: rIdx + 1,
                    bottom: rIdx + (cell.rowspan || 1),
                    left: cIdx + 1,
                    right: cIdx + (cell.colspan || 1),
                    spaned: false,
                });
            } else {
                const range = findSpanCellRange(cells, rIdx, cIdx);
                cellMap.set(id, {
                    spanId: `${range.row - 1}$${range.col - 1}`,
                });
            }
        });
    });

    if (type === 'c') {
        for (let r = 0; r < rc; r++) {
            let item = cellMap.get(`${r}$${baseIndex}`);
            if (item.spanId) item = cellMap.get(item.spanId);
            let newCells = new Array(count).fill(null);
            if (index >= item.left && index < item.right) {
                if (!item.spaned) {
                    item.cell.colspan += count;
                    item.spaned = true;
                }
            } else {
                const styleIds = item.cell.styleIds;
                const cellOptions = { table: model, position: [r, index] };
                newCells = new Array(count)
                    .fill(null)
                    .map(() => new CellModel({ content: '', styleIds }, cellOptions));
            }
            newCells.forEach((cell) => {
                cells[r].splice(index, -1, cell);
            });
        }
    } else {
        const newCells = [];
        for (let c = 0; c < cc; c++) {
            let item = cellMap.get(`${baseIndex}$${c}`);
            if (item.spanId) item = cellMap.get(item.spanId);
            if (index >= item.top && index < item.bottom) {
                newCells.push(null);
                if (!item.spaned) {
                    item.cell.rowspan += count;
                    item.spaned = true;
                }
            } else {
                const styleIds = item.cell.styleIds;
                newCells.push(new CellModel({ content: '', styleIds }, { table: model }));
            }
        }
        let _count = count;
        while (_count--) {
            const row = newCells.map((cell, cIdx) =>
                cell ? cell.clone({ table: model, position: [index + _count, cIdx] }) : cell,
            );
            cells.splice(index, -1, row);
        }
    }

    // 斑马样式重置
    if (type === 'r') {
        cells.slice(index + count).forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                cell && cell.rerender({ table: model, position: [index + count + rIdx, cIdx] });
            });
        });
    } else {
        cells.forEach((row, rIdx) => {
            row.slice(index + count).forEach((cell, c) => {
                cell && cell.rerender({ table: model, position: [rIdx, index + c + 1] });
            });
        });
    }

    // 规则位移
    const baseRule = rules[baseIndex];
    let _count = count;
    while (_count) {
        rules.splice(index, -1, { ...baseRule });
        _count--;
    }

    editor.$events.$emit('table.createStrips', {
        element: model,
        layout: editor.currentLayout,
    });

    shotTableElement(model, editor);
}

/**
 * 寻找合并单元格主单元格
 */
export function findSpanCellRange(cells, rIdx, cIdx) {
    const curCell = cells[rIdx][cIdx];
    if (curCell)
        return {
            row: rIdx + 1,
            col: cIdx + 1,
            rowspan: curCell.rowspan || 1,
            colspan: curCell.colspan || 1,
        };
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

/**
 * 删除行列
 */
export function deleteStrips(model, editor, range) {
    const { rows, cols } = model.tableData;
    const cells = model.$cells;
    const type = range.rowspan === cells.length ? 'c' : 'r';
    const rules = type === 'r' ? rows : cols;
    let width = model.width;
    let height = model.height;
    if (type === 'c') {
        rules.splice(range.col - 1, range.colspan);
        width = rules.reduce((w, rule) => w + rule.width, 0);
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
                    const cIdx = range.col - 1 + range.colspan;
                    replaceCell(
                        cells,
                        rIdx,
                        cIdx,
                        new CellModel(
                            {
                                ...spanCell,
                                colspan: spanDiff,
                            },
                            { table: model, position: [rIdx, cIdx] },
                        ),
                    );
                }
            }
            row.splice(range.col - 1, range.colspan);
        });
    } else {
        rules.splice(range.row - 1, range.rowspan);
        height = rules.reduce((v, rule) => v + rule.height, 0);
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
                    replaceCell(
                        cells,
                        i + 1,
                        c,
                        new CellModel(
                            { ...cell, rowspan: cell.rowspan - 1 },
                            { table: model, position: [i + 1, c] },
                        ),
                    );
                }
            }
        }
        cells.splice(range.row - 1, range.rowspan);

        // 斑马样式重置
        cells.slice(range.row - 1).forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                cell && cell.rerender({ table: model, position: [range.row - 1 + rIdx, cIdx] });
            });
        });
    }

    model.$currentRange = null;
    Object.assign(model, { width, height });

    editor.$events.$emit('table.deleteStrips', {
        element: model,
        layout: editor.currentLayout,
    });
    shotTableElement(model, editor);
}

/**
 * 清除单元格内容
 */
export function clearCells(model, range) {
    const cells = model.$cells;
    for (let i = range.row; i < range.row + range.rowspan; i++) {
        for (let j = range.col; j < range.col + range.colspan; j++) {
            const cell = cells[i - 1][j - 1];
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
                if (!cell || cell.rowspan > 1 || cell.colspan > 1) {
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

export function getGradientBackground(gradient) {
    const result = [];
    result.push(90 - gradient.angle + 'deg');
    gradient.stops.forEach((item) => {
        result.push(`${item.color} ${item.offset * 100}%`);
    });
    const gradientString = result.join(',');
    return `linear-gradient(${gradientString})`;
}

/**
 * 表格缩放
 */
export function resizeTable(model, ratio = 1) {
    const { rows, cols } = model.tableData;
    rows.forEach((rule) => {
        rule.height = Math.round(rule.height * ratio);
    });
    cols.forEach((rule) => {
        rule.width = Math.round(rule.width * ratio);
    });

    resizeTableStyle(model, ratio);
}

/**
 * 原始表格数据缩放
 */
export function resizePlainTable(data, ratio = 1) {
    const { rows, cols } = data.tableData;
    rows.forEach((rule) => {
        rule.height = Math.round(rule.height * ratio);
    });
    cols.forEach((rule) => {
        rule.width = Math.round(rule.width * ratio);
    });

    Object.values(data.tableData.styles).forEach((style) => {
        style.fontSize && (style.fontSize = Math.round(style.fontSize * ratio));
        style.padding && (style.padding = style.padding.map((side) => side * ratio));
        style.borders &&
            style.borders.forEach((border) => {
                if (border && border.width) {
                    Math.max(1, Math.round(border.width * ratio));
                }
            });
    });
}

/**
 * 表格样式缩放
 */
export function resizeTableStyle(model, ratio = 1) {
    model.$styleMap.forEach((style) => {
        _scaleStyle(style, ratio);
    });

    model.$cells.forEach((row) => {
        row.forEach((cell) => {
            if (!cell) return;
            _scaleStyle(cell.$style, ratio);
        });
    });
}

function _scaleStyle(style, ratio) {
    style.fontSize && (style.fontSize = Math.round(style.fontSize * ratio));
    get4SizeNames('padding').forEach((name) => {
        if (style[name]) style[name] *= ratio;
    });
    get4SizeNames('border').forEach((name) => {
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
    const cells = model.$cells;
    const sizes = new Array(4).fill(0);
    sizes[0] =
        ((cells[0][0].$style.borderTopStyle !== 'none' && cells[0][0].$style.borderTopWidth) || 0) /
        2;
    sizes[3] =
        ((cells[0][0].$style.borderLeftStyle !== 'none' && cells[0][0].$style.borderLeftWidth) ||
            0) / 2;
    const headRow = cells[0];
    let lastHeadRowCellIndex;
    for (let i = headRow.length - 1; i >= 0; i--) {
        if (headRow[i]) {
            lastHeadRowCellIndex = i;
            break;
        }
    }
    if (cells[0] && cells[0][lastHeadRowCellIndex]) {
        sizes[1] =
            ((cells[0][lastHeadRowCellIndex].$style.borderRightStyle !== 'none' &&
                cells[0][lastHeadRowCellIndex].$style.borderRightWidth) ||
                0) / 2;
    }
    return sizes;
}

/**
 * 获取表格可视宽
 */
export function getTableViewportWidth(model) {
    const borderSizes = getTableBorderSizes(model);
    const width = getTableDom(model).offsetWidth + borderSizes[3] + borderSizes[1];
    return width;
}

/**
 * 获取表格可视宽高
 */
export function getTableViewportSize(model) {
    return {
        width: getTableViewportWidth(model),
        height: getTableDom(model).offsetHeight,
    };
}

/**
 * 添加默认表格
 */
export function createDefaultTable(rc, cc) {
    const cells = [];
    for (let r = 0; r < rc; r++) {
        const row = [];
        for (let c = 0; c < cc; c++) {
            row.push({ content: '' });
        }
        cells.push(row);
    }
    const defaultStyle = {
        fontSize: 13,
        fontFamily: 'SourceHanSansSC-Regular',
        lineHeight: 1.5,
        fontWeight: 200,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        backgroundColor: '#ffffffff',
        color: '#333333',
    };
    return {
        cells,
        styles: {
            1: {
                ...defaultStyle,
                borders: [{ style: 'solid', width: 1, color: '#b4b8bfff' }],
                padding: [4],
            },
        },
        all: { styleId: '1' },
        rules: [],
        rows: [],
        cols: [],
    };
}

/**
 * 获取纯表格数据字体
 */
export function getPlainTableDataFontFamilies(data) {
    const families = [];
    if (!data.tableData) {
        return families;
    } else if (data.tableData.styles) {
        Object.values(data.tableData.styles).forEach((style) => {
            if (style.fontFamily && families.includes(style.fontFamily))
                families.push(style.fontFamily);
        });
        return families;
    } else if (data.tableData.table) {
        const { table, rows, cols, cells } = data.tableData;
        const _cells = [];
        cells.forEach((row) => _cells.push(...row));
        [table, ...rows, ...cols, ..._cells].forEach((item) => {
            if (item && item.fontFamily && !families.includes(item.fontFamily))
                families.push(item.fontFamily);
        });
        return families;
    }
    return families;
}

/**
 * 转化过时TableData
 */
export function convertObsoleteTableData(model) {
    const { tableData } = model;
    if (!tableData.table) return true;
    const _pickColStyle = (rule) =>
        pickBy(rule, (v, k) => !['coefficient', 'remainder', 'width'].includes(k));
    const _pickRowStyle = (rule) =>
        pickBy(rule, (v, k) => !['coefficient', 'remainder', 'height'].includes(k));
    const rows = [];
    const cols = [];
    const rules = [];
    const { table, cols: srcCols, rows: srcRows, cells: srcCells } = tableData;
    let id = 1;
    const styles = { [id]: { ...table } };

    const colDivideRules = srcCols.filter((rule) => rule.coefficient);
    const colOrderRules = srcCols.filter((rule) => !rule.coefficient);
    const colOrderStyles = [];
    const colRulestyles = colDivideRules.map((rule) => [
        (++id).toString(),
        _pickColStyle(rule),
        rule.coefficient,
        rule.remainder,
    ]);
    colOrderRules.forEach((rule) => {
        if (rule.width) cols[rule.remainder - 1] = { width: rule.width };
        colOrderStyles.push([(++id).toString(), _pickColStyle(rule), rule.remainder]);
    });

    const rowDivideRules = srcRows.filter((rule) => rule.coefficient);
    const rowOrderRules = srcRows.filter((rule) => !rule.coefficient);
    const rowOrderStyles = [];
    const rowRulestyles = rowDivideRules.map((rule) => [
        (++id).toString(),
        pickBy(rule, (v, k) => {
            return !['coefficient', 'remainder', 'height'].includes(k);
        }),
        rule.coefficient,
        rule.remainder,
    ]);
    rowOrderRules.forEach((rule) => {
        if (rule.height) rows[rule.remainder - 1] = { height: rule.height };
        rowOrderStyles.push([(++id).toString(), _pickRowStyle(rule), rule.remainder]);
    });

    const cells = [];
    const cellStyles = [];
    srcCells.forEach((row, rIdx) => {
        const _row = [];
        row.forEach((cell, cIdx) => {
            if (!cell) return _row.push(null);
            const _cell = { content: cell.content, styleIds: [] };
            if (cell.rowspan) _cell.rowspan = cell.rowspan;
            if (cell.colspan) _cell.colspan = cell.colspan;
            colOrderStyles.forEach((style) => {
                if (cIdx + 1 === style[2]) {
                    _cell.styleIds.push(style[0]);
                }
            });
            rowOrderStyles.forEach((style) => {
                if (rIdx + 1 === style[2]) {
                    _cell.styleIds.push(style[0]);
                }
            });
            const cellStyle = pickBy(cell, (v, k) => {
                return !['content', 'rowspan', 'colspan'].includes(k);
            });
            if (Object.keys(cellStyle).length) {
                const style = [(++id).toString(), cellStyle];
                cellStyles.push(style);
                _cell.styleIds.push(style[0]);
            }
            _row.push(_cell);
        });
        cells.push(_row);
    });

    [
        ...colRulestyles,
        ...colOrderStyles,
        ...rowRulestyles,
        ...rowOrderStyles,
        ...cellStyles,
    ].forEach((style) => {
        styles[style[0]] = style[1];
    });

    rowRulestyles.forEach((style) => {
        rules.push({ type: 'row', styleId: style[0], coefficient: style[2], remainder: style[3] });
    });
    colRulestyles.forEach((style) => {
        rules.push({ type: 'col', styleId: style[0], coefficient: style[2], remainder: style[3] });
    });

    model.tableData = {
        cells,
        rows,
        cols,
        styles,
        rules,
        all: { styleId: '1' },
    };
}

/**
 * 旧table元素转换成新数据
 */
export function convertOldTable(model) {
    model.contents = null;
    model.content = null;
    if (!model.gridData || model.tableData) return model.tableData;
    const { gridData, gridTheme, gridOptions } = model;
    const { colors, container, grids, lines } = gridTheme;
    const tableData = {
        table: {
            fontSize: model.fontSize,
            fontFamily: model.fontFamily || 'SourceHanSansSC-Regular',
        },
        rows: [{ coefficient: 1, remainder: 0 }],
        cols: [{ coefficient: 1, remainder: 0 }],
        cells: new Array(gridData.length),
    };

    // content
    gridData.forEach((row, rIdx) => {
        tableData.cells[rIdx] = [];
        row.forEach((content, cIdx) => {
            tableData.cells[rIdx][cIdx] = { content };
        });
    });

    const convertBorder = (border) => {
        let borders = [];
        if (border.style) {
            borders = new Array(4).fill(null).map(() => ({ ...border }));
        } else {
            borders = [border.top, border.right, border.bottom, border.left];
        }
        borders.forEach((border) => {
            border && (border.color = colors[border.color] || border.color);
        });
        return borders;
    };

    const convertBackground = (background) => {
        return {
            backgroundColor: Number.isInteger(background.color)
                ? colors[background.color]
                : background.color,
        };
    };

    const convertFont = (font) => {
        const style = {};
        Object.keys(font).forEach((key) => {
            style[`font${key[0].toUpperCase() + key.slice(1)}`] = font[key];
        });
        return style;
    };

    const justifyMap = {
        start: 'left',
        end: 'right',
        center: 'center',
    };

    const convertUI = (ui = {}) => {
        const style = {};
        ui.color !== undefined && (style.color = colors[ui.color] || ui.color);
        ui.background && Object.assign(style, convertBackground(ui.background));
        ui.border && (style.borders = convertBorder(ui.border));
        ui.font && Object.assign(style, convertFont(ui.font));
        ui.justifyContent && (style.textAlign = justifyMap[ui.justifyContent]);
        ui.padding && (style.padding = ui.padding);
        return style;
    };

    // container
    // 默认居中
    tableData.table.textAlign = 'center';
    const containerStyle = convertUI(container);
    // 去除container字体数据
    delete containerStyle.fontFamily;
    Object.assign(tableData.table, containerStyle);
    // container边框转换成上下左右行(列)边框
    if (tableData.table.borders) {
        // 上右下左
        [1, gridData[0].length, gridData.length, 1].forEach((remainder, i) => {
            const borders = new Array(4);
            borders[i] = tableData.table.borders[i];
            tableData[i % 2 ? 'cols' : 'rows'].push({
                coefficient: 0,
                remainder,
                borders,
            });
        });
        delete tableData.table.borders;
    }

    // rule转换
    const convertRule = (lines = [], coefficient, remainder, ui) => {
        const line = lines.find(
            (line) => line.coefficient === coefficient && line.remainder === remainder,
        );
        if (line) {
            Object.assign(line, convertUI(ui));
        } else {
            const newRule = {
                coefficient,
                remainder,
                ...convertUI(ui),
            };
            coefficient ? lines.unshift(newRule) : lines.push(newRule);
        }
    };

    [...grids, ...lines].forEach((grid) => {
        switch (grid.type) {
            case 'common':
                Object.assign(tableData.table, convertUI(grid.ui));
                break;
            case 'repeat':
                if (grid.match.row) {
                    convertRule(
                        tableData.rows,
                        grid.match.row.coefficient,
                        grid.match.row.remainder,
                        grid.ui,
                    );
                } else if (grid.match.col) {
                    convertRule(
                        tableData.cols,
                        grid.match.col.coefficient,
                        grid.match.col.remainder,
                        grid.ui,
                    );
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
    });

    // 渐变背景色
    if (get(gridOptions, 'gradient')) {
        const colorMap = getGradientColorMapWithContent(model);
        tableData.cells.forEach((row) => {
            row.forEach((cell) => {
                colorMap[cell.content] && (cell.backgroundColor = colorMap[cell.content]);
            });
        });
    }

    // checkbox转换
    const checkedList = get(gridOptions, 'checkbox.checked');
    if (checkedList) {
        const checkboxUIList = get(gridTheme, 'checkbox.ui');
        const checkedStyle = convertUI(checkboxUIList[0]);
        const uncheckedStyle = convertUI(checkboxUIList[1]);
        tableData.cells.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cIdx === 0) return;
                const checked = checkedList.find((item) => item.row === rIdx && item.col === cIdx);
                Object.assign(cell, checked ? checkedStyle : uncheckedStyle);
            });
        });
    }

    // 特殊预设设置
    if (['table-checkbox-1', 'table-checkbox-2'].includes(gridTheme.name)) {
        const rule = tableData.rows.find((rule) => rule.coefficient === 1 && rule.remainder === 0);
        if (rule) {
            rule.borders = [
                {
                    color: '#ffffff00',
                    width: 10,
                    style: 'solid',
                },
                null,
                null,
                null,
            ];
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
    const colorObject = tinycolor(color);
    // eslint-disable-next-line
    const { r, g, b, a } = colorObject.toRgb();
    return [r, g, b, a];
}

/**
 * @description 根据起始与结束颜色按梯度划分生成过度颜色
 * @param {string} startColor 起始颜色
 * @param {string} endColor 结束颜色
 * @param {number} step 渐变梯度
 */
export function createGradientColors(startColor, endColor, step) {
    const [sr, sg, sb, sa] = toRGBA(startColor);
    const [er, eg, eb, ea] = toRGBA(endColor);
    const dr = (er - sr) / step;
    const dg = (eg - sg) / step;
    const db = (eb - sb) / step;
    const da = (ea - sa) / step;
    const colorList = [];
    for (let i = 0; i < step; i += 1) {
        const rgba = [
            Math.floor(sr + dr * i),
            Math.floor(sg + dg * i),
            Math.floor(sb + db * i),
            Math.floor(sa + da * i),
        ];
        colorList.push(`rgba(${rgba.join(',')})`);
    }
    return colorList;
}

/**
 * 由表格内容自动生成对应单元渐变色
 */
function getGradientColorMapWithContent(model) {
    const { gridOptions, gridTheme, gridData: data } = model;
    const { colors, gradientColors = [] } = gridTheme;
    const { start, end } = getContentRange(gridOptions, data);
    const gridCol = data[0].length;
    const contentMap = {};
    /* eslint-disable */
    /**
     * 按从左到右从上至下的索引设置单元格内容权重
     */
    for (let row = start.row; row <= end.row; row += 1) {
        for (let col = start.col; col <= end.col; col += 1) {
            const content = data[row] ? data[row][col] : '';
            if (content) {
                const weight = col * gridCol + row;
                contentMap[content] = Math.max(contentMap[content] || 0, weight);
            }
        }
    }
    // 按权重排序
    const sequence = Object.entries(contentMap)
        .sort((a, b) => a[1] - b[1])
        .map(([key]) => key);
    const standardColors = gradientColors.map((color) => colors[color] || color);
    // 按内容渐变
    if (sequence && sequence.length) {
        const colorList = createGradientColors(
            standardColors[0],
            standardColors[1],
            sequence.length,
        );
        const colorMap = {};
        sequence.forEach((value, index) => {
            colorMap[value] = colorList[index];
        });
        return colorMap;
    }
    return {};
}

// 除去标题栏表格的内容区域
function getContentRange(gridOptions, girdData) {
    const { header } = gridOptions;
    const gridRow = girdData.length;
    const gridCol = girdData[0].length;
    const { row: headerRows = [], col: headerCols = [] } = header || {};
    const start = {
        row: headerRows.length ? Math.max.apply(null, headerRows) + 1 : 0,
        col: headerCols.length ? Math.max.apply(null, headerCols) + 1 : 0,
    };
    const end = {
        row: Math.max(gridRow - 1, 0),
        col: Math.max(gridCol - 1, 0),
    };
    return { start, end };
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
    const Table = Vue.extend(TableComponent);
    const comp = new Table({propsData: { model, zoom: editor.zoom }});
    comp.$mount();
    return comp.$el;
}

/**
 * 获取表格最小缩放比例
 */
export function getTableMinSize(table) {
    const { width, height, tableData } = table;
    const { rows = [], cols = [], cells } = tableData;
    const heights = rows.length ? rows.map((rule) => rule.height) : [height / cells.length];
    const widths = cols.length ? cols.map((rule) => rule.width) : [width / cells[0].length];
    return {
        width: Math.min(...widths),
        height: Math.min(...heights)
    }
}

// 获取col元素宽度
export function getColOffsetWidth($col) {
    const width = $col.offsetWidth;
    if (!!width) return width;
    const order = $col.getAttribute('col');
    const $td = $col.parentNode.parentNode.querySelector(`table>tbody>tr>td:nth-child(${order})`);
    return $td ? $td.offsetWidth : 0;
}