/**
 * 根据传入的grid计算其内cell间的间距（认定所有间距一样）
 *
 * @param {Cell[]} grid - 当前grid内cells
 *
 * @return {number} - gap
 */
export default function getGapOfGrid(grid) {
    if (grid.length === 0) {
        return 0;
    } else if (grid.length === 1) {
        return grid[0].top;
    } else {
        const minTop = Math.min.apply(
            null,
            grid.map((cell) => cell.top),
        );
        const cellsAtTop = grid.filter((cell) => cell.top === minTop);
        if (cellsAtTop.length > 1) {
            cellsAtTop.sort((cell1, cell2) => cell1.left - cell2.left);
            return cellsAtTop[1].left - cellsAtTop[0].left - cellsAtTop[0].width;
        } else {
            const minLeft = Math.min.apply(
                null,
                grid.map((cell) => cell.left),
            );
            const cellsAtLeft = grid.filter((cell) => cell.left === minLeft);
            cellsAtLeft.sort((cell1, cell2) => cell1.top - cell2.top);
            return cellsAtLeft[1].top - cellsAtLeft[0].top - cellsAtLeft[0].height;
        }
    }
}
