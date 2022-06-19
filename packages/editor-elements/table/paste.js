import { splitCell, mergeCells, replaceCell, findSpanCellRange, createStrips } from './utils';
import isEqual from 'lodash/isEqual';
import { CellModel } from './cell-model';
import { rControl } from '@gaoding/editor-framework/src/utils/rich-text/utils/paste';

let cacheOuterPasteTableInfo;

/**
 * 整合表格剪贴板
 */
export function conformTableClipboard(pasteTableInfo, editor) {
    // 外部内容与画布内容替换逻辑
    if (pasteTableInfo && !isEqual(cacheOuterPasteTableInfo, pasteTableInfo)) {
        cacheOuterPasteTableInfo = pasteTableInfo;
        editor.clipboard = cacheOuterPasteTableInfo;
    }
}

/**
 * 获取当前表格剪贴板
 */
export function getOuterTableClipboard() {
    return cacheOuterPasteTableInfo;
}

/**
 * 解析外部表格内容
 */
export function parseTableHtml(html) {
    const match = html.match(/<table[\s\S]+<\/table>/);
    if (!match) return null;
    const tableStr = match[0];
    const $template = document.createElement('template');
    $template.innerHTML = tableStr;
    const $table = $template.content.firstChild;
    const trList = $table.querySelectorAll('table>tbody>tr');
    if (!trList.length) return null;
    const cells = new Array(trList.length).fill(null).map(() => []);
    trList.forEach(($tr, rIdx) => {
        $tr.querySelectorAll('tr>td').forEach(($td, cIdx) => {
            const colspan = Number($td.getAttribute('colspan')) || 1;
            const rowspan = Number($td.getAttribute('rowspan')) || 1;
            while (cells[rIdx][cIdx] !== undefined) {
                cIdx++;
            }
            const content = $td.textContent.trimStart().replace(rControl, '');
            cells[rIdx][cIdx] = { content, colspan, rowspan };
            if (rowspan > 1 || colspan > 1) {
                for (let r = rIdx; r < rIdx + rowspan; r++) {
                    for (let c = cIdx; c < cIdx + colspan; c++) {
                        if (r !== rIdx || c !== cIdx) cells[r][c] = null;
                    }
                }
            }
        });
    });
    return { cells };
}

/**
 * 填充单元格
 * 规则借鉴keynote：
 * 1. 复制内容为单个单元格，则只拷贝内容和样式.
 * 2. 如果目标是合并单元格，则充满(不扩充行列)。
 * 3. 如果目标范围存在合并单元格，则按此合并单元格剩余最大合并数，进行分割。
 */
