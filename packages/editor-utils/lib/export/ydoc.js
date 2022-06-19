"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exportYDoc = exportYDoc;

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _tinycolor = _interopRequireDefault(require("tinycolor2"));

const colorToHex8 = v => {
  if (v && typeof v === 'string') {
    const color = (0, _tinycolor.default)(v);
    return color.isValid() ? color.toString('hex8') : v;
  }

  return v;
};

const getOldShadow = (newShadow, inset = false) => {
  const oldShadow = (0, _cloneDeep2.default)(newShadow);
  oldShadow.type = 'shadow';
  oldShadow.inset = inset;
  return oldShadow;
};

function copyWithFilter(data) {
  const strCopy = JSON.stringify(data, (k, v) => {
    if (k[0] === '$') {
      return undefined;
    }

    if ((k === 'color' || k === 'backgroundColor' || k === 'stroke' || k === 'fill') && typeof v === 'string') {
      return colorToHex8(v);
    }

    if (k === 'colors' || k === 'aggregatedColors') {
      if (v instanceof Array) {
        return v.map(color => colorToHex8(color));
      } else {
        const result = {};

        for (const key in v) {
          result[key] = colorToHex8(v[key]);
        }

        return result;
      }
    }

    if (v && typeof v === 'object' && ['text', 'mask', 'effectText', 'image'].includes(v.type)) {
      const isText = ['text', 'effectText'].includes(v.type);
      const effects = (isText ? v.textEffects : v.imageEffects) || [];
      effects.forEach(effect => {
        if (effect.insetShadow) {
          effect.shadow = getOldShadow(effect.insetShadow, true);
        }

        if (effect.filling && typeof effect.filling.type === 'string') {
          const mapColorType = ['color', 'image', 'gradient'];
          effect.filling.type = mapColorType.indexOf(effect.filling.type);

          if (effect.filling.type === -1) {
            effect.filling.type = 0;
          }
        }
      });

      if (v.shadows) {
        const hasEffects = effects.some(ef => ef.enable);
        let shadowEffects = v.shadows.filter(shadow => shadow.type === 'base');
        const firstEnableShadow = shadowEffects.find(sh => sh.enable);
        shadowEffects = shadowEffects.map(shadow => ({
          enable: true,
          filling: {
            enable: hasEffects || firstEnableShadow !== shadow,
            type: 0,
            color: '#00000000'
          },
          shadow: getOldShadow(shadow)
        }));
        const newEffects = effects.concat(shadowEffects);
        isText ? v.textEffects = newEffects : v.imageEffects = newEffects;
      }
    }

    return v;
  });
  return JSON.parse(strCopy);
}

function exportYDoc(doc) {
  var _doc$getArray, _yTemplet$get;

  const yTemplet = doc.getMap('templet');
  const yFallbackMap = doc.getMap('fallbackMap');
  const yLayoutMap = yTemplet.get('layoutMap');
  const yElementMap = yTemplet.get('elementMap');

  function getChildren(parent) {
    const ids = [];
    yElementMap.forEach((yElement, uuid) => {
      if (yElement.get('$parentId') === parent.uuid) {
        ids.push(uuid);
      }
    });
    ids.sort((a, b) => {
      const indexA = yElementMap.get(a).get('$index');
      const indexB = yElementMap.get(b).get('$index');
      if (indexA > indexB) return 1;else if (indexA < indexB) return -1;
      return a > b ? 1 : -1;
    });
    return ids;
  }

  function serializeElement(id, deep = false) {
    const yElement = yElementMap.get(id);

    if (!yElement) {
      console.error(id);
      return;
    }

    const element = yElement.toJSON();
    const fallback = element.$fallbackId && (yFallbackMap === null || yFallbackMap === void 0 ? void 0 : yFallbackMap.get(element.$fallbackId));

    if (fallback) {
      element.imageUrl = fallback.url;

      if (fallback.width) {
        element.effectResult = {
          width: fallback.width,
          height: fallback.height,
          top: fallback.top,
          left: fallback.left
        };
      }
    }

    if ('elements' in element) {
      if (deep) {
        const ids = getChildren(element);
        element.elements = ids.map(id => serializeElement(id, true));
      } else {
        element.elements = [];
      }
    }

    return element;
  }

  function serializeLayout(id) {
    const yLayout = yLayoutMap.get(id);

    if (!yLayout) {
      console.error(id);
      return null;
    }

    const layout = yLayout.toJSON();
    const ids = getChildren(layout);
    layout.elements = ids.map(id => serializeElement(id, true));
    layout.elements = layout.elements.filter(el => !!el);
    return layout;
  }

  const layouts = [];
  yLayoutMap.forEach(yLayout => {
    const layout = serializeLayout(yLayout.get('uuid'));
    layout && layouts.push(layout);
  });
  layouts.sort((a, b) => {
    return yLayoutMap.get(a.uuid).get('$index') > yLayoutMap.get(b.uuid).get('$index') ? 1 : -1;
  });
  return copyWithFilter({
    version: '7.0.0',
    type: 'poster',
    actionLogs: (_doc$getArray = doc.getArray('actionLogs')) === null || _doc$getArray === void 0 ? void 0 : _doc$getArray.toJSON(),
    global: ((_yTemplet$get = yTemplet.get('global')) === null || _yTemplet$get === void 0 ? void 0 : _yTemplet$get.toJSON()) || {},
    layouts
  });
}