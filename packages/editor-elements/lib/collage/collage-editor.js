import _extends from "@babel/runtime/helpers/extends";

/**
 * EditorCollageEditor
 */
import $ from "@gaoding/editor-utils/lib/zepto";
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import tinycolor from 'tinycolor2';
import utils from "@gaoding/editor-framework/lib/utils/utils";
import { relationOfLineInGrid, findNearestCellOfPoint, reLayoutGuideLine } from "@gaoding/editor-framework/lib/utils/collage/grid-helper";
import getRectsOfCells from "@gaoding/editor-framework/lib/utils/collage/get-rects-of-cells";
import EditorCollageEditorTpl from "./collage-editor.html";
var MIN_CELL_SIZE = 30;
var doc = $(document);
export default {
  name: 'collage-editor',
  template: EditorCollageEditorTpl,
  props: ['global', 'model', 'options'],
  data: function data() {
    return {
      draggingCell: null,
      draggingCellRenderModel: null,
      dragActiveCell: {
        index: -1,
        side: ''
      },
      currentDraggingLine: {
        index: -1,
        initIndex: -1,
        dir: '',
        otherLinesCache: null
      },
      cellGhostVisible: false,
      cellGhostStyle: {},
      dropImgMode: false // 图片拖拽模式

    };
  },
  computed: {
    rect: function rect() {
      var model = this.model;
      var zoom = this.global.zoom;
      return utils.getElementRect(model, zoom);
    },
    renderElements: function renderElements() {
      // 不使用model数据来直接渲染数据是为了避免model经过多次gap和border改变导致的数据偏差叠加
      // 使用computed的数据可以保证原model不变，输出的render用model只会经过一次gap和border的改变
      var elements = this.model.elements;
      var gap = this.gap,
          outerGap = this.outerGap;
      return getRectsOfCells(elements.map(function (element) {
        return utils.getElementRect(element);
      }), gap, outerGap);
    },
    outerGap: function outerGap() {
      var _this$model$outerGap = this.model.outerGap,
          outerGap = _this$model$outerGap === void 0 ? 0 : _this$model$outerGap;
      return this.dropImgMode ? outerGap + 4 : outerGap;
    },
    gap: function gap() {
      var _this$model$gap = this.model.gap,
          gap = _this$model$gap === void 0 ? 0 : _this$model$gap;
      return this.dropImgMode ? gap + 4 : gap;
    },

    /**
     * 计算子元素的辅助线
     */
    guideLines: function guideLines() {
      var gap = this.model.gap;
      return reLayoutGuideLine(this.renderElements, gap, Math.max(Math.min(3, gap / 2), 1));
    },
    dragGapPlaceholderStyle: function dragGapPlaceholderStyle() {
      var _this$dragActiveCell = this.dragActiveCell,
          index = _this$dragActiveCell.index,
          side = _this$dragActiveCell.side;

      if (index === -1 || side === '') {
        return {
          display: 'none'
        };
      } else {
        var zoom = this.global.zoom;
        var gap = this.gap * zoom;
        var cell = this.renderElements[index];
        var dir = ['left', 'right'].indexOf(side) > -1 ? 'v' : 'h';
        var gapSize = 4;
        var width = dir === 'v' ? gapSize : cell.width * zoom;
        var height = dir === 'h' ? gapSize : cell.height * zoom;
        var left = cell.left * zoom;
        var top = cell.top * zoom;

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
          left: left + "px",
          top: top + "px",
          width: width + "px",
          height: height + "px"
        };
      }
    }
  },
  methods: {
    lineStyle: function lineStyle(line) {
      var zoom = this.global.zoom;
      var from = line.from,
          to = line.to;
      var width = to.x - from.x;
      var height = to.y - from.y;
      var lineSize = 10;
      var left = from.x;
      var top = from.y;
      return {
        left: (width !== 0 ? left * zoom : left * zoom - lineSize / 2) + 'px',
        top: (height !== 0 ? top * zoom : top * zoom - lineSize / 2) + 'px',
        width: width * zoom + 'px',
        height: height * zoom + 'px'
      };
    },
    initLineDrag: function initLineDrag(line, dir, e, index) {
      var self = this;
      var model = this.model;
      var zoom = this.global.zoom;
      this.currentDraggingLine = {
        index: index,
        initIndex: index,
        dir: dir,
        otherLinesCache: dir === 'h' ? this.guideLines.horizontal.slice() : this.guideLines.vertical.slice()
      };

      if (e.button !== 0 || model.$draging) {
        return;
      } // 不能 preventDefault 会导致鼠标置于 iframe 外部无法响应事件
      // http://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
      // e.preventDefault();


      var from = line.from,
          to = line.to;
      var cells = this.renderElements.map(function (rect, index) {
        var element = model.elements[index];
        return _extends({}, rect, {
          $element: {
            model: element,
            // 原始 rect
            rect: utils.getElementRect(element)
          }
        });
      });
      var relation = relationOfLineInGrid(cells, [from, to], 1);
      var drag = this.drag = {
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
        move: function move(e) {
          e.preventDefault();
          var dx = e.pageX - drag.pageX;
          var dy = e.pageY - drag.pageY;
          var dxy = utils.getDxyByAngle(dx, dy, drag.rotate); // 修正某些小数时产生误差

          dxy.dx = Math.round(dxy.dx);
          dxy.dy = Math.round(dxy.dy); // Set with zoom

          drag.dx = dxy.dx / zoom;
          drag.dy = dxy.dy / zoom; // 如果有旧线被合并，需要重新计算当前拖的线的 index

          var lineCache = self.currentDraggingLine.otherLinesCache;
          if (!lineCache) return;

          if (dir === 'h' && lineCache.length > self.guideLines.horizontal.length) {
            var changedIndex = lineCache.findIndex(function (l, index) {
              var newLine = self.guideLines.horizontal[index];
              return !newLine || l.from.x !== newLine.from.x || l.to.x !== newLine.to.x;
            });
            self.currentDraggingLine.index = changedIndex;
          } else if (dir === 'v' && lineCache.length > self.guideLines.vertical.length) {
            var _changedIndex = lineCache.findIndex(function (l, index) {
              var newLine = self.guideLines.vertical[index];
              return !newLine || l.from.y !== newLine.from.y || l.to.y !== newLine.to.y;
            });

            self.currentDraggingLine.index = _changedIndex;
          } else {
            self.currentDraggingLine.index = self.currentDraggingLine.initIndex;
          } // event


          if (!drag.draging) {
            drag.draging = true;
            self.$events.$emit('collageEditor.lineDrag.active', model, drag);
          }

          self.$events.$emit('collageEditor.lineDrag.moving', drag, model);
        },
        cancel: function cancel() {
          doc.off('mousemove', drag.move); // reset

          self.drag = null;
          model.$draging = false;
          model.$customDragMove = false;
          self.currentDraggingLine = {
            index: -1,
            initIndex: -1,
            dir: '',
            otherLinesCache: null
          }; // event

          if (drag.draging) {
            self.$events.$emit('collageEditor.lineDrag.inactive', model, drag);
            drag.draging = false;
          }
        }
      };
      model.$draging = true;
      model.$customDragMove = true;
      doc.on('mousemove', throttle(drag.move, 16));
      doc.one('mouseup', drag.cancel);
    },
    isCurrentDraggingLine: function isCurrentDraggingLine(index, dir) {
      return this.currentDraggingLine.index === index && this.currentDraggingLine.dir === dir;
    },

    /**
     * 拼图内部元素拖拽事件初始化
     * @param {object} drag - 拖拽事件点
     */
    dragInit: function dragInit(drag) {
      var editor = this.$parent.editor;
      var elements = this.model.elements;

      if (editor) {
        var _editor$pointFromEven = editor.pointFromEvent(drag),
            x = _editor$pointFromEven.x,
            y = _editor$pointFromEven.y;

        this.$drag = this.pointFromEvent(x, y);
        var nearestCell = findNearestCellOfPoint(this.renderElements, this.$drag, 0);

        if (nearestCell && nearestCell.side === 'inside') {
          var cell = elements[nearestCell.index];
          var renderModel = this.renderElements[nearestCell.index];

          if (cell && cell.url) {
            var imgWidth = cell.$width;
            var imgHeight = cell.$height;

            if (cell.rotate === 90 || cell.rotate === 270 || cell.rotate === -90 || cell.rotate === -270) {
              imgWidth = cell.$height;
              imgHeight = cell.$width;
            }

            this.$cellCache = {
              maxDx: Math.abs(imgWidth / 2 - renderModel.width * this.global.zoom / 2),
              maxDy: Math.abs(imgHeight / 2 - renderModel.height * this.global.zoom / 2),
              offset: clone(cell.offset)
            };
          }

          var draggingCell = this.model.elements[nearestCell.index]; // 当内部元素有内容时才可以拖拽

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
    dragMoving: function dragMoving(dx, dy) {
      var $dragCellIndex = this.$dragCellIndex,
          $drag = this.$drag,
          $nearestCell = this.$nearestCell,
          gap = this.gap,
          outerGap = this.outerGap;
      var elements = this.model.elements;
      var rad = this.model.rotate * Math.PI / 180;

      var _dx = dx * Math.cos(rad) + dy * Math.sin(rad);

      var _dy = -dx * Math.sin(rad) + dy * Math.cos(rad);

      if ($dragCellIndex >= 0) {
        var nearestCell = findNearestCellOfPoint(this.renderElements, {
          x: $drag.x + _dx,
          y: $drag.y + _dy
        }, outerGap);

        if ($nearestCell) {
          this.$events.$emit('editor.collage.cell.unactive', this.model);
        }

        var dragOverVisible = true;

        if (nearestCell) {
          var cell = elements[nearestCell.index];

          if (nearestCell.side !== 'inside') {
            this.$events.$emit('editor.collage.cell.active', this.model, nearestCell.index, nearestCell.side);
            dragOverVisible = false;
          } else if (!this.cellGhostVisible && nearestCell.index === $dragCellIndex) {
            var _this$$cellCache = this.$cellCache,
                offset = _this$$cellCache.offset,
                maxDx = _this$$cellCache.maxDx,
                maxDy = _this$$cellCache.maxDy;
            var _maxDx = maxDx;
            var _maxDy = maxDy;

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
          var ghostLeft = this.$drag.x + _dx;
          var ghostTop = this.$drag.y + _dy;
          var renderModel = this.draggingCellRenderModel;
          var right = renderModel.width + renderModel.left;
          var bottom = renderModel.height + renderModel.top;

          if (!this.cellGhostVisible) {
            this.cellGhostVisible = ghostLeft - right > -gap / 2 || ghostLeft - renderModel.left < gap / 2 || ghostTop - renderModel.top < gap / 2 || ghostTop - bottom > -gap / 2;
          } else {
            var _this$draggingCell = this.draggingCell,
                imageWidth = _this$draggingCell.imageWidth,
                imageHeight = _this$draggingCell.imageHeight;
            var ratio = imageWidth / imageHeight;
            var ghostWidth = 110;
            var ghostHeight = ghostWidth / ratio;
            this.cellGhostStyle = {
              width: ghostWidth + "px",
              left: (ghostLeft - ghostWidth / 2) * this.global.zoom + "px",
              top: (ghostTop - ghostHeight / 2) * this.global.zoom + "px"
            };

            if (dragOverVisible) {
              var _cell = this.$nearestCell ? this.model.elements[this.$nearestCell.index] : null;

              this.$events.$emit('editor.cell.dragover', _cell);
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
    dragEnd: function dragEnd() {
      var $dragCellIndex = this.$dragCellIndex,
          $nearestCell = this.$nearestCell;
      var elements = this.model.elements;

      if ($dragCellIndex >= 0) {
        this.$events.$emit('editor.collage.cell.unactive', this.model);
        var dragCell = elements[$dragCellIndex];

        if ($nearestCell) {
          // TODO: 这里因为多个cell引起了多次的 draggger.inactive 的触发，导致增加多个历史记录
          this.$events.$emit('editor.collage.cell.unactive', this.model);

          if ($nearestCell.side !== 'inside') {
            var newCell = cloneDeep(dragCell);
            newCell.backgroundColor = '';
            newCell.zoom = 1;
            this.$events.$emit('editor.collage.cell.clear', this.model, $dragCellIndex);
            this.$events.$emit('editor.collage.cell.add', this.model, $nearestCell.index, $nearestCell.side, newCell);
          } else if ($nearestCell.index !== $dragCellIndex) {
            var cell = elements[$nearestCell.index];
            var url = dragCell.url,
                imageTransform = dragCell.imageTransform,
                opacity = dragCell.opacity,
                scaleX = dragCell.scaleX,
                scaleY = dragCell.scaleY,
                rotate = dragCell.rotate;
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
            cell.zoom = 1; // 选中目标单元格

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
    pointFromEvent: function pointFromEvent(pointX, pointY) {
      var _this$rect = this.rect,
          width = _this$rect.width,
          height = _this$rect.height,
          rotate = _this$rect.rotate,
          left = _this$rect.left,
          top = _this$rect.top;
      var zoom = this.global.zoom;
      var pivotX = width / zoom / 2;
      var pivotY = height / zoom / 2;
      pointX = pointX - left / zoom - pivotX;
      pointY = -(pointY - top / zoom - pivotY);
      var point = utils.getRotationPoint({
        x: pointX,
        y: pointY
      }, -(360 - rotate) / 180 * Math.PI);
      return {
        x: point.x + pivotX,
        y: pivotY - point.y
      };
    },
    remove: function remove(index) {
      this.$events.$emit('editor.collage.cell.remove', this.model, index);
    },
    getCellStyle: function getCellStyle(renderModel, index) {
      var zoom = this.global.zoom;
      var width = renderModel.width,
          height = renderModel.height,
          left = renderModel.left,
          top = renderModel.top;
      var cell = this.model.elements[index];
      var minSize = Math.min(width, height);
      return {
        left: left * zoom + "px",
        top: top * zoom + "px",
        width: width * zoom + "px",
        height: height * zoom + "px",
        borderRadius: cell.borderRadius * minSize * zoom / 2 + "px",
        cursor: 'move'
      };
    },
    getCellRemoverStyle: function getCellRemoverStyle(renderModel, index) {
      var cellRemoveable = this.model.elements.length > this.options.minCellCount;
      var zoom = this.global.zoom;
      var cell = this.model.elements[index];
      var width = 16;
      var height = 16;
      var cellWidth = renderModel.width * zoom;
      var cellHeight = renderModel.height * zoom;
      var right = width - MIN_CELL_SIZE < 10 ? 6 : width - 6;
      var top = 6;
      var borderRadius = cell.borderRadius;
      var minSize = Math.min(renderModel.width, renderModel.height);
      var roundedWidth = borderRadius * minSize / 2 * zoom;

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
        right: right + "px",
        top: top + "px"
      };
    },
    removeImgOrCell: function removeImgOrCell(cell, index) {
      var element = this.model.elements[index];

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
    isCellBgDark: function isCellBgDark(cell) {
      // 图片默认认为是暗色背景
      if (cell.url) return true;
      if (!cell.backgroundColor) return false;
      return tinycolor(cell.backgroundColor).isDark();
    },
    isClickOnRemover: function isClickOnRemover(target) {
      if (!target || target === this.$el) return false;

      if (typeof target.className === 'string' && target.className.indexOf('cell--remover') > -1) {
        return true;
      }

      return this.isClickOnRemover(target.parentElement);
    },
    onClick: function onClick(event) {
      if (this.isClickOnRemover(event.target)) {
        return;
      }

      var editor = this.$parent.editor;

      if (editor) {
        var elements = this.model.elements;

        var _editor$pointFromEven2 = editor.pointFromEvent(event),
            x = _editor$pointFromEven2.x,
            y = _editor$pointFromEven2.y;

        var elementBelowMouse = editor.elementFromPoint(x, y);
        if (!elementBelowMouse || elementBelowMouse.type !== 'collage') return;
        var point = this.pointFromEvent(x, y);
        var nearestCell = findNearestCellOfPoint(this.renderElements, point, 0);

        if (nearestCell && nearestCell.side === 'inside') {
          var cell = elements[nearestCell.index];

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
    onDblClick: function onDblClick(event) {
      var _this = this;

      var editor = this.$parent.editor;

      if (editor) {
        var _editor$pointFromEven3 = editor.pointFromEvent(event),
            x = _editor$pointFromEven3.x,
            y = _editor$pointFromEven3.y;

        var point = this.pointFromEvent(x, y);
        var nearestCell = findNearestCellOfPoint(this.renderElements, point, 0);

        if (nearestCell && nearestCell.side === 'inside') {
          if (this.options.hookImagePicker) {
            // 外部上传，需要调用callback并传入图片上传后的url
            this.$events.$emit('editor.collage.picker', this.model.elements[nearestCell.index], this.model);
          } else {
            editor.pickImage(function (image, url) {
              _this.$events.$emit('editor.collage.cell.change', _this.model, nearestCell.index, {
                url: url,
                zoom: 1
              });

              _this.$events.$emit('editor.edit.apply', _this.model); // 内部上传，发送事件通知外部，提供图片信息


              _this.$events.$emit('editor.collage.image.upload', _this.model, nearestCell.index, {
                url: url,
                width: image.naturalWidth,
                height: image.naturalHeight
              });
            });
          }

          this.model.$cellIndex = nearestCell.index;
        } else {
          this.model.$cellIndex = -1;
        }
      }
    }
  },
  events: {
    'base.dragStart': function baseDragStart(model, event) {
      if (model === this.model) {
        this.dragInit(event);
      }
    },
    'base.dragMove': function baseDragMove(drag, element) {
      if (element !== this.model) {
        return false;
      }

      var dx = drag.dx,
          dy = drag.dy;

      if (element.$dragLimit) {
        // 在计算函数中缓存 sin 与 cos
        var rotateVector = utils.getVectorRotator(element.rotate);

        var _element$$getDragLimi = element.$getDragLimit(),
            minLeft = _element$$getDragLimi.minLeft,
            maxLeft = _element$$getDragLimi.maxLeft,
            minTop = _element$$getDragLimi.minTop,
            maxTop = _element$$getDragLimi.maxTop,
            centerDeltaX = _element$$getDragLimi.centerDeltaX,
            centerDeltaY = _element$$getDragLimi.centerDeltaY; // 变换至旋转后坐标系
        // 带 _ 后缀的变量处于旋转后参考系中


        var _rotateVector = rotateVector(dx, dy),
            dx_ = _rotateVector[0],
            dy_ = _rotateVector[1]; // 最终偏移量 deltaX = 拖拽事件偏移量 dx + 两矩形中心点距离 centerDeltaX


        var _rotateVector2 = rotateVector(centerDeltaX, centerDeltaY),
            centerDeltaX_ = _rotateVector2[0],
            centerDeltaY_ = _rotateVector2[1];

        var clampedDeltaX_ = utils.clamp(centerDeltaX_ + dx_, minLeft, maxLeft);
        var clampedDeltaY_ = utils.clamp(centerDeltaY_ + dy_, minTop, maxTop); // 将修正后偏移量反变换回原始坐标系

        var _rotateVector3 = rotateVector(clampedDeltaX_, clampedDeltaY_, true),
            clampedDeltaX = _rotateVector3[0],
            clampedDeltaY = _rotateVector3[1];

        dx = clampedDeltaX - centerDeltaX;
        dy = clampedDeltaY - centerDeltaY;
      }

      if (this.model.$customDragMove) {
        this.dragMoving(dx, dy);
      }
    },
    'base.dragEnd': function baseDragEnd(element) {
      if (element === this.model) {
        this.dragEnd();
      }
    },
    'collageEditor.lineDrag.active': function collageEditorLineDragActive(element, drag) {
      if (element === this.model) {
        this.$dragLineCache = cloneDeep(drag.line);
      }
    },
    'collageEditor.lineDrag.moving': function collageEditorLineDragMoving(drag, element) {
      var _this2 = this;

      if (element === this.model && this.$dragLineCache) {
        var from = this.$dragLineCache.from;
        var line = drag.line,
            relation = drag.relation,
            dir = drag.dir,
            dx = drag.dx,
            dy = drag.dy;
        var top = relation.top,
            bottom = relation.bottom,
            left = relation.left,
            right = relation.right;
        top = top.filter(function (c) {
          var right = c.left + c.width;
          var diff = from.y - c.top - c.height; // +/- 3 是为了避免细小的差距下，用户很难将间距调整到很小的插件，有时候1的差距也不好调整

          var valid = diff < _this2.gap / 2 + 3 && diff > _this2.gap / 2 - 3; // +/- 1 是为了避免小数差导致的误判

          return valid && c.left >= line.from.x - 1 && right <= line.to.x + 1;
        });
        bottom = bottom.filter(function (c) {
          var right = c.left + c.width;
          var diff = c.top - from.y; // +/- 3 是为了避免细小的差距下，用户很难将间距调整到很小的插件，有时候1的差距也不好调整

          var valid = diff < _this2.gap / 2 + 3 && diff > _this2.gap / 2 - 3; // +/- 1 是为了避免小数差导致的误判

          return valid && c.left >= line.from.x - 1 && right <= line.to.x + 1;
        });
        left = left.filter(function (c) {
          var bottom = c.top + c.height;
          var diff = from.x - c.left - c.width;
          var valid = diff < _this2.gap / 2 + 3 && diff > _this2.gap / 2 - 3;
          return valid && c.top >= line.from.y - 1 && bottom <= line.to.y + 1;
        });
        right = right.filter(function (c) {
          var bottom = c.top + c.height;
          var diff = c.left - from.x;
          var valid = diff < _this2.gap / 2 + 3 && diff > _this2.gap / 2 - 3;
          return valid && c.top >= line.from.y - 1 && bottom <= line.to.y + 1;
        });

        if (dir === 'h') {
          var canResize = !(top.some(function (cell) {
            return cell.height + dy < MIN_CELL_SIZE;
          }) || bottom.some(function (cell) {
            return cell.height - dy < MIN_CELL_SIZE;
          }));

          if (canResize) {
            line.from.y = from.y + dy;
            line.to.y = from.y + dy;
            top.forEach(function (cell) {
              cell.$element.model.height = cell.$element.rect.height + dy;
            });
            bottom.forEach(function (cell) {
              cell.$element.model.height = cell.$element.rect.height - dy;
              cell.$element.model.top = cell.$element.rect.top + dy;
            });
          }
        } else if (dir === 'v') {
          var _canResize = !(left.some(function (cell) {
            return cell.width + dx < MIN_CELL_SIZE;
          }) || right.some(function (cell) {
            return cell.width - dx < MIN_CELL_SIZE;
          }));

          if (_canResize) {
            line.from.x = from.x + dx;
            line.to.x = from.x + dx;
            left.forEach(function (cell) {
              cell.$element.model.width = cell.$element.rect.width + dx;
            });
            right.forEach(function (cell) {
              cell.$element.model.left = cell.$element.rect.left + dx;
              cell.$element.model.width = cell.$element.rect.width - dx;
            });
          }
        }
      }
    },
    'collageEditor.lineDrag.inactive': function collageEditorLineDragInactive(element, drag) {
      if (element === this.model) {
        var _drag$line = drag.line,
            from = _drag$line.from,
            to = _drag$line.to;
        var preFrom = this.$dragLineCache.from;
        var preTo = this.$dragLineCache.to;

        if (from.x !== preFrom.x || from.y !== preFrom.y || to.x !== preTo.x || to.y !== preTo.y) {
          this.$events.$emit('element.editApply', this.model);
        }

        delete this.$dragLineCache;
      }
    },
    'editor.collage.cell.unactive': function editorCollageCellUnactive(element) {
      if (this.model !== element) return;
      this.dragActiveCell = {
        index: -1,
        side: ''
      };
    },
    'editor.collage.cell.active': function editorCollageCellActive(element, index, side) {
      if (this.model !== element) return;
      this.dragActiveCell = {
        index: index,
        side: side
      };
    },
    'editor.collage.dropmode.active': function editorCollageDropmodeActive(element) {
      if (this.model !== element) return;
      this.dropImgMode = true;
    },
    'editor.collage.dropmode.unactive': function editorCollageDropmodeUnactive(element) {
      if (this.model !== element) return;
      this.dropImgMode = false;
    },
    'editor.collage.drag.outside': function editorCollageDragOutside(evt, cb) {
      if (!evt) return;
      var editor = this.$parent.$parent;
      editor.$events.$emit('editor.collage.dropmode.active', this.model);
      var point = this.pointFromEvent(editor.pointFromEvent(evt));
      var outerGap = this.outerGap,
          model = this.model,
          renderElements = this.renderElements;
      var elements = model.elements;
      var nearestCell = findNearestCellOfPoint(renderElements, point, outerGap);

      if (nearestCell) {
        if (nearestCell.side !== 'inside') {
          this.$events.$emit('editor.collage.cell.active', model, nearestCell.index, nearestCell.side);
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
    }
  }
};