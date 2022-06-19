/**
 * EditorElementCollage
 */
import { pick, clone, merge } from 'lodash';
import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import {
    removeCellInGrids,
    getMergeableDirectionOfCell,
} from '@gaoding/editor-framework/src/utils/collage/grid-helper';
import getRectsOfCells from '@gaoding/editor-framework/src/utils/collage/get-rects-of-cells';

import EditorElementGroup from '../group/group-element';
import template from './editor-element-collage.html';

/**
 * @class EditorElementCollage
 */
export default inherit(EditorElementGroup, {
    name: 'collage-element',
    template,

    data() {
        return {
            imageDropMode: false, // 当图片拖拽进入拼图时，将gap和outerGap扩大4
        };
    },

    computed: {
        backgroundStyle() {
            const { backgroundColor } = this.model;
            return {
                backgroundColor: backgroundColor,
            };
        },
        renderElements() {
            // 不使用model数据来直接渲染数据是为了避免model经过多次gap和border改变导致的数据偏差叠加
            // 使用computed的数据可以保证原model不变，输出的render用model只会经过一次gap和border的改变
            const { elements } = this.model;
            const { gap, outerGap } = this;

            return getRectsOfCells(
                elements.map((element) => utils.getElementRect(element)),
                gap,
                outerGap,
            );
        },
        outerGap() {
            const { outerGap = 0 } = this.model;
            return this.imageDropMode ? outerGap + 4 : outerGap;
        },
        gap() {
            const { gap = 0 } = this.model;
            return this.imageDropMode ? gap + 4 : gap;
        },
    },

    methods: {
        /**
         * 准备进行缩放
         * @memberof EditorElementCollage
         * @param {string} dir - 缩放的方位
         */
        resizeInit() {
            this.$childModelsCache = this.model.elements.map((element) => {
                const cache = pick(element, [
                    'left',
                    'top',
                    'width',
                    'height',
                    'fontSize',
                    'imageWidth',
                    'imageHeight',
                ]);
                cache.padding = clone(element.padding);
                cache.clip = clone(element.clip);

                return cache;
            });

            this.$elementCache = {
                width: this.model.width,
                height: this.model.height,
            };
        },
        /**
         * 获取元素矩形
         * @memberof EditorElementCollage
         */
        getRect() {
            const { model, global } = this;
            const { zoom } = global;
            const { elements } = model;
            const bbox = utils.getBBoxByElements(
                elements.map((elem) => ({
                    ...elem,
                    rotate: 0, // rotate 值是图片的旋转，不是 cell 本身的旋转，计算时需清 0，避免误算
                })),
            );

            return {
                height: bbox.height * zoom + bbox.top * 2 * zoom,
                width: bbox.width * zoom + bbox.left * 2 * zoom,
            };
        },
        /**
         * 缩放结束
         * @memberof EditorElementCollage
         */
        resizeEnd() {
            delete this.$childModelsCache;
            delete this.$elementCache;
        },

        /**
         * 缩放子元素
         * @memberof EditorElementCollage
         * @param {number} widthRatio - 宽度比例
         * @param {number} heightRatio - 高度比例
         */
        setSubElementsRatio(widthRatio, heightRatio) {
            const { $childModelsCache, model } = this;

            const rects = $childModelsCache.map((rect) => {
                return {
                    left: rect.left * widthRatio,
                    top: rect.top * heightRatio,
                    width: rect.width * widthRatio,
                    height: rect.height * heightRatio,
                };
            });

            rects.forEach((rect, i) => {
                const element = model.elements[i];

                element.left = rect.left;
                element.top = rect.top;
                element.width = rect.width;
                element.height = rect.height;
            });
        },

        /**
         * 设置子元素的边缘圆角
         * @param {number} borderRadius - 圆角
         */
        setItemRoundness() {
            const { elements, itemRoundness } = this.model;

            elements.forEach((element) => {
                element.borderRadius = itemRoundness;
            });
        },

        /**
         * 移除拼图中的子元素
         * @param {number} index - 要移除的子元素索引
         * @param {'vertical'|'horizontal'} direction - 移出后单元格合并的方向
         */
        removeSubElement(index, direction) {
            const { elements, $cellIndex } = this.model;
            if (elements.length > this.options.minCellCount) {
                if ($cellIndex === index) {
                    this.model.$cellIndex = -1;
                }

                const rects = [];
                elements.forEach((_element) => {
                    const rect = utils.getElementRect(_element);
                    rect.$element = _element;
                    rects.push(rect);
                });

                const newRects = removeCellInGrids(rects, index, 0, direction);
                this.model.elements = newRects.map((rect) => {
                    const { left, top, width, height, $element } = rect;
                    $element.left = left;
                    $element.top = top;
                    $element.width = width;
                    $element.height = height;

                    return $element;
                });
                this.$events.$emit('editor.snapshot.create', null, true);

                this.autoFixGrid();
            }
        },

        /**
         * 清除拼图中的子元素图片
         * @param {number} index - 要清空的子元素的索引
         */
        clearSubElement(index) {
            const { elements } = this.model;
            const element = elements[index];

            if (element) {
                element.url = '';
                element.imageTransform = null;
                element.opacity = 1;
            }
        },

        /**
         * 将新的子元素添加到拼图元素中
         * @param {number} index - 新增子元素要添加子元素索引
         * @param {string} side - 新增子元素要添加在目标子元素的哪个位置, left, top, right, bottom
         * @param {element} cell - 要新增的子元素信息
         */
        addSubElement(index, side, cell) {
            const { elements } = this.model;
            const element = elements[index];
            if (element) {
                const rect = utils.getElementRect(element);
                const newWidth = Math.max(rect.width / 2, 1);
                const newHeight = Math.max(rect.height / 2, 1);
                if (['left', 'right'].indexOf(side) >= 0) {
                    let leftElement, rightElement;
                    if (side === 'left') {
                        leftElement = cell;
                        rightElement = element;
                    } else {
                        leftElement = element;
                        rightElement = cell;
                    }

                    leftElement.left = rect.left;
                    leftElement.top = rect.top;
                    leftElement.width = newWidth;
                    leftElement.height = rect.height;

                    rightElement.left = rect.left + newWidth;
                    rightElement.top = rect.top;
                    rightElement.width = newWidth;
                    rightElement.height = rect.height;
                } else {
                    let topElement, bottomElement;
                    if (side === 'top') {
                        topElement = cell;
                        bottomElement = element;
                    } else {
                        topElement = element;
                        bottomElement = cell;
                    }

                    topElement.left = rect.left;
                    topElement.top = rect.top;
                    topElement.width = rect.width;
                    topElement.height = newHeight;

                    bottomElement.left = rect.left;
                    bottomElement.top = rect.top + newHeight;
                    bottomElement.width = rect.width;
                    bottomElement.height = newHeight;
                }

                elements.splice(index, 0, cell);
                this.model.$cellIndex = index;
            }
        },

        changeSubelement(index, props) {
            const cell = this.model.elements[index];
            if (cell) {
                merge(cell, props);
            }
        },
        getMergeableDirectionOfCell(index) {
            const { elements } = this.model;
            const grid = elements.map((elem) => ({
                left: elem.left,
                top: elem.top,
                width: elem.width,
                height: elem.height,
            }));
            return getMergeableDirectionOfCell(grid, index);
        },
        autoFixGrid() {
            // 自动校验 grid 内的数据正确性，并矫正错误数据
            // cells 的 rect 是不包含 gap 和 outerGap,因此
            // cells 间的间距应该小于 1
            const elements = this.model.elements;
            const tops = new Set();
            const lefts = new Set();
            elements.forEach((elem) => {
                tops.add(elem.top);
                lefts.add(elem.left);
            });

            Array.from(tops)
                .sort((t1, t2) => t1 - t2)
                .forEach((top) => {
                    const cellsRelated = elements
                        .filter(
                            (elem) =>
                                Math.abs(elem.top - top) < 1 || // top 相同
                                (elem.top - top < -1 && elem.top + elem.height - top > 1),
                        )
                        .sort((c1, c2) => c1.left - c2.left);

                    if (cellsRelated[0].left !== 0) {
                        cellsRelated[0].left = 0;
                    }

                    for (let i = 0; i < cellsRelated.length - 1; i++) {
                        const leftCell = cellsRelated[i];
                        const rightCell = cellsRelated[i + 1];
                        const diff = rightCell.left - (leftCell.left + leftCell.width);
                        const topDiff = rightCell.top - leftCell.top;
                        if (Math.abs(diff) > 1) {
                            if (topDiff < -1) {
                                // 右侧 top 在上方
                                leftCell.width += diff;
                            } else {
                                rightCell.left -= diff;
                                rightCell.width += diff;
                            }
                        }
                    }
                });

            Array.from(lefts)
                .sort((l1, l2) => l1 - l2)
                .forEach((left) => {
                    const cellsRelated = elements
                        .filter(
                            (elem) =>
                                Math.abs(elem.left - left) < 1 || // left 相同
                                (elem.left - left < -1 && elem.left + elem.width - left > 1),
                        )
                        .sort((c1, c2) => c1.top - c2.top);

                    if (cellsRelated[0].top !== 0) {
                        cellsRelated[0].top = 0;
                    }

                    for (let i = 0; i < cellsRelated.length - 1; i++) {
                        const topCell = cellsRelated[i];
                        const bottomCell = cellsRelated[i + 1];
                        const diff = bottomCell.top - (topCell.top + topCell.height);
                        const leftDiff = bottomCell.left - topCell.left;
                        if (Math.abs(diff) > 1) {
                            if (leftDiff < -1) {
                                // 右侧 top 在上方
                                topCell.height += diff;
                            } else {
                                bottomCell.top -= diff;
                                bottomCell.height += diff;
                            }
                        }
                    }
                });
        },
    },

    events: {
        'editor.collage.cell.remove'(element, index, direction) {
            // 最后一个 cell 不允许被删除
            if (this.model.elements.length <= this.options.minCellCount) return;

            let _index = -1;
            if (element === this.model) {
                _index = index;
            } else {
                // 第一个参数为 cell model 自身，则确认是否是本 collage 下的 cell
                _index = this.model.elements.findIndex((elem) => elem === element);
            }

            if (_index !== -1) {
                this.removeSubElement(_index, direction);
            }
        },

        'editor.collage.cell.add'(element, index, side, cell) {
            if (element === this.model) {
                this.addSubElement(index, side, cell);
            }
        },

        'editor.collage.cell.change'(element, index, props) {
            if (element === this.model) {
                this.changeSubelement(index, props);
            }
        },

        'editor.collage.cell.clear'(element, index) {
            if (element === this.model) {
                this.clearSubElement(index);
            }
        },

        'editor.collage.dropmode.active'(element) {
            if (element === this.model) {
                this.imageDropMode = true;
            }
        },

        'editor.collage.dropmode.unactive'(element) {
            if (element === this.model) {
                this.imageDropMode = false;
            }
        },
    },

    watch: {
        'model.width'() {
            this.updateSubElements();
        },

        'model.height'() {
            this.updateSubElements();
        },

        'model.itemRoundness'() {
            this.setItemRoundness();
            this.$events.$emit('editor.snapshot.create', 'change_element');
        },

        'model.gap'() {
            this.$events.$emit('editor.snapshot.create', 'change_element');
        },

        'model.outerGap'() {
            this.$events.$emit('editor.snapshot.create', 'change_element');
        },
    },

    created() {
        this.load();
        this.setItemRoundness();
    },

    mounted() {
        this.autoFixGrid();
    },
});
