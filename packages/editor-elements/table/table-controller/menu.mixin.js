import { canMergeCells, canSplitCell, mergeCells, shotTableElement, splitCell } from '../utils';

export default {
    methods: {
        getMenuData(e) {
            const { editor, model, range } = this;
            if (!range) return null;
            const cells = model.tableData.cells;
            const selectedSingle = range.rowspan === 1 && range.colspan === 1;
            const selectedRow = range.colspan === cells[0].length;
            const selectedCol = range.rowspan === cells.length;
            const selectedAll = selectedRow && selectedCol;
            const elms = (e.path || e.composedPath()).filter((elm) => elm.getAttribute);
            const colHandleClick = !!elms.find((elm) => elm.getAttribute('name') === 'col-handle');
            const rowHandleClick = !!elms.find((elm) => elm.getAttribute('name') === 'row-handle');
            const allHandleClick = !!elms.find((elm) => elm.getAttribute('name') === 'all-handle');
            const canClear = !colHandleClick && !rowHandleClick && !allHandleClick;
            const showMerge =
                !selectedSingle && !colHandleClick && !rowHandleClick && !allHandleClick;
            const isSplit = canSplitCell(cells, range);
            return [
                ...(showMerge && (isSplit || canMergeCells(cells, range))
                    ? [
                          {
                              text: isSplit ? '拆分单元格' : '合并单元格',
                              action: () => {
                                  isSplit
                                      ? splitCell(model, range.row, range.col)
                                      : mergeCells(model, range);
                                  this.onMergeCell();
                                  shotTableElement(model, editor);
                              },
                          },
                          '|',
                      ]
                    : []),
                ...(!colHandleClick
                    ? [
                          {
                              text: '在上面添加行',
                              action: () => {
                                  const { range } = this;
                                  this.handleAddStrip('r', range.row - 1, 0);
                              },
                          },
                          {
                              text: '在下面添加行',
                              action: () => {
                                  const { range } = this;
                                  this.handleAddStrip('r', range.row + (range.rowspan || 1) - 2, 1);
                              },
                          },
                          {
                              text: '删除所选行',
                              disabled: selectedAll || selectedCol,
                              action: () => {
                                  this.onDeleteStrip({
                                      row: range.row,
                                      col: 1,
                                      rowspan: 1,
                                      colspan: cells[0].length,
                                  });
                              },
                          },
                      ]
                    : []),
                ...(!rowHandleClick && canClear ? ['|'] : []),
                ...(!rowHandleClick
                    ? [
                          {
                              text: '在左侧添加列',
                              action: () => {
                                  const { range } = this;
                                  this.handleAddStrip('c', range.col - 1, 0);
                              },
                          },
                          {
                              text: '在右侧添加列',
                              action: () => {
                                  const { range } = this;
                                  this.handleAddStrip('c', range.col + (range.colspan || 1) - 2, 1);
                              },
                          },
                          {
                              text: '删除所选列',
                              disabled: selectedAll || selectedRow,
                              action: () => {
                                  this.onDeleteStrip({
                                      row: 1,
                                      col: range.col,
                                      rowspan: cells.length,
                                      colspan: 1,
                                  });
                              },
                          },
                      ]
                    : []),
                ...(canClear
                    ? [
                          '|',
                          {
                              text: '清除内容',
                              action: () => {
                                  this.onClearContent();
                              },
                          },
                      ]
                    : []),
            ];
        },
    },
};
