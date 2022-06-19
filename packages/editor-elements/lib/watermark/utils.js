import _extends from "@babel/runtime/helpers/extends";
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { updateEffect } from "@gaoding/editor-utils/lib/effect/effect-actions";
import { updateShadow } from "@gaoding/editor-utils/lib/effect/shadow-actions";

function getLcm(a, b) {
  var num1 = a;
  var num2 = b;
  var c = 0;

  while (b !== 0) {
    c = a % b;
    a = b;
    b = c;
  }

  return num1 * num2 / a;
}

export function getRepeat(model) {
  var fullScreenInfo = model.fullScreenInfo,
      template = model.template;
  var repeat = [{
    leftIndent: 0,
    colGap: fullScreenInfo.colGap,
    rowGap: fullScreenInfo.rowGap,
    transform: template.transform
  }, {
    leftIndent: fullScreenInfo.leftIndent,
    colGap: fullScreenInfo.colGap,
    rowGap: fullScreenInfo.rowGap,
    transform: template.transform
  }];
  return repeat;
}
export function renderRepeat(cellCanvas, repeat) {
  var rowCanvases = [];
  var rowsHeight = 0;
  var sumHeight = 0; // 需要先绘制每行最小的单元水印，并计算宽度的最小公倍数

  var lcm = repeat.reduce(function (lcm, row) {
    var leftIndent = row.leftIndent,
        colGap = row.colGap,
        rowGap = row.rowGap;
    var transform = row.transform.toJSON();
    var cellWidth = Math.abs(cellCanvas.width * transform.a) + Math.abs(cellCanvas.height * transform.c);
    var cellHeight = Math.abs(cellCanvas.height * transform.d) + Math.abs(cellCanvas.width * transform.b);

    var _reduce = [[cellCanvas.width, 0], [0, cellCanvas.height], [cellCanvas.width, cellCanvas.height]].reduce(function (_ref, _ref2) {
      var dx = _ref[0],
          dy = _ref[1];
      var x = _ref2[0],
          y = _ref2[1];

      var _x = transform.a * x + transform.c * y;

      var _y = transform.b * x + transform.d * y;

      if (-_x > dx) {
        dx = -_x;
      }

      if (-_y > dy) {
        dy = -_y;
      }

      return [dx, dy];
    }, [0, 0]),
        dx = _reduce[0],
        dy = _reduce[1]; // 先绘制水印的旋转与缩放


    var canvas = createCanvas(cellWidth, cellHeight);
    var context = canvas.getContext('2d');
    context.save();
    context.setTransform(transform.a, transform.b, transform.c, transform.d, transform.tx + dx, transform.ty + dy);
    context.drawImage(cellCanvas, 0, 0);
    context.restore(); // 水平绘制 3 次以用于获取偏移后的单元水印
    // 会绘制的时候，需要保证单元水印是绕中心点旋转的，所以需要根据原始尺寸计算出中心点，然后计算出旋转后的水印渲染位置

    var repeatCanvas = createCanvas((Math.max(canvas.width, cellCanvas.width) + colGap) * 3, Math.max(canvas.height, cellCanvas.height));
    var dLeft = (cellCanvas.width - canvas.width) / 2;
    var preOffsetLeft = cellCanvas.width + colGap;
    var repeatContext = repeatCanvas.getContext('2d');

    for (var i = 0; i < 3; i++) {
      var left = i * preOffsetLeft + dLeft;
      repeatContext.drawImage(canvas, left, 0);
    }

    canvas.width = cellCanvas.width + colGap;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(repeatCanvas, preOffsetLeft - leftIndent % canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    canvas.rowGap = rowGap;
    canvas.dTop = (cellCanvas.height - canvas.height) / 2;
    rowCanvases.push(canvas);
    sumHeight += cellCanvas.height + rowGap;
    rowsHeight += canvas.height + rowGap;

    if (lcm === 0) {
      return canvas.width;
    } else {
      return getLcm(lcm, canvas.width);
    }
  }, 0); // 垂直绘制 3 次获取最小重复水印

  var vCanvas = createCanvas(lcm, Math.max(rowsHeight, sumHeight) * 3);
  var vContext = vCanvas.getContext('2d');
  var top = 0;

  for (var i = 0; i < 3; i++) {
    rowCanvases.forEach(function (rowCanvas) {
      vContext.save();
      vContext.translate(0, top + rowCanvas.dTop);
      vContext.fillStyle = vContext.createPattern(rowCanvas, 'repeat-x');
      vContext.fillRect(0, 0, vCanvas.width, rowCanvas.height);
      vContext.restore();
      top += cellCanvas.height + rowCanvas.rowGap;
    });
  }

  var canvas = createCanvas(lcm, sumHeight);
  var context = canvas.getContext('2d');
  context.drawImage(vCanvas, 0, sumHeight, lcm, sumHeight, 0, 0, lcm, canvas.height);
  return canvas;
}

function getNewProps(keys, props, handlerMap, element) {
  var newProps = {};
  var hasProps = false;
  keys.forEach(function (key) {
    var handler = handlerMap[key];

    if (handler) {
      hasProps = true;
      handler(props, newProps, element);
    }
  });
  return hasProps ? newProps : null;
}

var logoHandler = {
  url: function url(props, targetProps) {
    targetProps.url = props.url;
    targetProps.imageUrl = '';
  },
  enable: function enable(props, targetProps) {
    targetProps.hidden = !props.enable;
  }
};
/**
 * 获取属性中与 logo 元素有关的参数
 * @param {Object} props - 多个水印元素属性
 */

export function logoPropsToImageProps(props) {
  if (!props) return;

  if (props.url) {
    props.logo = Object.assign({}, props.logo, {
      url: props.url
    });
  }

  var logo = props.logo;

  if (logo) {
    var keys = Object.keys(logo);
    return getNewProps(keys, _extends({
      url: props.url
    }, logo), logoHandler);
  }
}
var titleHandler = {
  title: function title(props, targetProps) {
    targetProps.contents = [{
      content: props.title
    }];
    targetProps.content = props.title;
  },
  titleFontSize: function titleFontSize(props, targetProps) {
    targetProps.fontSize = props.titleFontSize;
  },
  fontFamily: function fontFamily(props, targetProps) {
    targetProps.fontFamily = props.fontFamily;
  },
  titleFontFamily: function titleFontFamily(props, targetProps) {
    targetProps.fontFamily = props.titleFontFamily;
  },
  fontWeight: function fontWeight(props, targetProps) {
    targetProps.fontWeight = props.fontWeight;
  },
  titleFontWeight: function titleFontWeight(props, targetProps) {
    targetProps.fontWeight = props.titleFontWeight;
  },
  fontStyle: function fontStyle(props, targetProps) {
    targetProps.fontStyle = props.fontStyle;
  },
  titleFontStyle: function titleFontStyle(props, targetProps) {
    targetProps.fontStyle = props.titleFontStyle;
  }
};
/**
 * 获取属性中与 title 元素有关的参数
 * @param {Object} props - 多个水印元素属性
 */

export function titlePropsToTextProps(props) {
  if (!props) {
    return;
  }

  var keys = Object.keys(props);
  return getNewProps(keys, props, titleHandler);
}
var infoTextHandler = {
  content: function content(props, targetProps) {
    targetProps.contents = [{
      content: props.content
    }];
    targetProps.content = props.content;
  },
  infoFontSize: function infoFontSize(props, targetProps) {
    targetProps.fontSize = props.infoFontSize;
  },
  fontFamily: function fontFamily(props, targetProps) {
    targetProps.fontFamily = props.fontFamily;
  },
  infoFontFamily: function infoFontFamily(props, targetProps) {
    targetProps.fontFamily = props.infoFontFamily;
  },
  fontWeight: function fontWeight(props, targetProps) {
    targetProps.fontWeight = props.fontWeight;
  },
  infoFontWeight: function infoFontWeight(props, targetProps) {
    targetProps.fontWeight = props.infoFontWeight;
  },
  fontStyle: function fontStyle(props, targetProps) {
    targetProps.fontStyle = props.fontStyle;
  },
  infoFontStyle: function infoFontStyle(props, targetProps) {
    targetProps.fontStyle = props.infoFontStyle;
  },
  type: function type(props, targetProps, element) {
    var textElement = element.elements.find(function (elem) {
      return elem.category === 'B1';
    });
    if (!textElement) return;
    var relation = textElement.relation;

    if (relation && element.type !== 'flex') {
      var type = props.type;
      var hasIcon = !(!type || type === 'word');
      var offset = relation.offset,
          defaultOffset = relation.defaultOffset,
          textAlign = relation.textAlign,
          defaultTextAlign = relation.defaultTextAlign;
      var targetOffset = hasIcon ? offset : defaultOffset;
      var targetTextAlign = hasIcon ? textAlign : defaultTextAlign;

      if (targetOffset) {
        targetProps.left = targetOffset.left;
        targetProps.top = targetOffset.top;
        targetProps.width = targetOffset.width;
        targetProps.height = targetOffset.height;
      }

      if (targetTextAlign) {
        targetProps.textAlign = targetTextAlign;
      }
    }
  }
};
/**
 * 获取属性中与 info 文字有关的参数
 * @param {Object} props - 多个水印元素属性
 * @param {Array<Object>} originInfo - 原输入项属性
 */

export function infoPropsToTextProps(props, originInfoModels) {
  if (!props) {
    return;
  }

  var info = props.info;
  var globalKeys = Object.keys(props);
  var infoProps = originInfoModels.map(function (originInfoModel, index) {
    var _info = info ? info[index] : null;

    var infoKeys = globalKeys.concat(_info ? Object.keys(_info) : []);
    return getNewProps(infoKeys, Object.assign({}, props, _info), infoTextHandler, originInfoModel);
  });
  return infoProps;
}
var infoImageHandler = {
  type: function type(props, targetProps) {
    var iconUrl = getIcon(props.type);
    targetProps.url = iconUrl;
    targetProps.hidden = !iconUrl;
    targetProps.iconType = props.type;
  }
};
/**
 * 获取属性中与 info 图片有关的参数
 * @param {Object} props - 多个水印元素属性
 * @param {Array<Object>} originInfo - 原输入项属性
 */

export function infoPropsToImageProps(props, originInfo) {
  if (!props) {
    return;
  }

  var info = props.info;
  var globalKeys = Object.keys(props);
  var infoProps = originInfo.map(function (_, index) {
    var _info = info ? info[index] : null;

    var infoKeys = globalKeys.concat(_info ? Object.keys(_info) : []);
    return getNewProps(infoKeys, Object.assign({}, props, _info), infoImageHandler);
  });
  return infoProps;
}
var backgroundHandler = {
  backgroundImage: function backgroundImage(props, targetProps) {
    targetProps.url = props.backgroundImage;
  },
  backgroundColor: function backgroundColor(props, targetProps) {
    targetProps.colors = [props.color];
  }
};
/**
 * 获取属性中与背景有关的参数
 * @param {Object} props - 多个水印元素属性
 */

export function backgroundPropsToImageProps(props) {
  if (!props) {
    return;
  }

  var color = props.color;
  var keys = color ? Object.keys(color) : [];
  return getNewProps(keys, color, backgroundHandler);
}
export function isTextElement(element) {
  if (!element) return false;
  return ['threeText', 'styledText', 'text'].includes(element.type);
}
/**
 * 修改文字元素颜色
 * @param {String} textColor - 文本颜色
 * @param {String} effectColor - 特效颜色
 * @param {Element} element - 文字元素
 * @param {Editor} editor - 编辑器实例
 */

export function changeTextColor(textColor, effectColor, element, editor) {
  var needChangeTextColor = textColor;
  var needChangeEffectColor = effectColor;
  if (!needChangeTextColor && !needChangeEffectColor) return;

  if (element.type === 'text') {
    if (needChangeTextColor) {
      editor.changeElement({
        color: textColor
      }, element);
    }

    if (!element.mainColor) {
      var textEffects = element.textEffects;
      textEffects.forEach(function (effect) {
        var _effect$filling = effect.filling,
            filling = _effect$filling === void 0 ? {} : _effect$filling,
            _effect$stroke = effect.stroke,
            stroke = _effect$stroke === void 0 ? {} : _effect$stroke,
            _effect$insetShadow = effect.insetShadow,
            insetShadow = _effect$insetShadow === void 0 ? {} : _effect$insetShadow;
        if (!effect.enable) return;

        if (filling.enable && [0, 'color'].includes(filling.type) && needChangeTextColor) {
          filling.color = textColor;
        }

        if (stroke.enable && needChangeEffectColor) {
          stroke.color = effectColor;
        } else if (insetShadow.enable && needChangeEffectColor) {
          insetShadow.color = effectColor;
        }

        updateEffect(effect);
      });
      element.shadows.forEach(function (shadow) {
        if (shadow.enable && shadow.color) {
          shadow.color = effectColor;
          updateShadow(shadow);
        }
      });
      editor.makeSnapshotByElement(element);
    }
  } else if (element.type === 'threeText') {
    var layer = element.layers[0];
    var frontMaterials = layer.frontMaterials,
        bevelMaterials = layer.bevelMaterials,
        sideMaterials = layer.sideMaterials;

    if (frontMaterials.type === 0 && needChangeTextColor) {
      frontMaterials.color = textColor;
    }

    if (bevelMaterials.enable && bevelMaterials.type === 0 && needChangeEffectColor) {
      bevelMaterials.color = effectColor;
    } else if (sideMaterials.enable && sideMaterials.type === 0 && needChangeEffectColor) {
      sideMaterials.color = effectColor;
    }
  } else if (element.type === 'styledText' && needChangeTextColor) {
    editor.changeElement({
      color: textColor
    }, element, false);
  }
} // 检查文字元素是否可以聚合文字颜色与特效颜色
// 在水印中约定：所有水印的文字颜色相同、特效颜色相同，所以返回第一个检查到的文字颜色与特效颜色

export function aggregatedTextColors(element) {
  var textColor = null;
  var effectColor = null;

  if (element.type === 'text') {
    var mainColor = element.mainColor,
        color = element.color,
        textEffects = element.textEffects,
        shadows = element.shadows;

    if (!mainColor) {
      textColor = color;
      textEffects.forEach(function (effect) {
        var _effect$filling2 = effect.filling,
            filling = _effect$filling2 === void 0 ? {} : _effect$filling2,
            _effect$stroke2 = effect.stroke,
            stroke = _effect$stroke2 === void 0 ? {} : _effect$stroke2;
        if (!effect.enable) return;

        if (filling.enable && [0, 'color'].includes(filling.type)) {
          textColor = filling.color;
        }

        if (stroke.enable) {
          effectColor = stroke.color;
        }
      });
      (shadows || []).forEach(function (shadow) {
        if (shadow.enable && shadow.color) ;
        effectColor = shadow.color;
      });
    } else {
      textColor = mainColor;
    }
  } else if (element.type === 'threeText') {
    var layer = element.layers[0];
    var frontMaterials = layer.frontMaterials,
        bevelMaterials = layer.bevelMaterials,
        sideMaterials = layer.sideMaterials;

    if (frontMaterials.type === 0) {
      textColor = frontMaterials.color;
    }

    if (bevelMaterials.enable && bevelMaterials.type === 0) {
      effectColor = bevelMaterials.color;
    } else if (sideMaterials.enable && sideMaterials.type === 0) {
      effectColor = sideMaterials.color;
    }
  } else if (element.type === 'styledText') {
    textColor = element.color;
  }

  return {
    textColor: textColor,
    effectColor: effectColor
  };
}
/**
 * 修改图片、svg 的颜色和图案
 * @param {String} effectUrl - 特效图片地址
 * @param {String} effectColor - 特效颜色
 * @param {Element} element - 元素
 * @param {Editor} editor - 编辑器实例
 */

export function changeImageColor(effectUrl, effectColor, element, editor) {
  var needChangeEffect = effectUrl;
  var needChangeEffectColor = effectColor;
  if (!needChangeEffect && !needChangeEffectColor) return;

  if (['mask', 'image'].includes(element.type)) {
    if (needChangeEffect) {
      editor.changeElement({
        url: effectUrl
      }, element, false);
    }

    if (needChangeEffectColor) {
      var imageEffects = element.imageEffects,
          _element$shadows = element.shadows,
          shadows = _element$shadows === void 0 ? [] : _element$shadows;
      imageEffects.forEach(function (effect) {
        if (!effect.enable) return;

        if (effect.filling && effect.filling.enable && [0, 'color'].includes(effect.filling.type)) {
          effect.filling.color = effectColor;
        }

        if (effect.stroke && effect.stroke.enable) {
          effect.stroke.color = effectColor;
        } else if (effect.insetShadow && effect.insetShadow.enable) {
          effect.insetShadow.color = effectColor;
        }

        updateEffect(effect);
      });
      shadows.forEach(function (shadow) {
        if (shadow.enable && shadow.color) {
          shadow.color = effectColor;
          updateShadow(shadow);
        }
      });
      editor.makeSnapshotByElement(element);
    }
  } else if (element.type === 'svg' && needChangeEffectColor) {
    var colors = element.colors;

    if (colors) {
      colors[0] = effectColor;
      editor.changeElement({
        colors: colors
      }, element, false);
    }
  }
} // 检查图片元素是否可以聚合特效颜色
// 在水印中约定：所有水印的特效颜色相同，所以返回第一个检查到的特效颜色

export function aggregatedImageColors(element) {
  var effectColor = null;

  if (['mask', 'image'].includes(element.type)) {
    var imageEffects = element.imageEffects,
        shadows = element.shadows;
    imageEffects.forEach(function (effect) {
      if (!effect.enable) return;

      if (effect.filling && effect.filling.enable && [0, 'color'].includes(effect.filling.type)) {
        effectColor = effect.filling.color;
      }

      if (effect.stroke && effect.stroke.enable) {
        effectColor = effect.stroke.color;
      } else if (effect.insetShadow && effect.insetShadow.enable) {
        effectColor = effect.insetShadow.color;
      }
    });
    shadows.forEach(function (shadow) {
      if (shadow.enable && shadow.color) {
        effectColor = shadow.color;
      }
    });
  } else if (element.type === 'svg') {
    var colors = element.colors;
    effectColor = colors && colors[0];
  }

  return effectColor;
}
var iconMap = {
  wechat: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170057-66fa.svg',
  qq: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170002-e655.svg',
  weidian: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170131-08d4.svg',
  weibo: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170118-87a3.svg',
  taobao: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170016-0871.svg',
  phone: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165936-4a8a.svg',
  mail: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165921-6eb8.svg',
  line: 'https://st0.dancf.com/csc/212/materials/40027/20200316-104225-3f7f.svg',
  ins: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165851-2a65.svg',
  instagram: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165851-2a65.svg',
  facebook: 'https://st0.dancf.com/csc/212/materials/40027/20200316-104703-0e66.svg'
};
/**
 * 根据 iconType 获取 icon 图标的地址
 * @param { String } iconType - 图标类型
 */

export function getIcon(iconType) {
  return iconMap[iconType];
}