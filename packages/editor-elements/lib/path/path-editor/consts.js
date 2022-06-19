import paper from 'paper';
export var sizes = {
  anchorSize: 6,
  // 居中描边，整个锚点共有 6+0.5*2=7 个逻辑像素
  anchorStrokeWidth: 1,
  anchorRadius: 2.5,
  handleRadius: 2.5,
  hoverRadius: 11,
  // 5+3*2 个逻辑像素
  anchorMergeRadius: 7 // 5+1*2 个逻辑像素

};
export var colors = {
  white: new paper.Color('#ffffff'),
  black: new paper.Color('#000000'),
  red: new paper.Color('#ff0000'),
  lightBlue: new paper.Color('#6ccfff'),
  lighterBlue: new paper.Color('#c6ebfe'),
  grey: new paper.Color('#cccccc'),
  defaultStroke: new paper.Color('#666666'),
  defaultFill: new paper.Color('#dadada')
};
export var names = {
  mainPath: 'MAIN_PATH',
  offsetPath: 'OFFSET_PATH',
  hintPath: 'HINT_PATH'
};
export var cursors = {
  updateAnchor: 'update-anchor',
  fitAnchor: 'fit-anchor',
  addAnchor: 'add-anchor'
};