import getGapOfGrid from './get-gap-of-grid';
import getBorderOfGrid from './get-border-of-grid';

/**
 * 根据传入的新的gap(间距), border(外间距)自动调整grid内**所有**cell的位置和大小
 * 注意：这里根据需求认定grid外部的间距为边框，不属于grid的gap
 * 为了避免多次运算小数叠加导致误差逐渐增大问题，应该保持每次计算的基础grid是一样的，根据新的 gap 和 border 直接计算出最后结果，类似 computed property
 *
 * @param {Cell[]} grid - 当前grid内cells
 * @param {number} border - 新的border值
 * @param {number} gap - 新的gap值
 *
 * @returns {Cell[]} - 调整后的grid
 *
 * @example
 * reLayoutGridByGapBorder([
  {
    "left": 0,
    "top": 0,
    "width": 600,
    "height": 1200
  },
  {
    "left": 600,
    "top": 0,
    "width": 600,
    "height": 1200
  }
], 24, 24)

 *  // return

[
  {
    "left": 24,
    "top": 24,
    "width": 564,
    "height": 1152
  },
  {
    "left": 612,
    "top": 24,
    "width": 564,
    "height": 1152
  }
]

 */
export default function reLayoutGridByGapBorder(grid, gap, border) {
    // 边框处理思路：

    // - 算出预期的border与当前的diff：  borderDiff
    // - 由于调整border会导致所有单元格重排，引起采用从上而下，从左而右的方式逐一调整单元格
    // - 每个单元格处理思路
    //      - 每个单元格逐一处理其调整会受影响的所有单元格
    //      - 处理下一个时如果受影响的单元格之前已经处理过， 则使用其处理后的结果来计算当前单元格
    //      - 处理过的单元格查找位置和宽/高一致的单元格，复制当前的处理结果，保证两者位置关系不变

    // 单元格处理具体算法, 以处理第一个单元格宽度为例：

    // - 假设和第一个单元格top值相同（即顶部在同一水平线）有两个，那么这个水平线内要处理的共有三个单元格
    // - 当前三个单元格的总宽度为sum1，那么调整边框后的总宽度为sum2 = sum1 - borderDiff * 2 - (gap数 * gap), 然后三个单元格根据其在原来的sum中所占比例计算新的宽度newWidth，即 newWidth / sum2 = width / sum1
    // - 处理完的单元格打标记_width
    // - 接下去处理下一个
    //      * 如果全部未处理过, 则继续使用上面的算法
    //      * 含有未处理过与处理过的，逐个根据前后关系处理
    //      * 全部处理过，进行检查矫正

    if (typeof gap !== 'number' || typeof border !== 'number') return grid;

    const newGrid = grid.map((cell) => ({ ...cell }));

    const currentBorder = getBorderOfGrid(newGrid);
    const borderDiff = border - currentBorder;

    const currentGap = getGapOfGrid(newGrid);
    const gapDiff = gap - currentGap;

    if (borderDiff === 0 && gapDiff === 0) return grid;

    const tops = {};
    const lefts = {};
    const gridEdge = {
        top: Infinity,
        bottom: -Infinity,
        left: Infinity,
        right: -Infinity,
    };

    newGrid.forEach((cell) => {
        const bottom = cell.top + cell.height;
        const right = cell.left + cell.width;
        gridEdge.top = Math.min(cell.top, gridEdge.top);
        gridEdge.left = Math.min(cell.left, gridEdge.left);
        gridEdge.bottom = Math.max(bottom, gridEdge.bottom);
        gridEdge.right = Math.max(right, gridEdge.right);

        // 整体移动, 使顶部和左侧的单元格位置正确
        cell._left = cell.left + borderDiff;
        cell._top = cell.top + borderDiff;

        tops[cell.top] = 1;
        lefts[cell.left] = 1;
    });

    // 横向宽度调整
    adjustCells(newGrid, 'horizontal', tops, gapDiff, borderDiff, currentGap, gridEdge.right);

    // 纵向高度调整
    adjustCells(newGrid, 'vertical', lefts, gapDiff, borderDiff, currentGap, gridEdge.bottom);

    return newGrid.map((cell) => ({
        left: cell._left || cell.left,
        top: cell._top || cell.top,
        width: Number.isNaN(cell._width) ? 1 : cell._width,
        height: Number.isNaN(cell._height) ? 1 : cell._height,
    }));
}

