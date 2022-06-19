import _extends from "@babel/runtime/helpers/extends";
import _merge from "lodash/merge";
import _clone from "lodash/clone";
import _pick from "lodash/pick";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import { removeCellInGrids, getMergeableDirectionOfCell as _getMergeableDirectionOfCell } from "@gaoding/editor-framework/lib/utils/collage/grid-helper";
import getRectsOfCells from "@gaoding/editor-framework/lib/utils/collage/get-rects-of-cells";
import EditorElementGroup from "../group/group-element";
import template from "./editor-element-collage.html";
/**
 * @class EditorElementCollage
 */

export default inherit(EditorElementGroup, {
  name: 'collage-element',
  template: template,
  data: function data() {
    return {
      imageDropMode: false // 当图片拖拽进入拼图时，将gap和outerGap扩大4

    };
  },
  computed: {
    backgroundStyle: function backgroundStyle() {
      var backgroundColor = this.model.backgroundColor;
      return {
        backgroundColor: backgroundColor
      };
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
      return this.imageDropMode ? outerGap + 4 : outerGap;
    },
    gap: function gap() {
      var _this$model$gap = this.model.gap,
          gap = _this$model$gap === void 0 ? 0 : _this$model$gap;
      return this.imageDropMode ? gap + 4 : gap;
    }
  },
  methods: {
    /**
     * 准备进行缩放
     * @memberof EditorElementCollage
     * @param {string} dir - 缩放的方位
     */
    resizeInit: function resizeInit() {
      this.$childModelsCache = this.model.elements.map(function (element) {
        var cache = _pick(element, ['left', 'top', 'width', 'height', 'fontSize', 'imageWidth', 'imageHeight']);

        cache.padding = _clone(element.padding);
        cache.clip = _clone(element.clip);
        return cache;
      });
      this.$elementCache = {
        width: this.model.width,
        height: this.model.height
      };
    },

    /**
     * 获取元素矩形
     * @memberof EditorElementCollage
     */
    getRect: function getRect() {
      var model = this.model,
          global = this.global;
      var zoom = global.zoom;
      var elements = model.elements;
      var bbox = utils.getBBoxByElements(elements.map(function (elem) {
        return _extends({}, elem, {
          rotate: 0 // rotate 值是图片的旋转，不是 cell 本身的旋转，计算时需清 0，避免误算

        });
      }));
      return {
        height: bbox.height * zoom + bbox.top * 2 * zoom,
        width: bbox.width * zoom + bbox.left * 2 * zoom
      };
    },

    /**
     * 缩放结束
     * @memberof EditorElementCollage
     */
    resizeEnd: function resizeEnd() {
      delete this.$childModelsCache;
      delete this.$elementCache;
    },

    /**
     * 缩放子元素
     * @memberof EditorElementCollage
     * @param {number} widthRatio - 宽度比例
     * @param {number} heightRatio - 高度比例
     */
    setSubElementsRatio: function setSubElementsRatio(widthRatio, heightRatio) {
      var $childModelsCache = this.$childModelsCache,
          model = this.model;
      var rects = $childModelsCache.map(function (rect) {
        return {
          left: rect.left * widthRatio,
          top: rect.top * heightRatio,
          width: rect.width * widthRatio,
          height: rect.height * heightRatio
        };
      });
      rects.forEach(function (rect, i) {
        var element = model.elements[i];
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
    setItemRoundness: function setItemRoundness() {
      var _this$model = this.model,
          elements = _this$model.elements,
          itemRoundness = _this$model.itemRoundness;
      elements.forEach(function (element) {
        element.borderRadius = itemRoundness;
      });
    },

    /**
     * 移除拼图中的子元素
     * @param {number} index - 要移除的子元素索引
     * @param {'vertical'|'horizontal'} direction - 移出后单元格合并的方向
     */
    removeSubElement: function removeSubElement(index, direction) {
      var _this$model2 = this.model,
          elements = _this$model2.elements,
          $cellIndex = _this$model2.$cellIndex;

      if (elements.length > this.options.minCellCount) {
        if ($cellIndex === index) {
          this.model.$cellIndex = -1;
        }

        var rects = [];
        elements.forEach(function (_element) {
          var rect = utils.getElementRect(_element);
          rect.$element = _element;
          rects.push(rect);
        });
        var newRects = removeCellInGrids(rects, index, 0, direction);
        this.model.elements = newRects.map(function (rect) {
          var left = rect.left,
              top = rect.top,
              width = rect.width,
              height = rect.height,
              $element = rect.$element;
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
    clearSubElement: function clearSubElement(index) {
      var elements = this.model.elements;
      var element = elements[index];

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
    addSubElement: function addSubElement(index, side, cell) {
      var elements = this.model.elements;
      var element = elements[index];

      if (element) {
        var rect = utils.getElementRect(element);
        var newWidth = Math.max(rect.width / 2, 1);
        var newHeight = Math.max(rect.height / 2, 1);

        if (['left', 'right'].indexOf(side) >= 0) {
          var leftElement, rightElement;

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
          var topElement, bottomElement;

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
    changeSubelement: function changeSubelement(index, props) {
      var cell = this.model.elements[index];

      if (cell) {
        _merge(cell, props);
      }
    },
    getMergeableDirectionOfCell: function getMergeableDirectionOfCell(index) {
      var elements = this.model.elements;
      var grid = elements.map(function (elem) {
        return {
          left: elem.left,
          top: elem.top,
          width: elem.width,
          height: elem.height
        };
      });
      return _getMergeableDirectionOfCell(grid, index);
    },
    autoFixGrid: function autoFixGrid() {
      // 自动校验 grid 内的数据正确性，并矫正错误数据
      // cells 的 rect 是不包含 gap 和 outerGap,因此
      // cells 间的间距应该小于 1
      var elements = this.model.elements;
      var tops = new Set();
      var lefts = new Set();
      elements.forEach(function (elem) {
        tops.add(elem.top);
        lefts.add(elem.left);
      });
      Array.from(tops).sort(function (t1, t2) {
        return t1 - t2;
      }).forEach(function (top) {
        var cellsRelated = elements.filter(function (elem) {
          return Math.abs(elem.top - top) < 1 || // top 相同
          elem.top - top < -1 && elem.top + elem.height - top > 1;
        }).sort(function (c1, c2) {
          return c1.left - c2.left;
        });

        if (cellsRelated[0].left !== 0) {
          cellsRelated[0].left = 0;
        }

        for (var i = 0; i < cellsRelated.length - 1; i++) {
          var leftCell = cellsRelated[i];
          var rightCell = cellsRelated[i + 1];
          var diff = rightCell.left - (leftCell.left + leftCell.width);
          var topDiff = rightCell.top - leftCell.top;

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
      Array.from(lefts).sort(function (l1, l2) {
        return l1 - l2;
      }).forEach(function (left) {
        var cellsRelated = elements.filter(function (elem) {
          return Math.abs(elem.left - left) < 1 || // left 相同
          elem.left - left < -1 && elem.left + elem.width - left > 1;
        }).sort(function (c1, c2) {
          return c1.top - c2.top;
        });

        if (cellsRelated[0].top !== 0) {
          cellsRelated[0].top = 0;
        }

        for (var i = 0; i < cellsRelated.length - 1; i++) {
          var topCell = cellsRelated[i];
          var bottomCell = cellsRelated[i + 1];
          var diff = bottomCell.top - (topCell.top + topCell.height);
          var leftDiff = bottomCell.left - topCell.left;

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
    }
  },
  events: {
    'editor.collage.cell.remove': function editorCollageCellRemove(element, index, direction) {
      // 最后一个 cell 不允许被删除
      if (this.model.elements.length <= this.options.minCellCount) return;

      var _index = -1;

      if (element === this.model) {
        _index = index;
      } else {
        // 第一个参数为 cell model 自身，则确认是否是本 collage 下的 cell
        _index = this.model.elements.findIndex(function (elem) {
          return elem === element;
        });
      }

      if (_index !== -1) {
        this.removeSubElement(_index, direction);
      }
    },
    'editor.collage.cell.add': function editorCollageCellAdd(element, index, side, cell) {
      if (element === this.model) {
        this.addSubElement(index, side, cell);
      }
    },
    'editor.collage.cell.change': function editorCollageCellChange(element, index, props) {
      if (element === this.model) {
        this.changeSubelement(index, props);
      }
    },
    'editor.collage.cell.clear': function editorCollageCellClear(element, index) {
      if (element === this.model) {
        this.clearSubElement(index);
      }
    },
    'editor.collage.dropmode.active': function editorCollageDropmodeActive(element) {
      if (element === this.model) {
        this.imageDropMode = true;
      }
    },
    'editor.collage.dropmode.unactive': function editorCollageDropmodeUnactive(element) {
      if (element === this.model) {
        this.imageDropMode = false;
      }
    }
  },
  watch: {
    'model.width': function modelWidth() {
      this.updateSubElements();
    },
    'model.height': function modelHeight() {
      this.updateSubElements();
    },
    'model.itemRoundness': function modelItemRoundness() {
      this.setItemRoundness();
      this.$events.$emit('editor.snapshot.create', 'change_element');
    },
    'model.gap': function modelGap() {
      this.$events.$emit('editor.snapshot.create', 'change_element');
    },
    'model.outerGap': function modelOuterGap() {
      this.$events.$emit('editor.snapshot.create', 'change_element');
    }
  },
  created: function created() {
    this.load();
    this.setItemRoundness();
  },
  mounted: function mounted() {
    this.autoFixGrid();
  }
});