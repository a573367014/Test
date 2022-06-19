import relationOfPointInGrid from './relation-of-point-in-grid';
import getGapOfGrid from './get-gap-of-grid';

/**
 * @desc 根据传入的cells关系和位移向量来计算新的cells坐标与宽高
 *
 * @param {Cell[]} grid - 上下左右cells
 * @param {Vec2} point - grid内cells关系的参照点, 不能某个cell 内 {@link relationOfPointInGrid}
 * @param {Vec2} vector - 位移向量
 * @returns {Cell[]} grid - 调整后grid
 *
 * @example
 * reLayoutGrid([
  { "left": 24, "top": 24, "width": 564, "height": 564 },
  { "left": 24, "top": 912, "width": 360, "height": 264 },
  { "left": 24, "top": 612, "width": 360, "height": 276 },
  { "left": 816, "top": 912, "width": 360, "height": 264 },
  { "left": 816, "top": 612, "width": 360, "height": 276 },
  { "left": 408, "top": 612, "width": 384, "height": 564 },
  { "left": 612, "top": 24, "width": 564, "height": 564 }
], { x: 588, y: 306 }, { x: 30, y: 0})
 *
 * // return
 * [
  { "left": 24, "top": 24, "width": 594, "height": 564 },
  { "left": 24, "top": 912, "width": 360, "height": 264 },
  { "left": 24, "top": 612, "width": 360, "height": 276 },
  { "left": 816, "top": 912, "width": 360, "height": 264 },
  { "left": 816, "top": 612, "width": 360, "height": 276 },
  { "left": 408, "top": 612, "width": 384, "height": 564 },
  { "left": 642, "top": 24, "width": 534, "height": 564}
]
 */
export default function reLayoutGrid(grid, point, vector) {
    const newGrid = grid.map((cell) => ({ ...cell }));
    const gap = getGapOfGrid(newGrid);
    const relation = relationOfPointInGrid(newGrid, point);
    if (vector.x !== 0) {
        // 受左侧 cells 变化影响的 cells
        const affectedCellsByLeft = [];
        // 受右侧 cells 变化影响的 cells
        const affectedCellsByRight = [];
        const leftLine = {
            top: Number.POSITIVE_INFINITY,
            bottom: Number.NEGATIVE_INFINITY,
            value: Number.NEGATIVE_INFINITY,
        };
        const rightLine = {
            top: Number.POSITIVE_INFINITY,
            bottom: Number.NEGATIVE_INFINITY,
            value: Number.POSITIVE_INFINITY,
        };
        relation.left.forEach((l) => {
            leftLine.top = Math.min(l.top, leftLine.top);
            leftLine.bottom = Math.max(l.bottom, leftLine.bottom);
            leftLine.value = Math.max(l.right, leftLine.value);
        });
        relation.right.forEach((r) => {
            rightLine.top = Math.min(r.top, leftLine.top);
            rightLine.bottom = Math.max(r.bottom, leftLine.bottom);
            rightLine.value = Math.min(r.left, rightLine.value);
        });

        newGrid.forEach((cell) => {
            const right = cell.left + cell.width;
            if (cell.left - leftLine.value <= gap && cell.left > leftLine.value) {
                affectedCellsByLeft.push(cell);
            } else if (rightLine.value - right <= gap && right < rightLine.value) {
                affectedCellsByRight.push(cell);
            }
        });

        joinAndUniqueCells(
            relation.right.map((r) => r.source),
            affectedCellsByLeft,
        ).forEach((c) => {
            c.left += vector.x;
            c.width -= vector.x;
        });
        joinAndUniqueCells(
            relation.left.map((l) => l.source),
            affectedCellsByRight,
        ).forEach((c) => {
            c.width += vector.x;
        });
    }
    if (vector.y !== 0) {
        const affectedCellsByTop = [];
        const affectedCellsByBottom = [];
        const topLine = {
            left: Number.POSITIVE_INFINITY,
            right: Number.NEGATIVE_INFINITY,
            value: Number.NEGATIVE_INFINITY,
        };
        const bottomLine = {
            left: Number.POSITIVE_INFINITY,
            right: Number.NEGATIVE_INFINITY,
            value: Number.POSITIVE_INFINITY,
        };
        relation.top.forEach((c) => {
            topLine.left = Math.min(c.left, topLine.left);
            topLine.right = Math.max(c.right, topLine.right);
            topLine.value = Math.max(c.bottom, topLine.value);
        });
        relation.bottom.forEach((c) => {
            bottomLine.left = Math.min(c.left, bottomLine.left);
            bottomLine.right = Math.max(c.right, bottomLine.right);
            bottomLine.value = Math.min(c.top, bottomLine.value);
        });

        newGrid.forEach((cell) => {
            const bottom = cell.top + cell.height;
            if (cell.top - topLine.value <= gap && cell.top > topLine.value) {
                affectedCellsByTop.push(cell);
            } else if (bottomLine.value - bottom <= gap && bottom < bottomLine.value) {
                affectedCellsByBottom.push(cell);
            }
        });

        joinAndUniqueCells(
            relation.top.map((c) => c.source),
            affectedCellsByBottom,
        ).forEach((t) => {
            t.height += vector.y;
        });
        joinAndUniqueCells(
            relation.bottom.map((c) => c.source),
            affectedCellsByTop,
        ).forEach((b) => {
            b.top += vector.y;
            b.height -= vector.y;
        });
    }

    return newGrid;
}

/**
 * joinAndUniqueCells
 *
 * @public
 * @param {[]Cell} cells1 - array of cells
 * @param {[]Cell} cells2 - array of other cells
 * @returns {[]Cell} joined and uniqued cells of given
 */
function joinAndUniqueCells(cells1, cells2) {
    const map = {};
    cells1.forEach((cell) => {
        const key = `${cell.width}-${cell.height}-${cell.left}-${cell.top}`;
        map[key] = cell;
    });
    cells2.forEach((cell) => {
        const key = `${cell.width}-${cell.height}-${cell.left}-${cell.top}`;
        if (!map[key]) {
            map[key] = cell;
        }
    });
    return Object.keys(map).map((k) => map[k]);
}
