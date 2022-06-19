/* istanbul ignore file */
/** @module gridHelper */

import relationOfPointInGrid from './relation-of-point-in-grid';
import relationOfLineInGrid from './relation-of-line-in-grid';
import reLayoutGrid from './re-layout-grid';
import reLayoutGridByGapBorder from './re-layout-grid-by-gap-border';
import relationOfCellInGrid from './relation-of-cell-in-grid';
import { removeCellInGrids, getMergeableDirectionOfCell } from './remove-cell-in-grids';
import reLayoutGuideLine from './re-layout-guide-line';
import findNearestCellOfPoint from './find-nearest-cell-of-point';
import getBorderOfGrid from './get-border-of-grid';
import getGapOfGrid from './get-gap-of-grid';

export {
    relationOfPointInGrid,
    relationOfLineInGrid,
    reLayoutGrid,
    reLayoutGridByGapBorder,
    relationOfCellInGrid,
    removeCellInGrids,
    getMergeableDirectionOfCell,
    reLayoutGuideLine,
    findNearestCellOfPoint,
    getBorderOfGrid,
    getGapOfGrid,
};

/**
 * @typedef {Object} Cell
 * @desc cell相对grid的坐标和自身的宽高信息
 *
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef Vec2
 * @desc 2 dimension vector
 *
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef Relation
 * @desc grid内cells相对于某个点的位置分布
 *
 * @property {Cell[]} top - 位于上面的cells
 * @property {Cell[]} right - 位于右边部的cells
 * @property {Cell[]} bottom - 位于下面的cells
 * @property {Cell[]} left - 位于左边的cells
 */

/**
 * @typedef Line
 * @classdesc 线信息
 *
 * @prop {Vec2} from - 线的起点
 * @prop {Vec2} to - 线的终点
 */

/**
 * @typedef GuideLine
 * @classdesc grid中每个cell间隔的辅助线
 *
 * @property {Line[]} horizontal - 水平线
 * @property {Line[]} vertical - 竖直线
 */
