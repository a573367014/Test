import getGapOfGrid from './get-gap-of-grid';

/**
 * @desc 检测grid内各cell相对于某线段的上下左右位置
 *
 * @param {Cell[]} grid - grid内的cells信息
 * @param {Vec2[]} line - 线段的两端点坐标。目前只支持水平/垂直线段，如果传入斜线则认为各个方向均没有满足条件的 cell
 * @param {number} [allowdedDiff=0.5] - 检测时边缘允许的偏移量，比如鼠标在一个cell内，距离底边2px，如果偏移量为0,
 * 则这个cell不会被认为是这个线段的上方cell，如果允许偏移量>=2, 则会。考虑到实际场景鼠标坐标误差和cell小数问题，默认值设为0.5
 * @returns {Relation} grid内相对于传入点的上下左右cells
 *
 * @example
 * relationOfPointInGrid([
    { left: 0, top: 0, width: 50, height: 100 },
    { left: 50, top: 0, width: 100, height: 150 },
    { left: 50, top: 150, width: 100, height: 50 },
    { left: 150, top: 0, width: 50, height: 100 },
    { left: 0, top: 100, width: 50, height: 100 },
    { left: 150, top: 100, width: 50, height: 100 },
   ], [{ x: 50, y: 150 }, { x: 100, y: 150 })
 *
 * // return
 * {
  "left": [
    { "left": 0, "top": 0, "width": 50, "height": 100, "right": 50, "bottom": 100 },
    { "left": 0, "top": 100, "width": 50, "height": 100, "right": 50, "bottom": 200 }
  ],
  "top": [
    { "left": 50, "top": 0, "width": 100, "height": 150, "right": 150, "bottom": 150 }
  ],
  "right": [
    { "left": 50, "top": 0, "width": 100, "height": 150, "right": 150, "bottom": 150 },
    { "left": 50, "top": 150, "width": 100, "height": 50, "right": 150, "bottom": 200 }
  ],
  "bottom": [
    { "left": 50, "top": 150, "width": 100, "height": 50, "right": 150, "bottom": 200 }
  ]
}
 */
export default function relationOfLineInGrid(grid, line, allowedDiff = 0.5) {
    const relation = {
        left: [],
        top: [],
        right: [],
        bottom: [],
    };

    const [point1, point2] = line;

    const _grid = grid.map((cell) => {
        const _cell = {
            ...cell,
            right: cell.left + cell.width,
            bottom: cell.top + cell.height,
            source: cell,
        };

        return _cell;
    });

    const gap = getGapOfGrid(grid);

    if (point1.x === point2.x) {
        // 垂直线
        const x = point1.x;
        const minY = Math.min(point1.y, point2.y);
        const maxY = Math.max(point1.y, point2.y);

        relation.left = _grid.filter((cell) => {
            const diff = cell.right - x;
            return (
                diff <= allowedDiff &&
                diff >= -Math.max(gap, allowedDiff) &&
                cell.top - maxY <= allowedDiff &&
                cell.bottom - minY >= allowedDiff
            );
        });
        relation.right = _grid.filter((cell) => {
            const diff = cell.left - x;
            return (
                diff >= -allowedDiff &&
                diff <= Math.max(gap, allowedDiff) &&
                cell.top - maxY <= allowedDiff &&
                cell.bottom - minY >= allowedDiff
            );
        });
    } else if (point1.y === point2.y) {
        // 水平线
        const y = point1.y;
        const minX = Math.min(point1.x, point2.x);
        const maxX = Math.max(point1.x, point2.x);

        relation.top = _grid.filter((cell) => {
            const diff = cell.bottom - y;
            return (
                diff <= allowedDiff &&
                diff >= -Math.max(gap, allowedDiff) &&
                cell.left - maxX <= allowedDiff &&
                cell.right - minX >= allowedDiff
            );
        });
        relation.bottom = _grid.filter((cell) => {
            const diff = cell.top - y;
            return (
                diff >= -allowedDiff &&
                diff <= Math.max(gap, allowedDiff) &&
                cell.left - maxX <= allowedDiff &&
                cell.right - minX >= allowedDiff
            );
        });
    }

    return relation;
}
