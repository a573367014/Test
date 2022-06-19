"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genSvgUrl = genSvgUrl;
exports.getCursorCssValue = getCursorCssValue;
exports.getTarget = getTarget;
exports.getTemplateSvg = getTemplateSvg;
exports.renderCursor = renderCursor;

var _loader = _interopRequireDefault(require("../loader"));

var _canvas = require("../canvas");

var _binary = require("../binary");

var _ua = require("../ua");

var _constants = require("./constants");

function getTarget(target) {
  var _target$dataset;

  if (!((_target$dataset = target.dataset) !== null && _target$dataset !== void 0 && _target$dataset.cursor) && target.parentNode) {
    return getTarget(target.parentNode);
  } else {
    return target;
  }
}

function getCursorCssValue(opt) {
  const {
    imageSets,
    left = 0,
    top = 0,
    replacement = 'default'
  } = opt;
  const imageset = imageSets.map(s => `url('${s.url}') ${s.resolution}x`).join(',');
  let v = `image-set(${imageset}) ${left} ${top}`;
  if ((0, _ua.isWebkit)()) v = `-webkit-${v}`;
  return `${v}, ${replacement}`;
}

const _rotate = (canvas, rotate) => {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 180 * (360 - rotate));
  ctx.translate(-width / 2, -height / 2);
};

async function renderCursor(opt) {
  const {
    image,
    args,
    rotate
  } = opt;
  let url = image;

  if (typeof image !== 'string') {
    url = await image(args);
  }

  if ((0, _ua.isWebkit)() && !rotate) {
    const url1x = await genSvgUrl(url, [], 1);
    return [{
      url,
      resolution: 2
    }, {
      url: url1x,
      resolution: 1
    }];
  }

  const img = await _loader.default._loadImage(url);
  const c1 = (0, _canvas.createCanvas)(img.width / 2, img.height / 2);
  const c2 = (0, _canvas.createCanvas)(img.width, img.height);
  const ctx1 = c1.getContext('2d');
  const ctx2 = c2.getContext('2d');

  if (rotate) {
    _rotate(c1, rotate);

    _rotate(c2, rotate);
  }

  ctx1.drawImage(img, 0, 0, c1.width, c1.height);
  ctx2.drawImage(img, 0, 0, c2.width, c2.height);
  URL.revokeObjectURL(url);
  return [{
    url: URL.createObjectURL(await (0, _binary.canvasToBlob)(c1)),
    resolution: 1
  }, {
    url: URL.createObjectURL(await (0, _binary.canvasToBlob)(c2)),
    resolution: 2
  }];
}

async function genSvgUrl(url, args, dpr = 2) {
  let svg = await getTemplateSvg(url, args);

  if (dpr !== 2) {
    svg = svg.replace('width="64"', 'width="32"');
    svg = svg.replace('height="64"', 'height="32"');
  }

  const blob = new Blob([svg], {
    type: 'image/svg+xml'
  });
  return URL.createObjectURL(blob);
}

async function getTemplateSvg(url, args = []) {
  let content = '';

  try {
    content = await _loader.default.loadXMLStr(url);
  } catch {
    content = _constants.defaultCursorContent;
  }

  args.forEach((d, i) => {
    content = content.replace(`{${i}}`, d.toString());
  });
  return content;
}