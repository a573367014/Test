import getRectsOfCells from "@gaoding/editor-framework/lib/utils/collage/get-rects-of-cells";
import { relationOfLineInGrid } from "@gaoding/editor-framework/lib/utils/collage/grid-helper";
export default {
  flipCell: function flipCell(dir) {
    var currentCell = this.getCurrentCell();
    if (!currentCell) return;
    this.$events.$emit('editor.cell.flip', currentCell, dir);
  },
  zoomCell: function zoomCell(zoom) {
    var currentCell = this.getCurrentCell();
    if (!currentCell) return;
    this.$events.$emit('editor.cell.zoom', currentCell, zoom);
  },
  rotateCell: function rotateCell(deg) {
    var currentCell = this.getCurrentCell();
    if (!currentCell) return;
    this.$events.$emit('editor.cell.rotate', currentCell, deg);
  },
  getRectOfCell: function getRectOfCell(collage, index) {
    if (!collage || collage.type !== 'collage') {
      throw new Error('first argument should be collage element model');
    }

    return getRectsOfCells(collage.elements, collage.gap, collage.outerGap)[index];
  },
  getCurrentCell: function getCurrentCell() {
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
  resizeCurrentCell: function resizeCurrentCell(_ref) {
    var width = _ref.width,
        height = _ref.height;
    if (!this.currentElement || this.currentElement.type !== 'collage' || this.currentElement.$cellIndex === -1) return;
    var cellIndex = this.currentElement.$cellIndex;
    var currentCell = this.getCurrentCell();
    var diff = {
      x: width ? width - currentCell.width : 0,
      y: height ? height - currentCell.height : 0
    };
    var grid = this.currentElement.elements.map(function (e) {
      return {
        left: e.left,
        top: e.top,
        width: e.width,
        height: e.height
      };
    });

    var updateGrid = function updateGrid() {
      grid.forEach(function (c) {
        c.width = c._width || c.width;
        c.height = c._height || c.height;
        c.left = c._left || c.left;
        c.top = c._top || c.top;
      });
    };

    var cell = grid[cellIndex];
    var right = cell.left + cell.width;
    var bottom = cell.top + cell.height;

    if (diff.x !== 0) {
      var relationAtRight = relationOfLineInGrid(grid, [{
        x: right,
        y: cell.top
      }, {
        x: right,
        y: bottom
      }]);
      var relationAtLeft = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: cell.top
      }, {
        x: cell.left,
        y: bottom
      }]);

      if (relationAtRight.right.length > 0 && relationAtLeft.left.length > 0) {
        var leftDiff = Math.ceil(diff.x / 2);
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
      var relationAtBottom = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: bottom
      }, {
        x: right,
        y: bottom
      }]);
      var relationAtTop = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: cell.top
      }, {
        x: right,
        y: cell.top
      }]);

      if (relationAtBottom.bottom.length > 0 && relationAtTop.top.length > 0) {
        var topDiff = Math.ceil(diff.y / 2);
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
    this.currentElement.elements.forEach(function (elem, index) {
      elem.left = grid[index].left;
      elem.top = grid[index].top;
      elem.width = grid[index].width;
      elem.height = grid[index].height;
    });
  },
  resizeCellFromRight: function resizeCellFromRight(grid, cell, diff, relation) {
    var _this = this;

    if (!cell || !diff) return;

    if (!relation) {
      var right = cell.left + cell.width;
      var bottom = cell.top + cell.height;
      relation = relationOfLineInGrid(grid, [{
        x: right,
        y: cell.top
      }, {
        x: right,
        y: bottom
      }]);
    }

    cell._width = cell.width + diff;
    relation.right = relation.right.filter(function (c) {
      return !c.source._width && !c.source._left;
    });
    if (relation.right.length === 0) return;
    var exactRightCell = relation.right.find(function (c) {
      return Math.abs(c.top - cell.top) < 1 && Math.abs(c.height - cell.height) < 1;
    });

    if (exactRightCell) {
      exactRightCell.source._left = exactRightCell.source.left + diff;
      exactRightCell.source._width = exactRightCell.source.width - diff;
      return;
    }

    var line = {
      from: Infinity,
      to: -Infinity
    };
    relation.right.forEach(function (c) {
      line.from = Math.min(c.top, line.from);
      line.to = Math.max(c.top + c.height, line.to);
      c.source._width = c.source.width - diff;
      c.source._left = c.source.left + diff;
    });
    var rightX = relation.right[0].left;
    var lineRelation = relationOfLineInGrid(grid, [{
      x: rightX,
      y: line.from
    }, {
      x: rightX,
      y: line.to
    }]); // update left cells affected by adjustment of right cells

    lineRelation.left.filter(function (l) {
      return !l.source._width && !l.source._left;
    }).forEach(function (l) {
      _this.resizeCellFromRight(grid, l.source, diff);
    });
  },
  resizeCellFromLeft: function resizeCellFromLeft(grid, cell, diff, relation) {
    var _this2 = this;

    if (!cell || !diff) return;
    var bottom = cell.top + cell.height;

    if (!relation) {
      relation = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: cell.top
      }, {
        x: cell.left,
        y: bottom
      }]);
    }

    cell._width = cell.width + diff;
    cell._left = cell.left - diff;
    relation.left = relation.left.filter(function (c) {
      return !c.source._width && !c.source._left;
    });
    if (relation.left.length === 0) return;
    var exactLeftCell = relation.left.find(function (c) {
      return Math.abs(c.top - cell.top) < 1 && Math.abs(c.height - cell.height) < 1;
    });

    if (exactLeftCell) {
      exactLeftCell.source._width = exactLeftCell.source.width - diff;
      return;
    }

    var line = {
      from: Infinity,
      to: -Infinity
    };
    relation.left.forEach(function (c) {
      line.from = Math.min(c.top, line.from);
      line.to = Math.max(c.top + c.height, line.to);
      c.source._width = c.source.width - diff;
    });
    var leftX = relation.left[0].left + relation.left[0].width;
    var lineRelation = relationOfLineInGrid(grid, [{
      x: leftX,
      y: line.from
    }, {
      x: leftX,
      y: line.to
    }]); // update right cells affected by adjustment of left cells

    lineRelation.right.filter(function (l) {
      return !l.source._width && !l.source._left;
    }).forEach(function (l) {
      _this2.resizeCellFromLeft(grid, l.source, diff);
    });
  },
  resizeCellFromBottom: function resizeCellFromBottom(grid, cell, diff, relation) {
    var _this3 = this;

    if (!cell || !diff) return;

    if (!relation) {
      var right = cell.left + cell.width;
      var bottom = cell.top + cell.height;
      relation = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: bottom
      }, {
        x: right,
        y: bottom
      }]);
    }

    cell._height = cell.height + diff;
    relation.bottom = relation.bottom.filter(function (c) {
      return !c.source._height && !c.source._top;
    });
    if (relation.bottom.length === 0) return;
    var exactBottomCell = relation.bottom.find(function (c) {
      return Math.abs(c.left - cell.left) < 1 && Math.abs(c.width - cell.width) < 1;
    });

    if (exactBottomCell) {
      exactBottomCell.source._top = exactBottomCell.source.top + diff;
      exactBottomCell.source._height = exactBottomCell.source.height - diff;
      return;
    }

    var line = {
      from: Infinity,
      to: -Infinity
    };
    relation.bottom.forEach(function (c) {
      line.from = Math.min(c.left, line.from);
      line.to = Math.max(c.left + c.width, line.to);
      c.source._height = c.source.height - diff;
      c.source._top = c.source.top + diff;
    });
    var bottomY = relation.bottom[0].top;
    var lineRelation = relationOfLineInGrid(grid, [{
      x: line.from,
      y: bottomY
    }, {
      x: line.to,
      y: bottomY
    }]); // update top cells affected by adjustment of bottom cells

    lineRelation.top.filter(function (c) {
      return !c.source._height && !c.source._top;
    }).forEach(function (c) {
      _this3.resizeCellFromBottom(grid, c.source, diff);
    });
  },
  resizeCellFromTop: function resizeCellFromTop(grid, cell, diff, relation) {
    var _this4 = this;

    if (!cell || !diff) return;
    var right = cell.left + cell.width;

    if (!relation) {
      relation = relationOfLineInGrid(grid, [{
        x: cell.left,
        y: cell.top
      }, {
        x: right,
        y: cell.top
      }]);
    }

    cell._height = cell.height + diff;
    cell._top = cell.top - diff;
    relation.top = relation.top.filter(function (c) {
      return !c.source._height && !c.source._top;
    });
    if (relation.top.length === 0) return;
    var exactTopCell = relation.top.find(function (c) {
      return Math.abs(c.left - cell.left) < 1 && Math.abs(c.width - cell.width) < 1;
    });

    if (exactTopCell) {
      exactTopCell.source._height = exactTopCell.source.height - diff;
      return;
    }

    var line = {
      from: Infinity,
      to: -Infinity
    };
    relation.top.forEach(function (c) {
      line.from = Math.min(c.left, line.from);
      line.to = Math.max(c.left + c.width, line.to);
      c.source._height = c.source.height - diff;
    });
    var topY = relation.top[0].top + relation.top[0].height;
    var lineRelation = relationOfLineInGrid(grid, [{
      x: line.from,
      y: topY
    }, {
      x: line.to,
      y: topY
    }]); // update bottom cells affected by adjustment of top cells

    lineRelation.bottom.filter(function (c) {
      return !c.source._height && !c.source._top;
    }).forEach(function (c) {
      _this4.resizeCellFromTop(grid, c.source, diff);
    });
  }
};