/**
 * EditorCollageEditor
 */
import $ from '@gaoding/editor-utils/zepto';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import tinycolor from 'tinycolor2';

import utils from '@gaoding/editor-framework/src/utils/utils';
import {
    relationOfLineInGrid,
    findNearestCellOfPoint,
    reLayoutGuideLine,
} from '@gaoding/editor-framework/src/utils/collage/grid-helper';
import getRectsOfCells from '@gaoding/editor-framework/src/utils/collage/get-rects-of-cells';

import EditorCollageEditorTpl from './collage-editor.html';

const MIN_CELL_SIZE = 30;

const doc = $(document);

export default {
    name: 'collage-editor',
    template: EditorCollageEditorTpl,

    props: ['global', 'model', 'options'],

    data() {
        return {
            draggingCell: null,
            draggingCellRenderModel: null,
            dragActiveCell: {
                index: -1,
                side: '',
            },
            currentDraggingLine: {
                index: -1,
                initIndex: -1,
                dir: '',
                otherLinesCache: null,
            },
            cellGhostVisible: false,
            cellGhostStyle: {},
            dropImgMode: false, // 图片拖拽模式
        };
    },

    computed: {
        rect() {
            const { model } = this;
            const { zoom } = this.global;

            return utils.getElementRect(model, zoom);
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
            return this.dropImgMode ? outerGap + 4 : outerGap;
        },
        gap() {
            const { gap = 0 } = this.model;
            return this.dropImgMode ? gap + 4 : gap;
        },
        /**
         * 计算子元素的辅助线
         */
        guideLines() {
            const gap = this.model.gap;
            return reLayoutGuideLine(this.renderElements, gap, Math.max(Math.min(3, gap / 2), 1));
        },
        dragGapPlaceholderStyle() {
            const { index, side } = this.dragActiveCell;
            if (index === -1 || side === '') {
                return {
                    display: 'none',
                };
            } else {
                const { zoom } = this.global;
                const gap = this.gap * zoom;
                const cell = this.renderElements[index];
                const dir = ['left', 'right'].indexOf(side) > -1 ? 'v' : 'h';
                const gapSize = 4;
                const width = dir === 'v' ? gapSize : cell.width * zoom;
                const height = dir === 'h' ? gapSize : cell.height * zoom;
                let left = cell.left * zoom;
                let top = cell.top * zoom;

                if (side === 'left') {
                    left -= (gap + gapSize) / 2;
                    left = Math.max(0, left);
                    if (left - this.outerGap > 0) {
                        left = Math.max(left, this.outerGap / 2);
                    } else {
                        left = Math.min(left, this.outerGap / 2);
                    }
                } else if (side === 'right') {
                    left += cell.width * zoom + (gap - gapSize) / 2;
                    left = Math.min(left, (this.model.width - this.outerGap / 2) * zoom);
                }
                if (side === 'top') {
                    top -= (gap + gapSize) / 2;
                    top = Math.max(0, top);
                    if (top - this.outerGap > 0) {
                        top = Math.max(top, this.outerGap / 2);
                    } else {
                        top = Math.min(top, this.outerGap / 2);
                    }
                } else if (side === 'bottom') {
                    top += cell.height * zoom + (gap - gapSize) / 2;
                    top = Math.min(top, (this.model.height - this.outerGap / 2) * zoom);
                }
                return {
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                };
            }
        },
    },

    methods: {
        lineStyle(line) {
            const { zoom } = this.global;
            const { from, to } = line;
            const width = to.x - from.x;
            const height = to.y - from.y;
            const lineSize = 10;
            const left = from.x;
            const top = from.y;

            return {
                left: (width !== 0 ? left * zoom : left * zoom - lineSize / 2) + 'px',
                top: (height !== 0 ? top * zoom : top * zoom - lineSize / 2) + 'px',
                width: width * zoom + 'px',
                height: height * zoom + 'px',
            };
        },
        initLineDrag(line, dir, e, index) {
            const self = this;
            const { model } = this;
            const zoom = this.global.zoom;
            this.currentDraggingLine = {
                index,
                initIndex: index,
                dir,
                otherLinesCache:
                    dir === 'h'
                        ? this.guideLines.horizontal.slice()
                        : this.guideLines.vertical.slice(),
            };

            if (e.button !== 0 || model.$draging) {
                return;
            }

            // 不能 preventDefault 会导致鼠标置于 iframe 外部无法响应事件
            // http://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
            // e.preventDefault();

            const { from, to } = line;
            const cells = this.renderElements.map((rect, index) => {
                const element = model.elements[index];
                return {
                    // 计算gap和outerGap后的rect
                    ...rect,
                    $element: {
                        model: element,
                        // 原始 rect
                        rect: utils.getElementRect(element),
                    },
                };
            });
            const relation = relationOfLineInGrid(cells, [from, to], 1);
            const drag = (this.drag = {
                dir: dir,
                rotate: model.rotate,
                height: model.height,
                width: model.width,
                centerX: model.width / 2,
                centerY: model.height / 2,
                relation: relation,
                line: line,
                left: to.x,
                top: to.y,
                pageX: e.pageX,
                pageY: e.pageY,
                points: utils.getPointsByElement(model),
                move(e) {
                    e.preventDefault();

                    const dx = e.pageX - drag.pageX;
                    const dy = e.pageY - drag.pageY;

                    const dxy = utils.getDxyByAngle(dx, dy, drag.rotate);

                    // 修正某些小数时产生误差
                    dxy.dx = Math.round(dxy.dx);
                    dxy.dy = Math.round(dxy.dy);

                    // Set with zoom
                    drag.dx = dxy.dx / zoom;
                    drag.dy = dxy.dy / zoom;

                    // 如果有旧线被合并，需要重新计算当前拖的线的 index
                    const lineCache = self.currentDraggingLine.otherLinesCache;
                    if (!lineCache) return;
                    if (dir === 'h' && lineCache.length > self.guideLines.horizontal.length) {
                        const changedIndex = lineCache.findIndex((l, index) => {
                            const newLine = self.guideLines.horizontal[index];
                            return (
                                !newLine || l.from.x !== newLine.from.x || l.to.x !== newLine.to.x
                            );
                        });
                        self.currentDraggingLine.index = changedIndex;
                    } else if (dir === 'v' && lineCache.length > self.guideLines.vertical.length) {
                        const changedIndex = lineCache.findIndex((l, index) => {
                            const newLine = self.guideLines.vertical[index];
                            return (
                                !newLine || l.from.y !== newLine.from.y || l.to.y !== newLine.to.y
                            );
                        });
                        self.currentDraggingLine.index = changedIndex;
                    } else {
                        self.currentDraggingLine.index = self.currentDraggingLine.initIndex;
                    }

                    // event
                    if (!drag.draging) {
                        drag.draging = true;

                        self.$events.$emit('collageEditor.lineDrag.active', model, drag);
                    }

                    self.$events.$emit('collageEditor.lineDrag.moving', drag, model);
                },
                cancel() {
                    doc.off('mousemove', drag.move);

                    // reset
                    self.drag = null;
                    model.$draging = false;
                    model.$customDragMove = false;
                    self.currentDraggingLine = {
                        index: -1,
                        initIndex: -1,
                        dir: '',
                        otherLinesCache: null,
                    };

                    // event
                    if (drag.draging) {
                        self.$events.$emit('collageEditor.lineDrag.inactive', model, drag);
                        drag.draging = false;
                    }
                },
            });

            model.$draging = true;
            model.$customDragMove = true;
            doc.on('mousemove', throttle(drag.move, 16));
            doc.one('mouseup', drag.cancel);
        },

        isCurrentDraggingLine(index, dir) {
            return this.currentDraggingLine.index === index && this.currentDraggingLine.dir === dir;
        },

        /**
         * 拼图内部元素拖拽事件初始化
         * @param {object} drag - 拖拽事件点
         */
        dragInit(drag) {
            const { editor } = this.$parent;
            const { elements } = this.model;

            if (editor) {
                const { x, y } = editor.pointFromEvent(drag);
                this.$drag = this.pointFromEvent(x, y);
                const nearestCell = findNearestCellOfPoint(this.renderElements, this.$drag, 0);
                if (nearestCell && nearestCell.side === 'inside') {
                    const cell = elements[nearestCell.index];
                    const renderModel = this.renderElements[nearestCell.index];
                    if (cell && cell.url) {
                        let imgWidth = cell.$width;
                        let imgHeight = cell.$height;
                        if (
                            cell.rotate === 90 ||
                            cell.rotate === 270 ||
                            cell.rotate === -90 ||
                            cell.rotate === -270
                        ) {
                            imgWidth = cell.$height;
                            imgHeight = cell.$width;
                        }
                        this.$cellCache = {
                            maxDx: Math.abs(
                                imgWidth / 2 - (renderModel.width * this.global.zoom) / 2,
                            ),
                            maxDy: Math.abs(
                                imgHeight / 2 - (renderModel.height * this.global.zoom) / 2,
                            ),
                            offset: clone(cell.offset),
                        };
                    }
                    const draggingCell = this.model.elements[nearestCell.index];
                    // 当内部元素有内容时才可以拖拽
                    if (draggingCell.url) {
                        this.$dragCellIndex = nearestCell.index;
                        this.draggingCell = this.model.elements[nearestCell.index];
                        this.draggingCellRenderModel = this.renderElements[nearestCell.index];
                        this.model.$cellIndex = nearestCell.index;
                    }
                }

                this.model.$customDragMove = !!this.draggingCell;
            }
        },

        /**
         * 拼图内元素拖拽事件处理
         * @param {number} dx - 与初始拖拽点的相对坐标x
         * @param {number} dy - 与初始拖拽点的相对坐标y
         */
        dragMoving(dx, dy) {
            const { $dragCellIndex, $drag, $nearestCell, gap, outerGap } = this;
            const { elements } = this.model;

            const rad = (this.model.rotate * Math.PI) / 180;
            let _dx = dx * Math.cos(rad) + dy * Math.sin(rad);
            let _dy = -dx * Math.sin(rad) + dy * Math.cos(rad);

            if ($dragCellIndex >= 0) {
                const nearestCell = findNearestCellOfPoint(
                    this.renderElements,
                    { x: $drag.x + _dx, y: $drag.y + _dy },
                    outerGap,
                );
                if ($nearestCell) {
                    this.$events.$emit('editor.collage.cell.unactive', this.model);
                }
                let dragOverVisible = true;
                if (nearestCell) {
                    const cell = elements[nearestCell.index];
                    if (nearestCell.side !== 'inside') {
                        this.$events.$emit(
                            'editor.collage.cell.active',
                            this.model,
                            nearestCell.index,
                            nearestCell.side,
                        );
                        dragOverVisible = false;
                    } else if (!this.cellGhostVisible && nearestCell.index === $dragCellIndex) {
                        const { offset, maxDx, maxDy } = this.$cellCache;
                        let _maxDx = maxDx;
                        let _maxDy = maxDy;
                        if (cell.rotate === 90 || cell.rotate === -270) {
                            _dx = cell.scaleX * dy;
                            _dy = cell.scaleY * -dx;
                            _maxDx = maxDy;
                            _maxDy = maxDx;
                        } else if (cell.rotate === 180 || cell.rotate === -180) {
                            _dx = cell.scaleX * -dx;
                            _dy = cell.scaleY * -dy;
                        } else if (cell.rotate === 270 || cell.rotate === -90) {
                            _dx = cell.scaleX * -dy;
                            _dy = cell.scaleY * dx;
                            _maxDx = maxDy;
                            _maxDy = maxDx;
                        } else {
                            _dx = cell.scaleX * dx;
                            _dy = cell.scaleY * dy;
                        }
                        if (Math.abs(offset.x + _dx) * this.global.zoom * cell.zoom <= _maxDx) {
                            cell.offset.x = offset.x + _dx / cell.zoom;
                        } else if (_dx > 0) {
                            cell.offset.x = _maxDx / (this.global.zoom * cell.zoom);
                        } else {
                            cell.offset.x = -_maxDx / (this.global.zoom * cell.zoom);
                        }
                        if (Math.abs(offset.y + _dy) * this.global.zoom * cell.zoom <= _maxDy) {
                            cell.offset.y = offset.y + _dy / cell.zoom;
                        } else if (_dy > 0) {
                            cell.offset.y = _maxDy / (this.global.zoom * cell.zoom);
                        } else {
                            cell.offset.y = -_maxDy / (this.global.zoom * cell.zoom);
                        }
                    }
                }
                this.$nearestCell = nearestCell;

                if (!this.draggingCell) {
                    this.cellGhostVisible = false;
                } else {
                    const ghostLeft = this.$drag.x + _dx;
                    const ghostTop = this.$drag.y + _dy;
                    const renderModel = this.draggingCellRenderModel;
                    const right = renderModel.width + renderModel.left;
                    const bottom = renderModel.height + renderModel.top;

                    if (!this.cellGhostVisible) {
                        this.cellGhostVisible =
                            ghostLeft - right > -gap / 2 ||
                            ghostLeft - renderModel.left < gap / 2 ||
                            ghostTop - renderModel.top < gap / 2 ||
                            ghostTop - bottom > -gap / 2;
                    } else {
                        const { imageWidth, imageHeight } = this.draggingCell;
                        const ratio = imageWidth / imageHeight;
                        const ghostWidth = 110;
                        const ghostHeight = ghostWidth / ratio;
                        this.cellGhostStyle = {
                            width: `${ghostWidth}px`,
                            left: `${(ghostLeft - ghostWidth / 2) * this.global.zoom}px`,
                            top: `${(ghostTop - ghostHeight / 2) * this.global.zoom}px`,
                        };

                        if (dragOverVisible) {
                            const cell = this.$nearestCell
                                ? this.model.elements[this.$nearestCell.index]
                                : null;
                            this.$events.$emit('editor.cell.dragover', cell);
                        } else {
                            this.$events.$emit('editor.cell.dragover', null);
                        }

                        this.$events.$emit('editor.collage.dropmode.active', this.model);
                    }
                }
            }
        },

        /**
         * 拼图内元素拖拽事件结束，删除缓存数据
         */
        dragEnd() {
            const { $dragCellIndex, $nearestCell } = this;
            const { elements } = this.model;
            if ($dragCellIndex >= 0) {
                this.$events.$emit('editor.collage.cell.unactive', this.model);
                const dragCell = elements[$dragCellIndex];
                if ($nearestCell) {
                    // TODO: 这里因为多个cell引起了多次的 draggger.inactive 的触发，导致增加多个历史记录
                    this.$events.$emit('editor.collage.cell.unactive', this.model);
                    if ($nearestCell.side !== 'inside') {
                        const newCell = cloneDeep(dragCell);
                        newCell.backgroundColor = '';
                        newCell.zoom = 1;
                        this.$events.$emit('editor.collage.cell.clear', this.model, $dragCellIndex);
                        this.$events.$emit(
                            'editor.collage.cell.add',
                            this.model,
                            $nearestCell.index,
                            $nearestCell.side,
                            newCell,
                        );
                    } else if ($nearestCell.index !== $dragCellIndex) {
                        const cell = elements[$nearestCell.index];
                        const { url, imageTransform, opacity, scaleX, scaleY, rotate } = dragCell;
                        dragCell.url = cell.url;
                        dragCell.imageTransform = cell.imageTransform;
                        dragCell.opacity = cell.opacity;
                        dragCell.scaleX = cell.scaleX;
                        dragCell.scaleY = cell.scaleY;
                        dragCell.rotate = cell.rotate;
                        dragCell.zoom = 1;

                        cell.url = url;
                        cell.imageTransform = imageTransform;
                        cell.opacity = opacity;
                        cell.scaleX = scaleX;
                        cell.scaleY = scaleY;
                        cell.rotate = rotate;
                        cell.zoom = 1;

                        // 选中目标单元格
                        this.model.$cellIndex = $nearestCell.index;
                    }
                }
            }

            if (this.model.$customDragMove) {
                this.draggingCell = null;
                this.cellGhostVisible = false;
                this.$events.$emit('editor.cell.dragover', null);
                this.$events.$emit('editor.collage.dropmode.unactive', this.model);

                delete this.$nearestCell;
                delete this.$targetCell;
                delete this.$dragInit;
                delete this.$cellCache;
                delete this.$dragCellIndex;
            }

            this.model.$customDragMove = false;
            delete this.$drag;
        },

        /**
         * 计算坐标x, y 在相对于本元素的位置
         * @param {number} pointX - 相对于父元素的坐标x
         * @param {number} pointY - 相对于父元素的坐标y
         * @returns {object} {x, y} - 相对于本元素的坐标
         */
        pointFromEvent(pointX, pointY) {
            const { width, height, rotate, left, top } = this.rect;
            const zoom = this.global.zoom;
            const pivotX = width / zoom / 2;
            const pivotY = height / zoom / 2;
            pointX = pointX - left / zoom - pivotX;
            pointY = -(pointY - top / zoom - pivotY);
            const point = utils.getRotationPoint(
                { x: pointX, y: pointY },
                (-(360 - rotate) / 180) * Math.PI,
            );
            return { x: point.x + pivotX, y: pivotY - point.y };
        },

        remove(index) {
            this.$events.$emit('editor.collage.cell.remove', this.model, index);
        },
        getCellStyle(renderModel, index) {
            const { zoom } = this.global;
            const { width, height, left, top } = renderModel;
            const cell = this.model.elements[index];
            const minSize = Math.min(width, height);
            return {
                left: `${left * zoom}px`,
                top: `${top * zoom}px`,
                width: `${width * zoom}px`,
                height: `${height * zoom}px`,
                borderRadius: `${(cell.borderRadius * minSize * zoom) / 2}px`,
                cursor: 'move',
            };
        },
        getCellRemoverStyle(renderModel, index) {
            const cellRemoveable = this.model.elements.length > this.options.minCellCount;

            const zoom = this.global.zoom;
            const cell = this.model.elements[index];
            const width = 16;
            const height = 16;
            const cellWidth = renderModel.width * zoom;
            const cellHeight = renderModel.height * zoom;
            let right = width - MIN_CELL_SIZE < 10 ? 6 : width - 6;
            let top = 6;

            const borderRadius = cell.borderRadius;
            const minSize = Math.min(renderModel.width, renderModel.height);
            const roundedWidth = ((borderRadius * minSize) / 2) * zoom;

            if (width > cellWidth) {
                right = (cellWidth - width) / 2;
            } else {
                right = right + roundedWidth / 4;
            }

            if (height > cellHeight) {
                top = (cellHeight - height) / 2;
            } else {
                top = top + roundedWidth / 4;
            }

            return {
                display: cellRemoveable || !!cell.url ? 'block' : 'none',
                right: `${right}px`,
                top: `${top}px`,
            };
        },
        removeImgOrCell(cell, index) {
            const element = this.model.elements[index];
            if (element.url) {
                element.url = '';
                this.$events.$emit('element.editApply', element, false);
            } else {
                if (this.$cellIndex === index) {
                    // 清楚当前选中状态
                    this.$cellIndex = -1;
                }
                this.$events.$emit('editor.collage.cell.remove', element);
            }
        },

        isCellBgDark(cell) {
            // 图片默认认为是暗色背景
            if (cell.url) return true;
            if (!cell.backgroundColor) return false;

            return tinycolor(cell.backgroundColor).isDark();
        },
        isClickOnRemover(target) {
            if (!target || target === this.$el) return false;

            if (
                typeof target.className === 'string' &&
                target.className.indexOf('cell--remover') > -1
            ) {
                return true;
            }
            return this.isClickOnRemover(target.parentElement);
        },
        onClick(event) {
            if (this.isClickOnRemover(event.target)) {
                return;
            }
            const { editor } = this.$parent;
            if (editor) {
                const { elements } = this.model;
                const { x, y } = editor.pointFromEvent(event);
                const elementBelowMouse = editor.elementFromPoint(x, y);
                if (!elementBelowMouse || elementBelowMouse.type !== 'collage') return;

                const point = this.pointFromEvent(x, y);
                const nearestCell = findNearestCellOfPoint(this.renderElements, point, 0);
                if (nearestCell && nearestCell.side === 'inside') {
                    const cell = elements[nearestCell.index];
                    if (!cell.url) {
                        this.$events.$emit('editor.contextmenu', event);
                    }
                    this.model.$cellIndex = nearestCell.index;
                    this.$events.$emit('editor.collage.cell.click', nearestCell);
                } else {
                    this.model.$cellIndex = -1;
                }
            }
        },
        onDblClick(event) {
            const { editor } = this.$parent;
            if (editor) {
                const { x, y } = editor.pointFromEvent(event);
                const point = this.pointFromEvent(x, y);
                const nearestCell = findNearestCellOfPoint(this.renderElements, point, 0);
                if (nearestCell && nearestCell.side === 'inside') {
                    if (this.options.hookImagePicker) {
                        // 外部上传，需要调用callback并传入图片上传后的url
                        this.$events.$emit(
                            'editor.collage.picker',
                            this.model.elements[nearestCell.index],
                            this.model,
                        );
                    } else {
                        editor.pickImage((image, url) => {
                            this.$events.$emit(
                                'editor.collage.cell.change',
                                this.model,
                                nearestCell.index,
                                { url, zoom: 1 },
                            );
                            this.$events.$emit('editor.edit.apply', this.model);
                            // 内部上传，发送事件通知外部，提供图片信息
                            this.$events.$emit(
                                'editor.collage.image.upload',
                                this.model,
                                nearestCell.index,
                                {
                                    url,
                                    width: image.naturalWidth,
                                    height: image.naturalHeight,
                                },
                            );
                        });
                    }
                    this.model.$cellIndex = nearestCell.index;
                } else {
                    this.model.$cellIndex = -1;
                }
            }
        },
    },

    events: {
        'base.dragStart'(model, event) {
            if (model === this.model) {
                this.dragInit(event);
            }
        },

        'base.dragMove'(drag, element) {
            if (element !== this.model) {
                return false;
            }
            let { dx, dy } = drag;

            if (element.$dragLimit) {
                // 在计算函数中缓存 sin 与 cos
                const rotateVector = utils.getVectorRotator(element.rotate);
                const { minLeft, maxLeft, minTop, maxTop, centerDeltaX, centerDeltaY } =
                    element.$getDragLimit();
                // 变换至旋转后坐标系
                // 带 _ 后缀的变量处于旋转后参考系中
                const [dx_, dy_] = rotateVector(dx, dy);
                // 最终偏移量 deltaX = 拖拽事件偏移量 dx + 两矩形中心点距离 centerDeltaX
                const [centerDeltaX_, centerDeltaY_] = rotateVector(centerDeltaX, centerDeltaY);
                const clampedDeltaX_ = utils.clamp(centerDeltaX_ + dx_, minLeft, maxLeft);
                const clampedDeltaY_ = utils.clamp(centerDeltaY_ + dy_, minTop, maxTop);
                // 将修正后偏移量反变换回原始坐标系
                const [clampedDeltaX, clampedDeltaY] = rotateVector(
                    clampedDeltaX_,
                    clampedDeltaY_,
                    true,
                );
                [dx, dy] = [clampedDeltaX - centerDeltaX, clampedDeltaY - centerDeltaY];
            }

            if (this.model.$customDragMove) {
                this.dragMoving(dx, dy);
            }
        },

        'base.dragEnd'(element) {
            if (element === this.model) {
                this.dragEnd();
            }
        },

        'collageEditor.lineDrag.active'(element, drag) {
            if (element === this.model) {
                this.$dragLineCache = cloneDeep(drag.line);
            }
        },

        'collageEditor.lineDrag.moving'(drag, element) {
            if (element === this.model && this.$dragLineCache) {
                const { from } = this.$dragLineCache;
                const { line, relation, dir, dx, dy } = drag;
                let { top, bottom, left, right } = relation;
                top = top.filter((c) => {
                    const right = c.left + c.width;
                    const diff = from.y - c.top - c.height;
                    // +/- 3 是为了避免细小的差距下，用户很难将间距调整到很小的插件，有时候1的差距也不好调整
                    const valid = diff < this.gap / 2 + 3 && diff > this.gap / 2 - 3;
                    // +/- 1 是为了避免小数差导致的误判
                    return valid && c.left >= line.from.x - 1 && right <= line.to.x + 1;
                });
                bottom = bottom.filter((c) => {
                    const right = c.left + c.width;
                    const diff = c.top - from.y;
                    // +/- 3 是为了避免细小的差距下，用户很难将间距调整到很小的插件，有时候1的差距也不好调整
                    const valid = diff < this.gap / 2 + 3 && diff > this.gap / 2 - 3;
                    // +/- 1 是为了避免小数差导致的误判
                    return valid && c.left >= line.from.x - 1 && right <= line.to.x + 1;
                });
                left = left.filter((c) => {
                    const bottom = c.top + c.height;
                    const diff = from.x - c.left - c.width;
                    const valid = diff < this.gap / 2 + 3 && diff > this.gap / 2 - 3;
                    return valid && c.top >= line.from.y - 1 && bottom <= line.to.y + 1;
                });
                right = right.filter((c) => {
                    const bottom = c.top + c.height;
                    const diff = c.left - from.x;
                    const valid = diff < this.gap / 2 + 3 && diff > this.gap / 2 - 3;
                    return valid && c.top >= line.from.y - 1 && bottom <= line.to.y + 1;
                });

                if (dir === 'h') {
                    const canResize = !(
                        top.some((cell) => cell.height + dy < MIN_CELL_SIZE) ||
                        bottom.some((cell) => cell.height - dy < MIN_CELL_SIZE)
                    );
                    if (canResize) {
                        line.from.y = from.y + dy;
                        line.to.y = from.y + dy;
                        top.forEach((cell) => {
                            cell.$element.model.height = cell.$element.rect.height + dy;
                        });
                        bottom.forEach((cell) => {
                            cell.$element.model.height = cell.$element.rect.height - dy;
                            cell.$element.model.top = cell.$element.rect.top + dy;
                        });
                    }
                } else if (dir === 'v') {
                    const canResize = !(
                        left.some((cell) => cell.width + dx < MIN_CELL_SIZE) ||
                        right.some((cell) => cell.width - dx < MIN_CELL_SIZE)
                    );
                    if (canResize) {
                        line.from.x = from.x + dx;
                        line.to.x = from.x + dx;
                        left.forEach((cell) => {
                            cell.$element.model.width = cell.$element.rect.width + dx;
                        });

                        right.forEach((cell) => {
                            cell.$element.model.left = cell.$element.rect.left + dx;
                            cell.$element.model.width = cell.$element.rect.width - dx;
                        });
                    }
                }
            }
        },

        'collageEditor.lineDrag.inactive'(element, drag) {
            if (element === this.model) {
                const { from, to } = drag.line;
                const preFrom = this.$dragLineCache.from;
                const preTo = this.$dragLineCache.to;
                if (
                    from.x !== preFrom.x ||
                    from.y !== preFrom.y ||
                    to.x !== preTo.x ||
                    to.y !== preTo.y
                ) {
                    this.$events.$emit('element.editApply', this.model);
                }

                delete this.$dragLineCache;
            }
        },
        'editor.collage.cell.unactive'(element) {
            if (this.model !== element) return;

            this.dragActiveCell = {
                index: -1,
                side: '',
            };
        },
        'editor.collage.cell.active'(element, index, side) {
            if (this.model !== element) return;

            this.dragActiveCell = {
                index,
                side,
            };
        },
        'editor.collage.dropmode.active'(element) {
            if (this.model !== element) return;

            this.dropImgMode = true;
        },
        'editor.collage.dropmode.unactive'(element) {
            if (this.model !== element) return;

            this.dropImgMode = false;
        },
        'editor.collage.drag.outside'(evt, cb) {
            if (!evt) return;
            const editor = this.$parent.$parent;
            editor.$events.$emit('editor.collage.dropmode.active', this.model);
            const point = this.pointFromEvent(editor.pointFromEvent(evt));
            const { outerGap, model, renderElements } = this;
            const elements = model.elements;
            const nearestCell = findNearestCellOfPoint(renderElements, point, outerGap);
            if (nearestCell) {
                if (nearestCell.side !== 'inside') {
                    this.$events.$emit(
                        'editor.collage.cell.active',
                        model,
                        nearestCell.index,
                        nearestCell.side,
                    );
                    this.$events.$emit('editor.cell.dragover', null);
                } else {
                    this.$events.$emit('editor.cell.dragover', elements[nearestCell.index]);
                    this.$events.$emit('editor.collage.cell.unactive', model);
                }
            } else {
                this.$events.$emit('editor.cell.dragover', null);
                this.$events.$emit('editor.collage.cell.unactive', model);
            }

            if (cb) cb(nearestCell);
        },
    },
};
