"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCutGridData = getCutGridData;

function getNomarlCutGridData({
  width,
  height
}, grid) {
  const colGapsLeft = [];
  const rowGapsTop = [];
  let offsetTop = 0;
  let offsetLeft = 0;
  let weights = grid.columns.reduce((total, v) => total + v, 0);
  const columns = grid.columns.map((v, i) => {
    if (i !== 0) {
      colGapsLeft.push(offsetLeft);
    }

    const itemWidth = v / weights * width;
    offsetLeft += itemWidth;
    return itemWidth;
  });
  weights = grid.rows.reduce((total, v) => total + v, 0);
  const rows = grid.rows.map((v, i) => {
    if (i !== 0) {
      rowGapsTop.push(offsetTop);
    }

    const itemHeight = v / weights * height;
    offsetTop += itemHeight;
    return itemHeight;
  });
  return {
    rows,
    columns,
    colGapsLeft,
    rowGapsTop
  };
}

function getCutGridData({
  width,
  height
}, grid) {
  if (grid.fitType !== 'cover') {
    return getNomarlCutGridData({
      width,
      height
    }, grid);
  }

  const cellSize = Math.max(height / grid.rows.length, width / grid.columns.length);
  const repeatContainSize = {
    width: cellSize * grid.columns.length,
    height: cellSize * grid.rows.length
  };
  const offsetLeft = (width - repeatContainSize.width) / 2;
  const offsetTop = (height - repeatContainSize.height) / 2;
  const rowGapsTop = [];
  const colGapsLeft = [];
  const newColumns = grid.columns.map((_, i) => {
    let width = cellSize;
    const left = width * i + offsetLeft;

    if (i === 0 || i === grid.columns.length - 1) {
      width = Math.max(0, width + offsetLeft);
    }

    if (i !== 0) {
      colGapsLeft.push(left);
    }

    return width;
  });
  const newRows = (grid.rows || []).map((_, i) => {
    let height = cellSize;
    const top = height * i + offsetTop;

    if (i === 0 || i === grid.rows.length - 1) {
      height = Math.max(0, height + offsetTop);
    }

    if (i !== 0) {
      rowGapsTop.push(top);
    }

    return height;
  });
  return {
    rows: newRows,
    columns: newColumns,
    colGapsLeft,
    rowGapsTop
  };
}