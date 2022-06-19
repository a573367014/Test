import getGapOfGrid from './get-gap-of-grid';

/**
 * @desc 检测grid内各cell相对于某个点的上下左右位置
 *
 * @param {Cell[]} grid - grid内的cells信息
 * @param {Vec2} point - 点坐标
 * @param {number} [allowdedDiff=0.5] - 检测时边缘允许的偏移量，比如鼠标在一个cell内，距离底边2px，如果偏移量为0,
 * 则这个cell不会被认为是这个点的上方cell，如果允许偏移量>=2, 则会。考虑到实际场景鼠标坐标误差和cell小数问题，默认值设为0.5
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
   ], { x: 50, y: 150 })
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
export default function relationOfPointInGrid(grid, point, allowdedDiff = 0.5) {
    const relation = {
        left: [],
        top: [],
        right: [],
        bottom: [],
    };

    /**
     * @desc point周边cells组成的上下左右边界
     */
    const edge = {
        left: -1,
        top: -1,
        right: -1,
        bottom: -1,
    };

    /**
     * @desc grid的上下左右边界
     */
    const gridEdge = {
        left: null,
        right: null,
        top: null,
        bottom: null,
    };

    const _grid = grid.map((cell) => {
        const _cell = {
            ...cell,
            right: cell.left + cell.width,
            bottom: cell.top + cell.height,
            source: cell,
        };

        gridEdge.left = gridEdge.left !== null ? Math.min(_cell.left, gridEdge.left) : _cell.left;
        gridEdge.right =
            gridEdge.right !== null ? Math.max(_cell.right, gridEdge.right) : _cell.right;
        gridEdge.top = gridEdge.top !== null ? Math.min(_cell.top, gridEdge.top) : _cell.top;
        gridEdge.bottom =
            gridEdge.bottom !== null ? Math.max(_cell.bottom, gridEdge.bottom) : _cell.bottom;

        return _cell;
    });

    let cellContainPoint = null;
    _grid.some((cell) => {
        // 由于小数问题，做不严格匹配
        const isCellContainPoint =
            cell.left - point.x < -1 &&
            cell.right - point.x > 1 &&
            cell.top - point.y < -1 &&
            cell.bottom - point.y > 1;
        if (isCellContainPoint) {
            cellContainPoint = cell;
        }
        return isCellContainPoint;
    });

    if (cellContainPoint !== null) {
        // 点在某一个 cell 内部
        edge.left = cellContainPoint.left;
        edge.right = cellContainPoint.right;
        edge.top = cellContainPoint.top;
        edge.bottom = cellContainPoint.bottom;
        relation.left = _grid.filter((cell) => cell.right - edge.left <= allowdedDiff);
        relation.right = _grid.filter((cell) => cell.left - edge.right >= -allowdedDiff);
        relation.top = _grid.filter((cell) => cell.bottom - edge.top <= allowdedDiff);
        relation.bottom = _grid.filter((cell) => cell.top - edge.bottom >= -allowdedDiff);
    } else {
        _grid.forEach((cell) => {
            if (cell.right - point.x <= allowdedDiff) {
                relation.left.push(cell);
                if (edge.left === -1) {
                    edge.left = cell.right;
                } else {
                    edge.left = Math.max(cell.right, edge.left);
                }
            } else if (cell.left - point.x >= -allowdedDiff) {
                relation.right.push(cell);
                if (edge.right === -1) {
                    edge.right = cell.left;
                } else {
                    edge.right = Math.min(cell.left, edge.right);
                }
            }
            if (cell.bottom - point.y <= allowdedDiff) {
                relation.top.push(cell);
                if (edge.top === -1) {
                    edge.top = cell.bottom;
                } else {
                    edge.top = Math.max(cell.bottom, edge.top);
                }
            } else if (cell.top - point.y >= -allowdedDiff) {
                relation.bottom.push(cell);
                if (edge.bottom === -1) {
                    edge.bottom = cell.top;
                } else {
                    edge.bottom = Math.min(cell.top, edge.bottom);
                }
            }
        });

        edge.top = edge.top === -1 ? gridEdge.top : edge.top;
        edge.left = edge.left === -1 ? gridEdge.left : edge.left;
        edge.right = edge.right === -1 ? gridEdge.right : edge.right;
        edge.bottom = edge.bottom === -1 ? gridEdge.bottom : edge.bottom;
    }

    const gap = getGapOfGrid(grid);

    relation.left = relation.left.filter((l) => {
        return (
            l.right - edge.left >= Math.min(-allowdedDiff, -gap) &&
            l.right - edge.right <= allowdedDiff &&
            l.left - edge.left <= allowdedDiff
        );
    });
    relation.right = relation.right.filter((r) => {
        return (
            r.left - edge.left >= -allowdedDiff &&
            r.left - edge.right <= Math.max(allowdedDiff, gap) &&
            r.right - edge.right >= allowdedDiff
        );
    });
    relation.top = relation.top.filter((t) => {
        return (
            t.bottom - edge.top >= Math.min(-allowdedDiff, -gap) &&
            t.bottom - edge.bottom <= allowdedDiff &&
            t.top - edge.top <= allowdedDiff
        );
    });
    relation.bottom = relation.bottom.filter((b) => {
        return (
            b.top - edge.top >= -allowdedDiff &&
            b.top - edge.bottom <= Math.max(allowdedDiff, gap) &&
            b.bottom - edge.bottom >= allowdedDiff
        );
    });

    // 过滤中间有其他cell隔断的上下关系
    const minLeft =
        relation.left.length > 0
            ? Math.min.apply(
                  null,
                  relation.left.map((c) => c.left),
              )
            : edge.left;
    const maxRight =
        relation.right.length > 0
            ? Math.max.apply(
                  null,
                  relation.right.map((c) => c.right),
              )
            : edge.right;
    const verticalFilter = (c) => {
        const separated = c.left - maxRight > -allowdedDiff || c.right - minLeft < allowdedDiff;
        return !separated;
    };
    relation.top = relation.top.filter(verticalFilter);
    relation.bottom = relation.bottom.filter(verticalFilter);

    return relation;
}