export function padCells(editor, model, srcCells, range) {
    const targetCells = model.$cells;
    const targetCell = targetCells[range.row - 1][range.col - 1];
    const srcRange = {
        row: range.row,
        col: range.col,
        rowspan: srcCells.length,
        colspan: srcCells[0].length,
    };

    // 多选择先合并单元格
    const isMultRange =
        (range.rowspan > 1 || range.colspan > 1) &&
        (targetCell.rowspan < range.rowspan || targetCell.colspan < range.colspan);
    isMultRange && mergeCells(model, range);

    // 复制是否为单个单元格
    const firstSrcCell = srcCells[0][0];
    const isSingleSrcCell =
        (firstSrcCell.rowspan || 1) === srcRange.rowspan &&
        (firstSrcCell.colspan || 1) === srcRange.colspan;

    // 扩展行列
    const curCell = targetCells[range.row - 1][range.col - 1];
    if (curCell.colspan < 2 && curCell.rowspan < 2 && !isSingleSrcCell) {
        const overRowCount = srcCells.length + range.row - targetCells.length - 1;
        const overColCount = srcCells[0].length + range.col - targetCells[0].length - 1;
        if (overRowCount > 0) {
            createStrips(model, editor, 'r', {
                baseIndex: targetCells.length - 1,
                count: overRowCount,
            });
        }
        if (overColCount > 0) {
            createStrips(model, editor, 'c', {
                baseIndex: targetCells[0].length - 1,
                count: overColCount,
            });
        }
    }

    // 如果复制内容为单个单元格，则只拷贝内容和样式
    if (isSingleSrcCell && !isMultRange) {
        targetCell.content = firstSrcCell.content;
        targetCell.styleIds = [...firstSrcCell.styleIds];
        targetCell.rerender({ table: model, position: [range.row - 1, range.col - 1] });
        return;
    }

    // 如果目标是合并单元格，则充满(不扩充行列)
    if (targetCell.rowspan > 1 || targetCell.colspan > 1) {
        const rowspan = targetCell.rowspan;
        const colspan = targetCell.colspan;
        splitCell(model, range.row, range.col);
        for (let r = 0; r < rowspan; r++) {
            for (let c = 0; c < colspan; c++) {
                const row = range.row + r;
                const col = range.col + c;
                const curTargetCell = targetCells[row - 1][col - 1];
                const curSrcCell = srcCells[r % srcRange.rowspan][c % srcRange.colspan];
                if (curSrcCell) {
                    // 合并单元格完全处于选区内，则此格为合并单元格
                    if (r + curSrcCell.rowspan <= rowspan && c + curSrcCell.colspan <= colspan) {
                        mergeCells(model, {
                            row,
                            col,
                            rowspan: curSrcCell.rowspan,
                            colspan: curSrcCell.colspan,
                        });
                    }

                    curTargetCell.content = curSrcCell.content;
                    curTargetCell.styleIds = curSrcCell.styleIds ? [...curSrcCell.styleIds] : [];
                    curTargetCell.rerender({ table: model, position: [row - 1, col - 1] });
                }
            }
        }
    } else {
        const needSplitSpanCellMap = {};
        for (let r = 0; r < srcRange.rowspan; r++) {
            for (let c = 0; c < srcRange.colspan; c++) {
                const row = srcRange.row + r;
                const col = srcRange.col + c;
                const cell = targetCells[row - 1][col - 1];
                if (!cell) {
                    const spanRange = findSpanCellRange(
                        targetCells,
                        srcRange.row + r - 1,
                        srcRange.col + c - 1,
                    );
                    if (
                        spanRange.row < srcRange.row ||
                        spanRange.col < srcRange.col ||
                        spanRange.row + spanRange.rowspan > srcRange.row + srcRange.rowspan ||
                        spanRange.col + spanRange.colspan > srcRange.col + srcRange.colspan
                    ) {
                        const id = `$${spanRange.row}$${spanRange.col}`;
                        if (id && !needSplitSpanCellMap[id]) needSplitSpanCellMap[id] = spanRange;
                    }
                } else if (
                    (cell.rowspan > 1 && r + cell.rowspan > srcRange.rowspan) ||
                    (cell.colspan > 1 && c + cell.colspan > srcRange.colspan)
                ) {
                    const id = `$${row}$${col}`;
                    if (id && !needSplitSpanCellMap[id])
                        needSplitSpanCellMap[id] = {
                            row,
                            col,
                            rowspan: cell.rowspan,
                            colspan: cell.colspan,
                        };
                }
            }
        }
        Object.values(needSplitSpanCellMap).forEach((spanRange) => {
            const content = targetCells[spanRange.row - 1][spanRange.col - 1].content;
            targetCells[spanRange.row - 1][spanRange.col - 1].content = '';
            splitCell(model, spanRange.row, spanRange.col);
            const leaveRange = _findMostLeaveRange(spanRange, srcRange);
            mergeCells(model, leaveRange);
            // 保留之前内容
            targetCells[leaveRange.row - 1][leaveRange.col - 1].content = content;
        });

        srcCells.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                const r = range.row + rIdx - 1;
                const c = range.col + cIdx - 1;
                const newCell = cell
                    ? new CellModel(cell, {
                          table: model,
                          position: [r, c],
                      })
                    : null;
                replaceCell(model.$cells, r, c, newCell);
            });
        });
    }
}

