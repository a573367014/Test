import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
var transformBase;

var getTransformEngine = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return import(
            /* webpackChunkName: "three-font-parser" */
            '@gaoding/three-font-parser');

          case 2:
            transformBase = _context.sent;

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getTransformEngine() {
    return _ref.apply(this, arguments);
  };
}();

export function transformPath(_x, _x2, _x3) {
  return _transformPath.apply(this, arguments);
}

function _transformPath() {
  _transformPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(paths, model, pathOptions) {
    var _model$deformation, deformation, _transformBase, ShapePath, BendForPaths, FFDForPaths, VerbatimForPaths, shapePaths, tagDatas, i, _paths$i, commands, lineThroughCommands, underlineCommands, clickAreaCommands, shapePath, tagData, boundingBox, transformEngine, options, _i, _shapePath, _tagData, newCommands, newLineThroughCommands, newUnderlineCommands, newClickAreaCommands, subPaths, j, curves, currentCommands, startPoint, k, l, curve, command, v1, v2, v3, xMin, xMax, yMin, yMax, _i2, _clickAreaCommands, _j, _command;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _model$deformation = model.deformation, deformation = _model$deformation === void 0 ? {
              enable: true
            } : _model$deformation;

            if (!deformation.enable) {
              _context2.next = 59;
              break;
            }

            if (transformBase) {
              _context2.next = 5;
              break;
            }

            _context2.next = 5;
            return getTransformEngine();

          case 5:
            _transformBase = transformBase, ShapePath = _transformBase.ShapePath, BendForPaths = _transformBase.BendForPaths, FFDForPaths = _transformBase.FFDForPaths, VerbatimForPaths = _transformBase.VerbatimForPaths;
            shapePaths = [];
            tagDatas = [];

            for (i = 0; i < paths.length; i++) {
              _paths$i = paths[i], commands = _paths$i.commands, lineThroughCommands = _paths$i.lineThroughCommands, underlineCommands = _paths$i.underlineCommands, clickAreaCommands = _paths$i.clickAreaCommands;
              shapePath = new ShapePath();
              tagData = [];
              pathsToShapePaths(commands, shapePath);
              tagData.push(shapePath.subPaths.length);
              pathsToShapePaths(lineThroughCommands, shapePath);
              tagData.push(shapePath.subPaths.length);
              pathsToShapePaths(underlineCommands, shapePath);
              tagData.push(shapePath.subPaths.length);
              pathsToShapePaths(clickAreaCommands, shapePath);
              tagData.push(shapePath.subPaths.length);
              shapePaths.push(shapePath);
              tagDatas.push(tagData);
            }

            boundingBox = {};

            if (/^bend/.test(deformation.type) || deformation.type === 'archCurve') {
              transformEngine = new BendForPaths();
            } else if (/-byWord$/.test(deformation.type)) {
              transformEngine = new VerbatimForPaths();
            } else {
              transformEngine = new FFDForPaths();
            }

            options = Object.assign(pathOptions, deformation);

            if (transformEngine) {
              boundingBox = transformEngine.transform(shapePaths, options);
            }

            _i = 0;

          case 14:
            if (!(_i < shapePaths.length)) {
              _context2.next = 56;
              break;
            }

            _shapePath = shapePaths[_i];
            _tagData = tagDatas[_i];
            newCommands = [];
            newLineThroughCommands = [];
            newUnderlineCommands = [];
            newClickAreaCommands = [];
            subPaths = _shapePath.subPaths;
            j = 0;

          case 23:
            if (!(j < subPaths.length)) {
              _context2.next = 49;
              break;
            }

            curves = subPaths[j].curves;
            currentCommands = void 0;

            if (j < _tagData[0]) {
              currentCommands = newCommands;
            } else if (j < _tagData[1]) {
              currentCommands = newLineThroughCommands;
            } else if (j < _tagData[2]) {
              currentCommands = newUnderlineCommands;
            } else if (j < _tagData[3]) {
              currentCommands = newClickAreaCommands;
            }

            startPoint = curves[0].type === 'LineCurve' ? curves[0].v1 : curves[0].v0;
            currentCommands.push({
              type: 'M',
              x: startPoint.x,
              y: startPoint.y
            });
            k = 0, l = curves.length;

          case 30:
            if (!(k < l)) {
              _context2.next = 46;
              break;
            }

            curve = curves[k];
            command = void 0;
            v1 = curve.v1, v2 = curve.v2, v3 = curve.v3;
            _context2.t0 = curve.type;
            _context2.next = _context2.t0 === 'LineCurve' ? 37 : _context2.t0 === 'QuadraticBezierCurve' ? 39 : _context2.t0 === 'CubicBezierCurve' ? 41 : 42;
            break;

          case 37:
            command = k === l - 1 ? {
              type: 'Z'
            } : {
              type: 'L',
              x: v2.x,
              y: v2.y
            };
            return _context2.abrupt("break", 42);

          case 39:
            command = {
              type: 'Q',
              x1: v1.x,
              y1: v1.y,
              x: v2.x,
              y: v2.y
            };
            return _context2.abrupt("break", 42);

          case 41:
            command = {
              type: 'C',
              x1: v1.x,
              y1: v1.y,
              x2: v2.x,
              y2: v2.y,
              x: v3.x,
              y: v3.y
            };

          case 42:
            currentCommands.push(command);

          case 43:
            k++;
            _context2.next = 30;
            break;

          case 46:
            j++;
            _context2.next = 23;
            break;

          case 49:
            paths[_i].commands = newCommands;
            paths[_i].lineThroughCommands = newLineThroughCommands;
            paths[_i].underlineCommands = newUnderlineCommands;
            paths[_i].clickAreaCommands = newClickAreaCommands;

          case 53:
            _i++;
            _context2.next = 14;
            break;

          case 56:
            return _context2.abrupt("return", boundingBox);

          case 59:
            xMin = Infinity;
            xMax = -Infinity;
            yMin = Infinity;
            yMax = -Infinity;

            for (_i2 = 0; _i2 < paths.length; _i2++) {
              _clickAreaCommands = paths[_i2].clickAreaCommands;

              for (_j = 0; _j < _clickAreaCommands.length; _j++) {
                _command = _clickAreaCommands[_j];

                if (_command.x) {
                  xMin = Math.min(xMin, _command.x);
                  xMax = Math.max(xMax, _command.x);
                  yMin = Math.min(yMin, _command.y);
                  yMax = Math.max(yMax, _command.y);
                }
              }
            }

            return _context2.abrupt("return", {
              width: xMax - xMin,
              height: yMax - yMin,
              min: {
                x: xMin,
                y: yMin
              },
              max: {
                x: xMax,
                y: yMax
              }
            });

          case 65:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _transformPath.apply(this, arguments);
}

function pathsToShapePaths(commands, shapePath) {
  var startX, startY;

  for (var j = 0, l = commands.length; j < l; j++) {
    var coord = commands[j];

    switch (coord.type) {
      case 'M':
        // moveTo
        startX = coord.x;
        startY = coord.y;
        shapePath.moveTo(coord.x, coord.y);
        break;

      case 'L':
        // lineTo
        shapePath.lineTo(coord.x, coord.y);
        break;

      case 'C':
        // bezierCurveTo
        shapePath.bezierCurveTo(coord.x1, coord.y1, coord.x2, coord.y2, coord.x, coord.y);
        break;

      case 'Q':
        // quadraticCurveTo
        shapePath.quadraticCurveTo(coord.x1, coord.y1, coord.x, coord.y);
        break;

      case 'Z':
        // lineTo
        shapePath.lineTo(startX, startY);
        break;

      default:
        console.info(coord.type, coord, 'kuake is sb');
    }
  }
}