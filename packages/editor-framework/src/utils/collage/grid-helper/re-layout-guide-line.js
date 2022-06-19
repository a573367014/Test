/**
 * @desc 根据grid内cell的信息计算出辅助线的位置
 *
 * @param {Cell[]} grid - grid内的cell信息
 * @param {number} gap - 辅助线与cell的间隔
 * @param {number} lineMergeThrottle - 两条线认为可以合并的阀值。默认值为1, 即两条线间隔小于1（不等)时可以合并，
 * @returns {GuideLine} 计算出的辅助线
 * 实现思路：
 * 1、首先遍历所有的cell，通过获取最大的right和bottom和最小的left和top来计算grid的边界
 * 2、在遍历cell时同时计算水平辅助线和垂直辅助线：使用一个字典和数组分来保存已经记录过的辅助线，用于后面合并重合的辅助线。
 * 3、在记录新辅助线的时候检查记录的字典与数组（水平方向或竖直方向与记录的辅助线相差 gap之内的，这是为了防止小数点误差导致无法合并相同辅助线），
 *    判断辅助线是否有某个轴上有重合部分，若重合则将两条辅助线合并
 * 4、遍历完成之后再遍历生成的水平辅助线和垂直辅助线，剔除掉grid边界上的辅助线
 */
export default function reLayoutGuideLine(grid, gap, lineMergeThrottle = 1) {
    const guildLine = {
        horizontal: [],
        vertical: [],
    };
    const horizontalMap = {};
    const verticalMap = {};
    const edge = {
        left: Infinity,
        top: Infinity,
        right: -1,
        bottom: -1,
    };

    grid.forEach((cell) => {
        const left = cell.left;
        const top = cell.top;
        const right = cell.left + cell.width;
        const bottom = cell.top + cell.height;

        if (left < edge.left) {
            edge.left = left;
        }
        if (top < edge.top) {
            edge.top = top;
        }
        if (bottom > edge.bottom) {
            edge.bottom = bottom;
        }
        if (right > edge.right) {
            edge.right = right;
        }
    });

    grid.slice()
        .sort((c1, c2) => c1.left - c2.left)
        .forEach((cell) => {
            const left = cell.left;
            const top = cell.top;
            const right = cell.left + cell.width;

            // 减去 gap / 2 将线偏移到单元格间隙中间
            mergeHorizontal(top - gap / 2, left, right, horizontalMap, gap, lineMergeThrottle);
        });
    grid.slice()
        .sort((c1, c2) => c1.top - c2.top)
        .forEach((cell) => {
            const left = cell.left;
            const top = cell.top;
            const bottom = cell.top + cell.height;

            // 减去 gap / 2 将线偏移到单元格间隙中间
            mergeVertical(left - gap / 2, top, bottom, verticalMap, gap, lineMergeThrottle);
        });

    Object.keys(verticalMap).forEach((key) => {
        const left = parseFloat(key);
        if (left === edge.left - gap / 2) return;

        const lines = verticalMap[key];
        guildLine.vertical = guildLine.vertical.concat(lines);
    });
    Object.keys(horizontalMap).forEach((key) => {
        const top = parseFloat(key);
        if (top === edge.top - gap / 2) return;
        const lines = horizontalMap[key];
        guildLine.horizontal = guildLine.horizontal.concat(lines);
    });

    guildLine.vertical.sort((l1, l2) => {
        const diff = l1.from.y - l2.from.y;
        return diff === 0 ? l1.from.x - l2.from.x : diff;
    });
    guildLine.horizontal.sort((l1, l2) => {
        const diff = l1.from.x - l2.from.x;
        return diff === 0 ? l1.from.y - l2.from.y : diff;
    });

    return guildLine;
}

// TODO: mergeVertical 和 mergeHorizontal的逻辑基本相同，后面尝试合并方法

/**
 * @desc 遍历已记录的垂直线信息，判断是否可以将新的垂直线与旧的垂直线合并为一条，否则新的垂直线记录下来
 *
 * @param {number} x - 垂直线的水平坐标x
 * @param {number} top - 垂直线的开始坐标
 * @param {number} bottom - 垂直线的结束坐标
 * @param {Object{x: Line[]}} verticalMap - 已记录所有垂直线的map
 * @param {number} gap cell间的间距
 * @param {number} lineMergeThrottle - 两条线认为可以合并的阀值。默认值为1, 即两条线间隔小于1（不等)时可以合并，
 */
function mergeVertical(x, top, bottom, verticalMap, gap, lineMergeThrottle = 1) {
    let lines = verticalMap[x];
    if (!lines) {
        // 由于小数等问题，没有精确匹配的情况下，找接近的数
        const nearKey = Object.keys(verticalMap).find(
            (key) => Math.abs(parseFloat(key) - x) < lineMergeThrottle,
        );
        lines = verticalMap[nearKey];
    }
    if (lines) {
        // 由于小数问题，做不精确匹配
        const line = lines.find(({ to }) => top - to.y - gap < 0.5);
        if (line) {
            const { from, to } = line;
            const minTop = Math.min(from.y, top);
            const maxBottom = Math.max(to.y, bottom);
            from.y = minTop;
            to.y = maxBottom;
        } else {
            lines.push({
                from: { x: x, y: top },
                to: { x: x, y: bottom },
            });
        }
        return;
    }

    verticalMap[x] = [
        {
            from: { x: x, y: top },
            to: { x: x, y: bottom },
        },
    ];
}

/**
 * @desc 遍历已记录的水平线信息，判断是否可以将新的水平线与旧的水平线合并为一条，否则新的水平线记录下来
 *
 * @param {number} y - 水平线的垂直坐标y
 * @param {number} left - 水平线的开始坐标
 * @param {number} right - 水平线的结束坐标
 * @param {Object{y: Line[]}} horizontalMap - 已记录的所有水平线map
 * @param {number} gap cell间的间距
 * @param {number} lineMergeThrottle - 两条线认为可以合并的阀值。默认值为1, 即两条线间隔小于1（不等)时可以合并，
 */
function mergeHorizontal(y, left, right, horizontalMap, gap, lineMergeThrottle = 1) {
    let lines = horizontalMap[y];
    if (!lines) {
        // 由于小数等问题，没有精确匹配的情况下，找接近的数
        const nearKey = Object.keys(horizontalMap).find(
            (key) => Math.abs(parseFloat(key) - y) < lineMergeThrottle,
        );
        lines = horizontalMap[nearKey];
    }
    if (lines) {
        // 由于小数问题，做不精确匹配
        const line = lines.find(({ to }) => left - to.x - gap < 0.5);
        if (line) {
            const { from, to } = line;
            const minLeft = Math.min(from.x, left);
            const maxRight = Math.max(to.x, right);
            from.x = minLeft;
            to.x = maxRight;
        } else {
            lines.push({
                from: { x: left, y: y },
                to: { x: right, y: y },
            });
        }
        return;
    }

    horizontalMap[y] = [
        {
            from: { x: left, y: y },
            to: { x: right, y: y },
        },
    ];
}

export const _privateFnsForTest = {
    mergeVertical,
    mergeHorizontal,
};
