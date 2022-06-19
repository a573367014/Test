import _uniq from "lodash/uniq";
import _get from "lodash/get";
import { getEffectShadowList } from "@gaoding/editor-utils/lib/effect/adaptor";
export function toRadian(angle) {
  return angle / 180 * Math.PI;
}
export function drawPath(ctx, commands, options) {
  options = Object.assign({
    strokeWidth: 1
  }, options);
  ctx.beginPath();

  for (var i = 0; i < commands.length; i++) {
    var cmd = commands[i];

    switch (cmd.type) {
      case 'M':
        ctx.moveTo(cmd.x, cmd.y);
        break;

      case 'L':
        ctx.lineTo(cmd.x, cmd.y);
        break;

      case 'C':
        ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        break;

      case 'Q':
        ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        break;

      case 'Z':
        ctx.closePath();
    }
  }

  if (!options.isOnlyStorke) {
    ctx.fillStyle = options.fillStyle;
    ctx.fill();
  }

  if (options.strokeWidth) {
    ctx.lineWidth = options.strokeWidth;
    ctx.strokeStyle = options.strokeStyle || options.color;
    ctx.stroke();
  }
} // 获取相关竖排替换表

export function getGsubVrtrCharMap(font) {
  if (!_get(font, 'tables.gsub.features') || !_get(font, 'tables.gsub.lookups')) return {};
  var gsub = font.tables.gsub;
  var features = gsub.features,
      lookups = gsub.lookups;
  var vrt2Features = [];
  var vertFeatures = [];
  var resultsMap = {};
  features.forEach(function (item) {
    if (item && item.tag === 'vrt2') {
      vrt2Features = vrt2Features.concat(item.feature);
    } else if (item && item.tag === 'vert' && !window.safari) {
      // safari 不会读这个表
      vertFeatures = vertFeatures.concat(item.feature);
    }
  });

  var fn = function fn(verts) {
    var lookupListIndexes = _uniq(verts.reduce(function (r, item) {
      return r.concat.apply(r, item.lookupListIndexes);
    }, []));

    lookupListIndexes.forEach(function (i) {
      var subtables = lookups[i].subtables;
      subtables.forEach(function (_ref) {
        var coverage = _ref.coverage,
            substitute = _ref.substitute;
        if (!coverage || !substitute) return;

        if (coverage.format === 1 && coverage.glyphs) {
          coverage.glyphs.forEach(function (code, i) {
            resultsMap[code] = substitute[i];
          });
        } else if (coverage.format === 2 && coverage.ranges) {
          coverage.ranges.forEach(function (_ref2) {
            var start = _ref2.start,
                end = _ref2.end,
                index = _ref2.index;

            for (var _i = start; _i < end + 1; _i++) {
              resultsMap[_i] = substitute[index];
              index = index + 1;
            }
          });
        }
      });
    });
  };

  fn(vertFeatures);
  fn(vrt2Features);
  return resultsMap;
}
export function drawCanvas(_ref3) {
  var ctx = _ref3.ctx,
      word = _ref3.word,
      path = _ref3.path,
      _ref3$fontWeight = _ref3.fontWeight,
      fontWeight = _ref3$fontWeight === void 0 ? 400 : _ref3$fontWeight;
  drawPath(ctx, path.commands, {
    strokeWidth: fontWeight > 400 ? 0 : word.fontWeight === 700 ? (word.fontSize * 3 / 100).toFixed(1) - 0 : 0
  });

  if (word.textDecoration === 'line-through') {
    drawPath(ctx, path.lineThroughCommands);
  }

  if (word.textDecoration === 'underline') {
    drawPath(ctx, path.underlineCommands);
  }
}
export function getEffectExpand(model, rect) {
  var width = rect.width,
      height = rect.height,
      min = rect.min;
  var totalPoleArray = [0, width, 0, height];
  getEffectShadowList(model).forEach(function (effect) {
    var offset = effect.offset,
        stroke = effect.stroke,
        shadow = effect.shadow,
        skew = effect.skew;
    var points = [{
      x: 0,
      y: 0
    }, {
      x: width,
      y: 0
    }, {
      x: 0,
      y: height
    }, {
      x: width,
      y: height
    }];

    if (skew && skew.enable) {
      points.forEach(function (point) {
        var x = point.x + point.y * Math.tan(toRadian(skew.x));
        var y = point.y + point.x * Math.tan(toRadian(skew.y));
        point.x = x;
        point.y = y;
      });
    }

    var poleArray = [0, 0, 0, 0]; // 分别是xMin, xMax = 0, yMin, yMax;

    points.forEach(function (point) {
      poleArray[0] = Math.min(poleArray[0], point.x);
      poleArray[1] = Math.max(poleArray[1], point.x);
      poleArray[2] = Math.min(poleArray[2], point.y);
      poleArray[3] = Math.max(poleArray[3], point.y);
    });

    if (offset) {
      poleArray.forEach(function (val, i, arr) {
        arr[i] = val + (i < 2 ? offset.x : offset.y);
      });
    }

    var newPoleArray1 = null;

    if (stroke && stroke.enable) {
      // const strokeExpand = stroke.width * (stroke.type === 'outer' ? 1 : 0);
      var strokeExpand = stroke.width;
      newPoleArray1 = poleArray.map(function (val, i) {
        return val + Math.pow(-1, i + 1) * strokeExpand;
      });
    }

    var newPoleArray2 = null;

    if (shadow && shadow.enable) {
      var offsetX = shadow.offsetX,
          offsetY = shadow.offsetY,
          blur = shadow.blur;
      newPoleArray2 = poleArray.map(function (val, i) {
        return val + Math.pow(-1, i + 1) * blur + (i < 2 ? offsetX || 0 : offsetY || 0);
      });
    }

    poleArray.forEach(function (val, i) {
      var func = i % 2 ? Math.max : Math.min;
      totalPoleArray[i] = func((newPoleArray1 || poleArray)[i], (newPoleArray2 || poleArray)[i], totalPoleArray[i]);
    });
  });
  return {
    width: totalPoleArray[1] - totalPoleArray[0],
    height: totalPoleArray[3] - totalPoleArray[2],
    min: {
      x: totalPoleArray[0] + min.x,
      y: totalPoleArray[2] + min.y
    }
  };
}