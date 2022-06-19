import relationOfCellInGrid from './relation-of-cell-in-grid';

/**
 * @desc 将grid中索引为index的cell移除，并调整其余cell的大小和位置来填充移除cell的区域，优先调整影响最少的cell
 *
 * @param {Cell[]} grid - grid内的cell信息
 * @param {number} index - 要移除的cell的索引
 * @param {number} gap - cell之间的间隙
 * @param {'vertical'|'horizontal'} direction - 移出后单元格合并的方向
 * @returns {Cell[]} 移除目标cell后并调整完大小的grid
 */
export function removeCellInGrids(grid, index, gap, direction) {
    const newGrid = grid.map((cell) => {
        return { ...cell };
    });

    const targetCell = newGrid[index];
    if (!targetCell) return newGrid;

    const edge = {
        top: Math.round(targetCell.top),
        bottom: Math.round(targetCell.top + targetCell.height),
        left: Math.round(targetCell.left),
        right: Math.round(targetCell.left + targetCell.width),
    };

    const relation = relationOfCellInGrid(newGrid, index);
    newGrid.splice(index, 1);

    const horizontal = getRelayoutLength(relation, 'h', edge.top, edge.bottom);
    const vertical = getRelayoutLength(relation, 'v', edge.left, edge.right);
    if (
        horizontal.length > 0 &&
        (horizontal.length <= vertical.length || vertical.length === 0) &&
        direction !== 'vertical'
    ) {
        reLayoutGridBeforeRemove(relation, horizontal.dirs, 'h', edge.left, edge.right, gap);
    } else if (vertical.length > 0) {
        reLayoutGridBeforeRemove(relation, vertical.dirs, 'v', edge.top, edge.bottom, gap);
    }

    return newGrid;
}

/**
 * 得到在index上的cell是否可以和在水平和垂直方向上的其他单元格合并
 *
 * @public
 * @param {[]Cell} grid - grid array
 * @param {number} index - cell index
 * @returns {Object} mergeable at horizontal and vertical
 */
export function getMergeableDirectionOfCell(grid, index) {
    const newGrid = grid.map((cell) => {
        return { ...cell };
    });

    const targetCell = newGrid[index];

    if (!targetCell) {
        return {
            horizontal: false,
            vertical: false,
        };
    }

    const edge = {
        top: Math.round(targetCell.top),
        bottom: Math.round(targetCell.top + targetCell.height),
        left: Math.round(targetCell.left),
        right: Math.round(targetCell.left + targetCell.width),
    };

    const relation = relationOfCellInGrid(newGrid, index);

    const horizontal = getRelayoutLength(relation, 'h', edge.top, edge.bottom);
    const vertical = getRelayoutLength(relation, 'v', edge.left, edge.right);

    return {
        horizontal: horizontal.length > 0,
        vertical: vertical.length > 0,
    };
}

/**
 * 获取水平方向与竖直方向满足范围[minEdge, maxEdge]内可以填充的cell个数
 *
 * @param {Relation} relation - 被移除的cell的上下左右cells
 * @param {string} orientation - 水平方向还是竖直方向, 'v' 或 'h'
 * @param {number} minEdge - 被移除元素的左或上边界
 * @param {number} maxEdge - 被移除元素的右或下边界
 * @returns {object} length: {number}可以填充的cell数量, dirs: {string[]}可以填充的方向
 */
function getRelayoutLength(relation, orientation, minEdge, maxEdge) {
    let checkDirs, side, dir;
    if (orientation === 'v') {
        checkDirs = ['top', 'bottom'];
        side = 'width';
        dir = 'left';
    } else {
        checkDirs = ['left', 'right'];
        side = 'height';
        dir = 'top';
    }

    let totalLength = 0;
    const dirs = [];

    checkDirs.forEach((_dir) => {
        const cells = relation[_dir];
        const length = cells.length;
        let min = Infinity;
        let max = -1;
        if (length > 0) {
            cells.some((cell) => {
                const cellMin = Math.round(cell[dir]);
                const cellMax = Math.round(cell[dir] + cell[side]);
                if (cellMin < min) {
                    min = cellMin;
                }

                if (cellMax > max) {
                    max = cellMax;
                }
                return min < minEdge || max > maxEdge;
            });

            if (min === minEdge && max === maxEdge) {
                dirs.push(_dir);
                totalLength += length;
            }
        }
    });
    return { length: totalLength, dirs: dirs };
}

/**
 * 计算并填充被移除的cell区域
 *
 * @param {Relation} relation - 被移除cell的上下左右cells
 * @param {string[]} dirs - 填充的cells的方向
 * @param {string} orientation - 水平填充还是垂直填充, 'v' 或 'h'
 * @param {number} minEdge - 被移除元素的左或上边界
 * @param {number} maxEdge - 被移除元素的右或下边界
 * @param {number} gap - 元素之间的gap
 */
function reLayoutGridBeforeRemove(relation, dirs, orientation, minEdge, maxEdge, gap) {
    let min, max, side, minDir, maxDir;
    if (orientation === 'v') {
        side = 'height';
        minDir = 'top';
        maxDir = 'bottom';
    } else {
        side = 'width';
        minDir = 'left';
        maxDir = 'right';
    }
    if (dirs.length > 1) {
        const middle = (maxEdge - minEdge) / 2;
        min = minEdge + middle - gap / 2;
        max = maxEdge - middle + gap / 2;
    } else {
        min = maxEdge;
        max = minEdge;
    }
    dirs.forEach((dir) => {
        const cells = relation[dir];
        switch (dir) {
            case minDir:
                cells.forEach((cell) => {
                    cell.source[side] = min - cell[dir];
                });
                break;
            case maxDir:
                cells.forEach((cell) => {
                    cell.source[side] = cell[minDir] + cell[side] - max;
                    cell.source[minDir] = max;
                });
                break;
        }
    });
}