/**
 * 寻找最大剩余合并单元格
 */
function _findMostLeaveRange(spanCell, range) {
    let cols = [];
    let rows = [];
    if (spanCell.col < range.col && range.col < spanCell.col + spanCell.colspan) {
        cols = [range.col, spanCell.col + spanCell.colspan - 1];
    } else if (spanCell.col >= range.col && spanCell.col < range.col + range.colspan) {
        cols = [spanCell.col, range.col + range.colspan - 1];
    }
    if (spanCell.row < range.row && range.row < spanCell.row + spanCell.rowspan) {
        rows = [range.row, spanCell.row + spanCell.rowspan - 1];
    } else if (spanCell.row >= range.row && spanCell.row < range.row + range.rowspan) {
        rows = [spanCell.row, range.row + range.rowspan - 1];
    }
    // 剩余合并方向
    const direction =
        (cols[1] - cols[0] + 1) * spanCell.rowspan >= (rows[1] - rows[0] + 1) * spanCell.colspan
            ? 0
            : 1;

    return {
        row: direction || rows[0] !== spanCell.row ? spanCell.row : rows[1] + 1,
        col: !direction || cols[0] !== spanCell.col ? spanCell.col : cols[1] + 1,
        rowspan: direction ? spanCell.rowspan : spanCell.rowspan - (rows[1] - rows[0] + 1),
        colspan: !direction ? spanCell.colspan : spanCell.colspan - (cols[1] - cols[0] + 1),
    };
}

/**
 * 复制部分单元格
 */
export function copyPartialTable(tableData, range) {
    const cells = tableData.cells;
    const copyCellMap = new Map();
    const rect = {
        top: range.row,
        bottom: range.row + range.rowspan - 1,
        left: range.col,
        right: range.col + range.colspan - 1,
    };
    for (let r = range.row - 1; r < range.row + range.rowspan - 1; r++) {
        for (let c = range.col - 1; c < range.col + range.colspan - 1; c++) {
            const cell = cells[r][c];
            copyCellMap.set(`${r}:${c}`, cell);
            if (!cell) {
                const spanRange = findSpanCellRange(cells, r, c);
                const key = `${spanRange.row - 1}:${spanRange.col - 1}`;
                const bottom = spanRange.row + spanRange.rowspan - 1;
                const right = spanRange.col + spanRange.colspan - 1;

                const _cell = cells[spanRange.row - 1][spanRange.col - 1];
                copyCellMap.set(key, _cell);

                rect.top = Math.min(rect.top, spanRange.row);
                rect.bottom = Math.max(rect.bottom, bottom);
                rect.left = Math.min(rect.left, spanRange.col);
                rect.right = Math.max(rect.right, right);

                for (let _r = spanRange.row - 1; _r < bottom; _r++) {
                    for (let _c = spanRange.col - 1; _c < right; _c++) {
                        if (_r !== spanRange.row - 1 || _c !== spanRange.col - 1) {
                            copyCellMap.set(`${_r}:${_c}`, null);
                        }
                    }
                }
            }
        }
    }
    const _cells = [];
    for (let r = rect.top - 1; r < rect.bottom; r++) {
        const _row = [];
        for (let c = rect.left - 1; c < rect.right; c++) {
            const key = `${r}:${c}`;
            if (copyCellMap.has(key)) {
                _row.push(copyCellMap.get(key));
            } else {
                _row.push({ content: '' });
            }
        }
        _cells.push(_row);
    }
    tableData.cells = _cells;
    tableData.rows = tableData.rows.slice(rect.top - 1, rect.bottom);
    tableData.cols = tableData.cols.slice(rect.left - 1, rect.right);
    return tableData;
}
