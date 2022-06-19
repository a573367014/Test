import { reLayoutGridByGapBorder } from './grid-helper';

/**
 * calculate rects of cells with gap and outerGap
 *
 * @public
 * @param {[]{width,height,left,right}} cells - rect of cells
 * @param {Number} gap - 间距
 * @param {Number} outerGap - 外边距
 * @returns {[]{width,height,left,right}} - calculated rects of cells with gap and outerGap
 */
export default function getRectsOfCells(cells, gap, outerGap) {
    let rects = cells.map((c) => ({
        left: c.left,
        top: c.top,
        width: c.width,
        height: c.height,
    }));

    rects = reLayoutGridByGapBorder(rects, gap, outerGap);
    rects.forEach((rect) => {
        rect.width = Math.max(rect.width, 1);
        rect.height = Math.max(rect.height, 1);
    });
    return rects;
}