/**
 * adjustCells
 * @desc 调整每行/列内的单元格
 *
 * @param {Array} grid - 所有 cells 的数组
 * @param {string} direction - 单元格排列方向，横或纵
 * @param {Array<number>} positions - 每行/列的 top/left
 * @param {number} gapDiff
 * @param {number} borderDiff
 * @param {number} currentGap
 * @param {number} edge - 横向为右边缘，纵向为底部
 */
function adjustCells(grid, direction, positions, gapDiff, borderDiff, currentGap, edge) {
    let posField = 'top'; // 当前方向的对齐项
    let sumField = 'width'; // 当前方向计算总宽/高项
    let otherPosField = 'left';
    let otherSumField = 'height';
    let newOtherPosField = '_left';
    let newSumField = '_width';
    if (direction === 'vertical') {
        posField = 'left';
        sumField = 'height';
        otherPosField = 'top';
        otherSumField = 'width';
        newOtherPosField = '_top';
        newSumField = '_height';
    }
    // 不对 grid 直接排序
    const gridSortByPostField = grid
        .map((cell) => ({ sortField: cell[posField], cell }))
        .sort((c1, c2) => c1.sortField - c2.sortField);

    Object.keys(positions)
        .map((t) => parseFloat(t))
        .sort((t1, t2) => t1 - t2)
        .forEach((pos) => {
            // 宽/高度调整
            // 所有 top/left 相同和 top/left 在 cell 的中间的 cells 均会影响宽度/高度分布
            // 由于小数问题，top/left对比没有做严格对等
            const relativeCells = grid
                .filter(
                    (c) =>
                        (c[posField] < pos && c[posField] + c[otherSumField] - pos >= 1) ||
                        Math.abs(c[posField] - pos) < 1,
                )
                .sort((c1, c2) => c1[otherPosField] - c2[otherPosField]);
            if (relativeCells.length > 0) {
                const leftsOrTopsOfContainedCell = relativeCells.reduce((leftsOrTops, acc) => {
                    leftsOrTops[acc[otherPosField]] = 1;
                    return leftsOrTops;
                }, {});
                const maxBottomOrRight = relativeCells
                    .map((x) => x[posField] + x[otherSumField])
                    .sort((a, b) => a - b)
                    .pop();
                let widthOrHeightSum =
                    relativeCells.reduce((sum, c) => sum + c[sumField], 0) +
                    (relativeCells.length - 1) * currentGap;
                // 将在top/left 和 maxBottomOrRight 中间的格子计入，但是每个left/top只能有一个
                gridSortByPostField.forEach(({ cell }) => {
                    const bottomOrRight = cell[posField] + cell[otherSumField];
                    widthOrHeightSum = widthOrHeightSum + cell[sumField] + currentGap;
                    // 由于小数问题，bottom/right不做严格对等
                    if (
                        cell[posField] > top &&
                        bottomOrRight - maxBottomOrRight < 1 &&
                        !leftsOrTopsOfContainedCell[cell[otherPosField]] &&
                        widthOrHeightSum - 1 < edge
                    ) {
                        leftsOrTopsOfContainedCell[cell[otherPosField]] = 1;
                        relativeCells.push(cell);
                    } else {
                        widthOrHeightSum = widthOrHeightSum - cell[sumField] - currentGap;
                    }
                });
                relativeCells.sort((c1, c2) => c1[otherPosField] - c2[otherPosField]);
            }

            const sumOfGrid = relativeCells.reduce((s, c) => {
                s += c[sumField];
                return s;
            }, 0);

            const unCalculatedCells = relativeCells.filter(
                (cell) => typeof cell[newSumField] !== 'number',
            );
            if (unCalculatedCells.length === relativeCells.length) {
                const diff = borderDiff * 2 + (relativeCells.length - 1) * gapDiff;
                const ratio = (sumOfGrid - diff) / sumOfGrid;
                relativeCells.forEach((cell, index) => {
                    const width = cell[sumField];
                    cell[newSumField] = width * ratio;
                    if (index !== 0) {
                        // 最上侧的 cells 的 left/top 已经在整体移动步骤处理正确
                        const prevCell = relativeCells[index - 1];
                        const leftOrTop = prevCell[newOtherPosField] || prevCell[otherPosField];
                        const widthOfHeight = prevCell[newSumField] || prevCell[sumField];
                        // 重新计算 left/top
                        cell[newOtherPosField] = leftOrTop + widthOfHeight + gapDiff;
                    }

                    // 查找 left/top 和 width/height 相同的未处理的cell, 保证一致
                    // TODO: 优化，在循环外部处理
                    grid.forEach((c) => {
                        if (
                            Math.abs(c[otherPosField] - cell[otherPosField]) < 1 &&
                            Math.abs(c[sumField] - cell[sumField]) < 1 &&
                            !c[newSumField]
                        ) {
                            c[newOtherPosField] = cell[newOtherPosField];
                            c[newSumField] = cell[newSumField];
                        }
                    });
                });
            } else if (unCalculatedCells.length > 0) {
                // 已经含有处理过的单元格，逐个处理为处理过的单元格
                // 因为这时候剩余 diff 的不好准确计算的
                for (let i = 0; i < relativeCells.length; i++) {
                    const current = relativeCells[i];
                    if (current[newSumField]) continue;

                    const prev = relativeCells[i - 1] || {
                        _left: 0,
                        _width: borderDiff - gapDiff,
                        _top: 0,
                        _height: borderDiff - gapDiff,
                    };
                    const next = relativeCells[i + 1] || {
                        _left: sumOfGrid - borderDiff + gapDiff,
                        _width: 0,
                        _top: sumOfGrid - borderDiff + gapDiff,
                        _height: 0,
                    };

                    current[newOtherPosField] =
                        prev[newOtherPosField] + prev[newSumField] + gapDiff;
                    if (typeof next[newSumField] !== 'undefined') {
                        current[newSumField] =
                            next[newOtherPosField] - current[newOtherPosField] - gapDiff;
                    } else {
                        let diff = gapDiff;
                        if (i === 0 || i === relativeCells.length - 1) {
                            diff = gapDiff / 2;
                        }
                        current[newSumField] = current[sumField] - diff;
                    }

                    // 查找 left/top 和 width/height 相同的未处理的cell, 保证一致
                    // TODO: 优化，在循环外部处理
                    grid.forEach((c) => {
                        if (
                            Math.abs(c[otherPosField] - current[otherPosField]) < 1 &&
                            Math.abs(c[sumField] - current[sumField]) < 1 &&
                            !c[newSumField]
                        ) {
                            c[newOtherPosField] = current[newOtherPosField];
                            c[newSumField] = current[newSumField];
                        }
                    });
                }
            } else {
                // 由于上两个部分会将 height, top 一致的格子均统一设置
                // 以尽可能的保持单元格原始的布局
                // 但可能和其他关联单元格的结果有出入，出现过多空隙或重叠，因此做一次检查矫正
                // 如下：0, 1, 2 处理后处理 3, 4, 5, 2，最后处理 3, 6, 7 发现
                // 都已经统一规则处理过了，但是无法保证是正确的
                //   +--+---------+------------+
                //   | 0|   1     |      2     |
                //   |--|---------+            |
                //   | 3|  4 | 5  |            |
                //   |  |----------------------|
                //   |  |    6    |  7         |
                //   |  |         |            |
                //   +--+----------------------+

                for (let i = 0; i < relativeCells.length - 1; i++) {
                    const current = relativeCells[i];
                    const next = relativeCells[i + 1];
                    const diff =
                        next[newOtherPosField] -
                        current[newOtherPosField] -
                        current[newSumField] -
                        gapDiff;
                    if (Math.abs(diff) > 1) {
                        current[newSumField] += diff;
                    }
                }
            }
        });
}
