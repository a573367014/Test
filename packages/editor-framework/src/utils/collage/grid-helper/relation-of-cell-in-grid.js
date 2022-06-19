import relationOfPointInGrid from './relation-of-point-in-grid';
/**
 * @desc 检测在gird中索引为index的cell，计算出其上下左右接邻的cells
 *
 * @param {Cell[]} grid - grid内的cell信息
 * @param {number} index - 要检测的cell索引
 * @returns {Relation} cell的上下左右cells
 */
export default function relationOfCellInGrid(grid, index) {
    const targetCell = grid[index];
    if (!targetCell) {
        return {
            left: [],
            right: [],
            top: [],
            bottom: [],
        };
    }

    const relation = relationOfPointInGrid(grid, {
        x: targetCell.left + Math.floor(targetCell.width / 2),
        y: targetCell.top + Math.floor(targetCell.height / 2),
    });

    function filterUnConnectedAtHorizontal(cell) {
        // 不在当前cell的范围内
        const seperated =
            cell.top >= targetCell.top + targetCell.height || cell.bottom <= targetCell.top;

        return !seperated;
    }
    relation.left = relation.left.filter(filterUnConnectedAtHorizontal);
    relation.right = relation.right.filter(filterUnConnectedAtHorizontal);

    function filterUnConnectedAtVertical(cell) {
        // 不在当前cell的范围内
        const seperated =
            cell.left >= targetCell.left + targetCell.width || cell.right <= targetCell.left;

        return !seperated;
    }
    relation.bottom = relation.bottom.filter(filterUnConnectedAtVertical);
    relation.top = relation.top.filter(filterUnConnectedAtVertical);

    return relation;
}
