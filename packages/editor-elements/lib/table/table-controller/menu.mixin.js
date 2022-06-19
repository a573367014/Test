import { canMergeCells, canSplitCell, mergeCells, shotTableElement, splitCell } from "../utils";
export default {
  methods: {
    getMenuData: function getMenuData(e) {
      var _this = this;

      var editor = this.editor,
          model = this.model,
          range = this.range;
      if (!range) return null;
      var cells = model.tableData.cells;
      var selectedSingle = range.rowspan === 1 && range.colspan === 1;
      var selectedRow = range.colspan === cells[0].length;
      var selectedCol = range.rowspan === cells.length;
      var selectedAll = selectedRow && selectedCol;
      var elms = (e.path || e.composedPath()).filter(function (elm) {
        return elm.getAttribute;
      });
      var colHandleClick = !!elms.find(function (elm) {
        return elm.getAttribute('name') === 'col-handle';
      });
      var rowHandleClick = !!elms.find(function (elm) {
        return elm.getAttribute('name') === 'row-handle';
      });
      var allHandleClick = !!elms.find(function (elm) {
        return elm.getAttribute('name') === 'all-handle';
      });
      var canClear = !colHandleClick && !rowHandleClick && !allHandleClick;
      var showMerge = !selectedSingle && !colHandleClick && !rowHandleClick && !allHandleClick;
      var isSplit = canSplitCell(cells, range);
      return [].concat(showMerge && (isSplit || canMergeCells(cells, range)) ? [{
        text: isSplit ? '拆分单元格' : '合并单元格',
        action: function action() {
          isSplit ? splitCell(model, range.row, range.col) : mergeCells(model, range);

          _this.onMergeCell();

          shotTableElement(model, editor);
        }
      }, '|'] : [], !colHandleClick ? [{
        text: '在上面添加行',
        action: function action() {
          var range = _this.range;

          _this.handleAddStrip('r', range.row - 1, 0);
        }
      }, {
        text: '在下面添加行',
        action: function action() {
          var range = _this.range;

          _this.handleAddStrip('r', range.row + (range.rowspan || 1) - 2, 1);
        }
      }, {
        text: '删除所选行',
        disabled: selectedAll || selectedCol,
        action: function action() {
          _this.onDeleteStrip({
            row: range.row,
            col: 1,
            rowspan: 1,
            colspan: cells[0].length
          });
        }
      }] : [], !rowHandleClick && canClear ? ['|'] : [], !rowHandleClick ? [{
        text: '在左侧添加列',
        action: function action() {
          var range = _this.range;

          _this.handleAddStrip('c', range.col - 1, 0);
        }
      }, {
        text: '在右侧添加列',
        action: function action() {
          var range = _this.range;

          _this.handleAddStrip('c', range.col + (range.colspan || 1) - 2, 1);
        }
      }, {
        text: '删除所选列',
        disabled: selectedAll || selectedRow,
        action: function action() {
          _this.onDeleteStrip({
            row: 1,
            col: range.col,
            rowspan: cells.length,
            colspan: 1
          });
        }
      }] : [], canClear ? ['|', {
        text: '清除内容',
        action: function action() {
          _this.onClearContent();
        }
      }] : []);
    }
  }
};