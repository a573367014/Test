"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWatermarkTemplate = getWatermarkTemplate;
exports.getWatermarkTemplateV2 = getWatermarkTemplateV2;

var _findIndex2 = _interopRequireDefault(require("lodash/findIndex"));

var _get2 = _interopRequireDefault(require("lodash/get"));

var _templet = _interopRequireDefault(require("./templet"));

var _rect = _interopRequireDefault(require("./rect"));

function getWatermarkTemplateV2(templateV1) {
  const hasMainGroup = templateV1.elements.find(item => item.category === 'MAIN');
  if (hasMainGroup) return templateV1;
  const newTemplate = JSON.parse(JSON.stringify(templateV1, (k, v) => {
    if (k[0] === '$') return;
    return v;
  }));

  if ((0, _get2.default)(newTemplate, 'widget.groups')) {
    newTemplate.widget.groups = newTemplate.widget.groups.map(item => {
      return getWatermarkTemplateV2(item);
    });
  }

  let h1AlignValue;
  let alignValue;
  const alignValueMap = {
    left: 'flex-start',
    right: 'flex-end',
    center: 'center'
  };
  const elements = [];
  let mainType = 'flex';

  _templet.default.walkTemplet((el, parent) => {
    if (el.type === 'text' && !alignValue) {
      alignValue = alignValueMap[el.textAlign] || 'flex-start';
    }

    if (el.category === 'H1') {
      h1AlignValue = alignValueMap[el.textAlign];

      if (parent.type !== 'flex') {
        elements.push(el);
      } else if (parent.elements.length === 1) {
        el.left += parent.left;
        el.top += parent.top;
        delete el.flex;
        elements.push(el);
      } else {
        mainType = 'group';
        elements.push(parent);
      }
    }

    if (el.category === 'INFO') {
      elements.push(el);
    }
  }, true, [newTemplate]);

  alignValue = h1AlignValue || alignValue || 'flex-start';
  elements.forEach(el => {
    if (el.category === 'INFO' && el.type === 'group') {
      el.elements.sort((a, b) => a.left - b.left);
      el.elements.length > 1 && el.elements.reduce((leftElement, rightElement) => {
        const marginLeft = rightElement.left - leftElement.left - leftElement.width;
        leftElement.flex = {
          alignSelf: 'auto',
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: -1,
          margin: [0, marginLeft, 0, 0]
        };
        return rightElement;
      });
      Object.assign(el, {
        type: 'flex',
        autoAdaptive: 0b11,
        flexDirection: 'row',
        justifyContent: alignValue,
        alignItems: 'center',
        flexWrap: 'nowrap'
      });
    }
  });

  const mainBBox = _rect.default.getBBoxByElements(elements);

  const mainGroup = {
    type: window.location.href.includes('mainTypeIsGroup') ? 'group' : mainType,
    category: 'MAIN',
    height: mainBBox.height,
    width: mainBBox.width,
    left: mainBBox.left,
    top: mainBBox.top,
    elements
  };

  if (mainType === 'flex') {
    Object.assign(mainGroup, {
      autoAdaptive: 0,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: alignValue,
      alignContent: alignValue,
      flexWrap: 'nowrap'
    });
  }

  elements.sort((a, b) => a.top - b.top);
  elements.reduce((prevElement, element) => {
    element.left -= mainGroup.left;
    element.top -= mainGroup.top;
    element.flex = {
      alignSelf: 'auto',
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: -1,
      margin: [0, 0, 0, 0]
    };

    if (prevElement) {
      const marginTop = element.top - (prevElement.top + prevElement.height);
      element.flex.margin[0] = marginTop;
    }

    return element;
  }, null);
  newTemplate.elements = newTemplate.elements.filter(item => !elements.includes(item) && item.category !== 'INFO' && item.category !== 'H1');
  newTemplate.elements.push(mainGroup);
  return newTemplate;
}

function getWatermarkTemplate(templateV2) {
  const newTemplate = JSON.parse(JSON.stringify(templateV2, (k, v) => {
    if (k[0] === '$') return;
    return v;
  }));
  const mainGroup = newTemplate.elements.find(item => item.category === 'MAIN');
  const mainGroupIndex = (0, _findIndex2.default)(newTemplate.elements, mainGroup);
  if (!mainGroup) return;

  if ((0, _get2.default)(newTemplate, 'widget.groups')) {
    newTemplate.widget.groups = newTemplate.widget.groups.map(item => {
      return getWatermarkTemplate(item);
    });
  }

  mainGroup.elements.forEach(item => {
    item.left += mainGroup.left;
    item.top += mainGroup.top;
    delete item.flex;
  });
  newTemplate.elements.splice(mainGroupIndex, 1, ...mainGroup.elements);

  _templet.default.walkTemplet(subElem => {
    if (subElem.category === 'B1') {
      subElem.relation = {
        offset: {
          left: subElem.left,
          top: subElem.top,
          width: subElem.width,
          height: subElem.height
        },
        defaultOffset: {
          left: 0,
          top: 0,
          width: subElem.width,
          height: subElem.height
        },
        textAlign: subElem.textAlign || 'left',
        defaultTextAlign: subElem.textAlign || 'left'
      };
    }
  }, true, [newTemplate]);

  return newTemplate;
}