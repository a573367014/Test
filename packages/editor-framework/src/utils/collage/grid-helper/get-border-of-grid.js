/**
 * getBorderOfGrid
 *
 * @public
 * @param {[]Cell} grid - grid
 * @returns {Number} border value
 */
export default function getBorderOfGrid(grid) {
    let currentBorder = 9999;

    grid.forEach((cell) => {
        currentBorder = Math.min(currentBorder, cell.top);
    });

    return currentBorder;
}
