"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLines = getLines;
exports.getWords = getWords;

var _toArray2 = _interopRequireDefault(require("lodash/toArray"));

const rBreakLine = /(\r?\n|\r)/gm;
const THRESHOLD = 4000;

function getPropValue(styleStr, prop) {
  const matchVal = styleStr.match(new RegExp(`(^|;) *${prop}:([^;]+)`));
  return matchVal ? matchVal[2] : '';
}

function resetTransform(node, selfNode) {
  const fns = [];
  let parent = node;

  while (parent && !parent.classList.contains('editor-layout')) {
    const styleStr = parent.getAttribute('style') || '';
    parent.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';

    if (selfNode === parent) {
      parent.style.left = 0;
      parent.style.top = 0;
    }

    const _parent = parent;
    parent = parent.parentNode;
    fns.push(() => {
      _parent.style.transform = getPropValue(styleStr, 'transform');

      if (selfNode === _parent) {
        _parent.style.left = getPropValue(styleStr, 'left');
        _parent.style.top = getPropValue(styleStr, 'top');
      }
    });
  }

  return fns;
}

function getLines(node, wrapParent) {
  if (!node) return [];
  const styleAttribute = node.getAttribute('style') || '';
  const computedStyle = window.getComputedStyle(node);
  const restoreTransformFns = resetTransform(node, node);
  const wrapRect = wrapParent.getBoundingClientRect();
  const isVertical = computedStyle.writingMode.includes('vertical');
  const lines = [[]];
  let curLine = lines[0];
  let words = [];
  node.style.lineHeight = THRESHOLD + 'px';

  const getContent = nodeList => {
    return (0, _toArray2.default)(nodeList).map(childNode => {
      if (childNode.childNodes.length > 1) {
        return getContent(childNode.childNodes);
      } else {
        const textNode = childNode instanceof Text ? childNode : childNode.firstChild;

        if (!textNode) {
          return '';
        }

        const textLength = textNode.data && textNode.data.length || 0;
        const range = document.createRange();
        let rangeEnd = 0;
        range.selectNodeContents(textNode);

        while (rangeEnd <= textLength) {
          range.setStart(textNode, Math.max(rangeEnd - 1, 0));
          range.setEnd(textNode, rangeEnd);
          const boxs = range.getClientRects ? range.getClientRects() : [range.getBoundingClientRect()];
          let box = boxs[boxs.length - 1];

          if (boxs.length > 1 && box.width < 2) {
            box = boxs[boxs.length - 2];
          }

          const contentValue = range.toString();

          if (contentValue !== '' && box && box.width + box.height !== 0) {
            const prevWord = {
              content: contentValue,
              width: box.width,
              top: box.top,
              left: box.left,
              height: box.height
            };
            words.push(prevWord);
          }

          rangeEnd++;
        }
      }

      return undefined;
    });
  };

  getContent(node.childNodes);

  if (words.length) {
    curLine.push(words[0]);
    words.reduce((a, b) => {
      const key = isVertical ? 'left' : 'top';

      if (Math.abs(b[key] - a[key]) > THRESHOLD / 2) {
        curLine = [];
        lines.push(curLine);
      }

      curLine.push(b);
      return b;
    });
  }

  words = [];
  node.style.lineHeight = getPropValue(styleAttribute, 'line-height');
  getContent(node.childNodes);
  lines.reduce((r, line) => {
    return r.concat(line);
  }, []).forEach((item, i) => {
    item.textWidth = item.width;
    item.textHeight = item.height;
    Object.assign(item, words[i]);
    item.left = item.left - wrapRect.left;
    item.top = item.top - wrapRect.top;
  });
  restoreTransformFns.forEach(fn => fn());
  return lines;
}

function getWords(lines, {
  fontFamily,
  fontSize,
  textDecoration,
  color,
  contents
}) {
  const defaultStyle = {
    fontFamily,
    fontSize,
    textDecoration,
    color
  };
  const words = [];
  lines.forEach((items, lineIndex) => {
    items.forEach((item, wordIndex) => {
      item.lineIndex = lineIndex;
      item.wordIndex = wordIndex;
      words.push(item);
    });
  });
  contents = contents.reduce((r, item) => {
    return r.concat(item.content.replace(rBreakLine, '').split('').map(str => {
      const data = { ...defaultStyle,
        ...item,
        content2: str
      };
      delete data.content;
      return data;
    }));
  }, []);
  contents = contents.filter(item => {
    if (item.content2 === '\n') {
      return false;
    }

    return true;
  });
  words.forEach((item, i) => {
    Object.assign(item, contents[i]);
  });
  return words;
}