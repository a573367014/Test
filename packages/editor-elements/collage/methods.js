import getRectsOfCells from '@gaoding/editor-framework/src/utils/collage/get-rects-of-cells';
import { relationOfLineInGrid } from '@gaoding/editor-framework/src/utils/collage/grid-helper';

export default {
    flipCell(dir) {
        const currentCell = this.getCurrentCell();
        if (!currentCell) return;

        this.$events.$emit('editor.cell.flip', currentCell, dir);
    },

    zoomCell(zoom) {
        const currentCell = this.getCurrentCell();
        if (!currentCell) return;

        this.$events.$emit('editor.cell.zoom', currentCell, zoom);
    },

    rotateCell(deg) {
        const currentCell = this.getCurrentCell();
        if (!currentCell) return;

        this.$events.$emit('editor.cell.rotate', currentCell, deg);
    },

    getRectOfCell(collage, index) {
        if (!collage || collage.type !== 'collage') {
            throw new Error('first argument should be collage element model');
        }

        return getRectsOfCells(collage.elements, collage.gap, collage.outerGap)[index];
    },

    getCurrentCell() {
        if (!this.currentElement || this.currentElement.type !== 'collage') return null;
        return this.currentElement.elements[this.currentElement.$cellIndex];
    },

    /**
     * resize current cell to given width and height,
     * will bisect width/height diff to both side if have affected cells
     *
     * @param param.width {Number} - final width
     * @param param.height {Number} - final height
     */
    resizeCurrentCell({ width, height }) {
        if (
            !this.currentElement ||
            this.currentElement.type !== 'collage' ||
            this.currentElement.$cellIndex === -1
        )
            return;

        const cellIndex = this.currentElement.$cellIndex;
        const currentCell = this.getCurrentCell();
        const diff = {
            x: width ? width - currentCell.width : 0,
            y: height ? height - currentCell.height : 0,
        };
        const grid = this.currentElement.elements.map((e) => ({
            left: e.left,
            top: e.top,
            width: e.width,
            height: e.height,
        }));

        const updateGrid = () => {
            grid.forEach((c) => {
                c.width = c._width || c.width;
                c.height = c._height || c.height;
                c.left = c._left || c.left;
                c.top = c._top || c.top;
            });
        };

        const cell = grid[cellIndex];
        const right = cell.left + cell.width;
        const bottom = cell.top + cell.height;
        if (diff.x !== 0) {
            const relationAtRight = relationOfLineInGrid(grid, [
                {
                    x: right,
                    y: cell.top,
                },
                {
                    x: right,
                    y: bottom,
                },
            ]);
            const relationAtLeft = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: cell.top,
                },
                {
                    x: cell.left,
                    y: bottom,
                },
            ]);

            if (relationAtRight.right.length > 0 && relationAtLeft.left.length > 0) {
                const leftDiff = Math.ceil(diff.x / 2);
                this.resizeCellFromLeft(grid, cell, leftDiff, relationAtLeft);
                updateGrid();
                this.resizeCellFromRight(grid, cell, diff.x - leftDiff, relationAtRight);
            } else if (relationAtRight.right.length > 0) {
                this.resizeCellFromRight(grid, cell, diff.x, relationAtRight);
            } else if (relationAtLeft.left.length > 0) {
                this.resizeCellFromLeft(grid, cell, diff.x, relationAtLeft);
            }
        }
        if (diff.y !== 0) {
            const relationAtBottom = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: bottom,
                },
                {
                    x: right,
                    y: bottom,
                },
            ]);
            const relationAtTop = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: cell.top,
                },
                {
                    x: right,
                    y: cell.top,
                },
            ]);

            if (relationAtBottom.bottom.length > 0 && relationAtTop.top.length > 0) {
                const topDiff = Math.ceil(diff.y / 2);
                this.resizeCellFromTop(grid, cell, topDiff, relationAtTop);
                updateGrid();
                this.resizeCellFromBottom(grid, cell, diff.y - topDiff, relationAtBottom);
            } else if (relationAtBottom.bottom.length > 0) {
                this.resizeCellFromBottom(grid, cell, diff.y, relationAtBottom);
            } else if (relationAtTop.top.length > 0) {
                this.resizeCellFromTop(grid, cell, diff.y, relationAtTop);
            }
        }

        updateGrid();
        this.currentElement.elements.forEach((elem, index) => {
            elem.left = grid[index].left;
            elem.top = grid[index].top;
            elem.width = grid[index].width;
            elem.height = grid[index].height;
        });
    },
    resizeCellFromRight(grid, cell, diff, relation) {
        if (!cell || !diff) return;

        if (!relation) {
            const right = cell.left + cell.width;
            const bottom = cell.top + cell.height;
            relation = relationOfLineInGrid(grid, [
                {
                    x: right,
                    y: cell.top,
                },
                {
                    x: right,
                    y: bottom,
                },
            ]);
        }

        cell._width = cell.width + diff;

        relation.right = relation.right.filter((c) => !c.source._width && !c.source._left);
        if (relation.right.length === 0) return;

        const exactRightCell = relation.right.find(
            (c) => Math.abs(c.top - cell.top) < 1 && Math.abs(c.height - cell.height) < 1,
        );

        if (exactRightCell) {
            exactRightCell.source._left = exactRightCell.source.left + diff;
            exactRightCell.source._width = exactRightCell.source.width - diff;
            return;
        }

        const line = {
            from: Infinity,
            to: -Infinity,
        };
        relation.right.forEach((c) => {
            line.from = Math.min(c.top, line.from);
            line.to = Math.max(c.top + c.height, line.to);

            c.source._width = c.source.width - diff;
            c.source._left = c.source.left + diff;
        });
        const rightX = relation.right[0].left;
        const lineRelation = relationOfLineInGrid(grid, [
            {
                x: rightX,
                y: line.from,
            },
            {
                x: rightX,
                y: line.to,
            },
        ]);
        // update left cells affected by adjustment of right cells
        lineRelation.left
            .filter((l) => !l.source._width && !l.source._left)
            .forEach((l) => {
                this.resizeCellFromRight(grid, l.source, diff);
            });
    },
    resizeCellFromLeft(grid, cell, diff, relation) {
        if (!cell || !diff) return;

        const bottom = cell.top + cell.height;
        if (!relation) {
            relation = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: cell.top,
                },
                {
                    x: cell.left,
                    y: bottom,
                },
            ]);
        }

        cell._width = cell.width + diff;
        cell._left = cell.left - diff;

        relation.left = relation.left.filter((c) => !c.source._width && !c.source._left);
        if (relation.left.length === 0) return;

        const exactLeftCell = relation.left.find(
            (c) => Math.abs(c.top - cell.top) < 1 && Math.abs(c.height - cell.height) < 1,
        );

        if (exactLeftCell) {
            exactLeftCell.source._width = exactLeftCell.source.width - diff;
            return;
        }

        const line = {
            from: Infinity,
            to: -Infinity,
        };
        relation.left.forEach((c) => {
            line.from = Math.min(c.top, line.from);
            line.to = Math.max(c.top + c.height, line.to);

            c.source._width = c.source.width - diff;
        });
        const leftX = relation.left[0].left + relation.left[0].width;
        const lineRelation = relationOfLineInGrid(grid, [
            {
                x: leftX,
                y: line.from,
            },
            {
                x: leftX,
                y: line.to,
            },
        ]);
        // update right cells affected by adjustment of left cells
        lineRelation.right
            .filter((l) => !l.source._width && !l.source._left)
            .forEach((l) => {
                this.resizeCellFromLeft(grid, l.source, diff);
            });
    },
    resizeCellFromBottom(grid, cell, diff, relation) {
        if (!cell || !diff) return;

        if (!relation) {
            const right = cell.left + cell.width;
            const bottom = cell.top + cell.height;
            relation = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: bottom,
                },
                {
                    x: right,
                    y: bottom,
                },
            ]);
        }

        cell._height = cell.height + diff;

        relation.bottom = relation.bottom.filter((c) => !c.source._height && !c.source._top);
        if (relation.bottom.length === 0) return;

        const exactBottomCell = relation.bottom.find(
            (c) => Math.abs(c.left - cell.left) < 1 && Math.abs(c.width - cell.width) < 1,
        );

        if (exactBottomCell) {
            exactBottomCell.source._top = exactBottomCell.source.top + diff;
            exactBottomCell.source._height = exactBottomCell.source.height - diff;
            return;
        }

        const line = {
            from: Infinity,
            to: -Infinity,
        };
        relation.bottom.forEach((c) => {
            line.from = Math.min(c.left, line.from);
            line.to = Math.max(c.left + c.width, line.to);

            c.source._height = c.source.height - diff;
            c.source._top = c.source.top + diff;
        });
        const bottomY = relation.bottom[0].top;
        const lineRelation = relationOfLineInGrid(grid, [
            {
                x: line.from,
                y: bottomY,
            },
            {
                x: line.to,
                y: bottomY,
            },
        ]);
        // update top cells affected by adjustment of bottom cells
        lineRelation.top
            .filter((c) => !c.source._height && !c.source._top)
            .forEach((c) => {
                this.resizeCellFromBottom(grid, c.source, diff);
            });
    },
    resizeCellFromTop(grid, cell, diff, relation) {
        if (!cell || !diff) return;

        const right = cell.left + cell.width;
        if (!relation) {
            relation = relationOfLineInGrid(grid, [
                {
                    x: cell.left,
                    y: cell.top,
                },
                {
                    x: right,
                    y: cell.top,
                },
            ]);
        }

        cell._height = cell.height + diff;
        cell._top = cell.top - diff;

        relation.top = relation.top.filter((c) => !c.source._height && !c.source._top);
        if (relation.top.length === 0) return;

        const exactTopCell = relation.top.find(
            (c) => Math.abs(c.left - cell.left) < 1 && Math.abs(c.width - cell.width) < 1,
        );

        if (exactTopCell) {
            exactTopCell.source._height = exactTopCell.source.height - diff;
            return;
        }

        const line = {
            from: Infinity,
            to: -Infinity,
        };
        relation.top.forEach((c) => {
            line.from = Math.min(c.left, line.from);
            line.to = Math.max(c.left + c.width, line.to);

            c.source._height = c.source.height - diff;
        });
        const topY = relation.top[0].top + relation.top[0].height;
        const lineRelation = relationOfLineInGrid(grid, [
            {
                x: line.from,
                y: topY,
            },
            {
                x: line.to,
                y: topY,
            },
        ]);
        // update bottom cells affected by adjustment of top cells
        lineRelation.bottom
            .filter((c) => !c.source._height && !c.source._top)
            .forEach((c) => {
                this.resizeCellFromTop(grid, c.source, diff);
            });
    },
};
