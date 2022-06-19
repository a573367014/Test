/**
 * @typedef NearestCell
 * @desc 离坐标点最近的cell信息
 *
 * @property {number} distance 与边距离
 * @property {string} side 靠近的边(left, top, right, bottom)
 * @property {number} index cell在grid中的索引
 */

/**
 * @desc 查找在grid中离坐标点最近的cell的信息
 *
 * @param {Cell[]} grid - grid内的cells信息
 * @param {Vec2} point - 点坐标
 * @param {number} [maxDistance=Infinity] - 允许的与边的最远距离，如果点坐标离最近的cell的所有边的距离都大于最远距离，则认为最近cell不存在, 目前对应着拼图的外部边框
 * @returns {NearestCell|undefined} 最近距离的cell的信息
 */
export default function findNearestCellOfPoint(grid, point, maxDistance = Infinity) {
    const { x, y } = point;
    if (x <= 0 || y <= 0) return null;

    const minDistance = [
        {
            // left
            cellIndex: -1,
            distance: Infinity,
            side: 'left',
        },
        {
            // right
            cellIndex: -1,
            distance: Infinity,
            side: 'right',
        },
        {
            // top
            cellIndex: -1,
            distance: Infinity,
            side: 'top',
        },
        {
            // bottom
            cellIndex: -1,
            distance: Infinity,
            side: 'bottom',
        },
    ];
    let inside = null;
    let rightEdge = -Infinity;
    let bottomEdge = -Infinity;

    grid.forEach((cell, cellIndex) => {
        if (inside) return;

        const right = cell.left + cell.width;
        const bottom = cell.top + cell.height;
        rightEdge = Math.max(rightEdge, right);
        bottomEdge = Math.max(bottomEdge, bottom);

        if (cell.left - x <= 0 && right - x >= 0 && cell.top - y <= 0 && bottom - y >= 0) {
            inside = {
                cellIndex,
                cell,
                side: 'inside',
            };
            return;
        }

        const distance = [
            pointToSegDist(x, y, cell.left, cell.top, cell.left, bottom), // left
            pointToSegDist(x, y, right, cell.top, right, bottom), // right
            pointToSegDist(x, y, cell.left, cell.top, right, cell.top), // top
            pointToSegDist(x, y, cell.left, bottom, right, bottom), // bottom
        ];

        let min = Infinity;
        let minIndex = -1;
        distance.forEach((val, index) => {
            if (val < min) {
                minIndex = index;
                min = val;
            }
        });

        if (min < minDistance[minIndex].distance) {
            minDistance[minIndex].cellIndex = cellIndex;
            minDistance[minIndex].distance = min;
        }
    });

    if (inside) {
        return {
            distance: -1,
            side: 'inside',
            index: inside.cellIndex,
        };
    }

    const pointInsideGrid = x <= rightEdge + maxDistance && y <= bottomEdge + maxDistance;
    if (!pointInsideGrid) return null;

    const min = minDistance.reduce((min, val) => {
        if (!min || val.distance < min.distance) return val;

        return min;
    }, null);

    if (!min) return null;

    return {
        distance: min.distance,
        index: min.cellIndex,
        side: min.side,
    };
}

/**
 * pointToSegDist
 *
 * @private
 * @param {number} x - point.x
 * @param {number} y - point.y
 * @param {number} x1 - segement.x1
 * @param {number} y1 - segement.y1
 * @param {number} x2 - segement.x2
 * @param {number} y2 - segement.y2
 * @returns {number} point distance to line segement
 */
function pointToSegDist(x, y, x1, y1, x2, y2) {
    const cross1 = (x2 - x1) * (x - x1) + (y2 - y1) * (y - y1);
    if (cross1 <= 0) {
        /*
         * point beyond left of line
         *   \ (x, y)
         *    \
         *     \
         *      -------------- (x2, y2)
         *    (x1, y1)
         */
        return Math.hypot(x - x1, y - y1);
    }
    const cross2 = (x1 - x2) * (x - x2) + (y1 - y2) * (y - y2);
    if (cross2 <= 0) {
        /*
         * point beyond right of line
         *                 /(x, y)
         *                /
         *               /
         *  ------------- (x2, y2)
         *  (x1, y1)
         */
        return Math.hypot(x - x2, y - y2);
    }

    /*
     * point inside line range
     *        /(x, y)
     *       /
     *      /
     *  ------------- (x2, y2)
     *  (x1, y1)
     */
    const lengthOfSegment = Math.hypot(x2 - x1, y2 - y1);
    const r = cross1 / (lengthOfSegment * lengthOfSegment);
    const px = x1 + (x2 - x1) * r;
    const py = y1 + (y2 - y1) * r;
    return Math.hypot(x - px, y - py);
}
