let transformBase;
const getTransformEngine = async () => {
    transformBase = await import(
        /* webpackChunkName: "three-font-parser" */ '@gaoding/three-font-parser'
    );
};

export async function transformPath(paths, model, pathOptions) {
    const { deformation = { enable: true } } = model;
    if (deformation.enable) {
        if (!transformBase) {
            await getTransformEngine();
        }
        const { ShapePath, BendForPaths, FFDForPaths, VerbatimForPaths } = transformBase;
        const shapePaths = [];
        const tagDatas = [];

        for (let i = 0; i < paths.length; i++) {
            const { commands, lineThroughCommands, underlineCommands, clickAreaCommands } =
                paths[i];
            const shapePath = new ShapePath();
            const tagData = [];
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

        let boundingBox = {};
        let transformEngine;

        if (/^bend/.test(deformation.type) || deformation.type === 'archCurve') {
            transformEngine = new BendForPaths();
        } else if (/-byWord$/.test(deformation.type)) {
            transformEngine = new VerbatimForPaths();
        } else {
            transformEngine = new FFDForPaths();
        }
        const options = Object.assign(pathOptions, deformation);

        if (transformEngine) {
            boundingBox = transformEngine.transform(shapePaths, options);
        }

        for (let i = 0; i < shapePaths.length; i++) {
            const shapePath = shapePaths[i];
            const tagData = tagDatas[i];
            const newCommands = [];
            const newLineThroughCommands = [];
            const newUnderlineCommands = [];
            const newClickAreaCommands = [];

            const { subPaths } = shapePath;

            for (let j = 0; j < subPaths.length; j++) {
                const { curves } = subPaths[j];
                let currentCommands;
                if (j < tagData[0]) {
                    currentCommands = newCommands;
                } else if (j < tagData[1]) {
                    currentCommands = newLineThroughCommands;
                } else if (j < tagData[2]) {
                    currentCommands = newUnderlineCommands;
                } else if (j < tagData[3]) {
                    currentCommands = newClickAreaCommands;
                }
                const startPoint = curves[0].type === 'LineCurve' ? curves[0].v1 : curves[0].v0;
                currentCommands.push({
                    type: 'M',
                    x: startPoint.x,
                    y: startPoint.y,
                });

                for (let k = 0, l = curves.length; k < l; k++) {
                    const curve = curves[k];
                    let command;
                    const { v1, v2, v3 } = curve;
                    switch (curve.type) {
                        case 'LineCurve':
                            command =
                                k === l - 1
                                    ? {
                                          type: 'Z',
                                      }
                                    : {
                                          type: 'L',
                                          x: v2.x,
                                          y: v2.y,
                                      };
                            break;
                        case 'QuadraticBezierCurve':
                            command = {
                                type: 'Q',
                                x1: v1.x,
                                y1: v1.y,
                                x: v2.x,
                                y: v2.y,
                            };
                            break;
                        case 'CubicBezierCurve':
                            command = {
                                type: 'C',
                                x1: v1.x,
                                y1: v1.y,
                                x2: v2.x,
                                y2: v2.y,
                                x: v3.x,
                                y: v3.y,
                            };
                    }
                    currentCommands.push(command);
                }
            }
            paths[i].commands = newCommands;
            paths[i].lineThroughCommands = newLineThroughCommands;
            paths[i].underlineCommands = newUnderlineCommands;
            paths[i].clickAreaCommands = newClickAreaCommands;
        }
        return boundingBox;
    } else {
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        for (let i = 0; i < paths.length; i++) {
            const { clickAreaCommands } = paths[i];
            for (let j = 0; j < clickAreaCommands.length; j++) {
                const command = clickAreaCommands[j];
                if (command.x) {
                    xMin = Math.min(xMin, command.x);
                    xMax = Math.max(xMax, command.x);
                    yMin = Math.min(yMin, command.y);
                    yMax = Math.max(yMax, command.y);
                }
            }
        }
        return {
            width: xMax - xMin,
            height: yMax - yMin,
            min: { x: xMin, y: yMin },
            max: { x: xMax, y: yMax },
        };
    }
}

function pathsToShapePaths(commands, shapePath) {
    let startX, startY;
    for (let j = 0, l = commands.length; j < l; j++) {
        const coord = commands[j];
        switch (coord.type) {
            case 'M': // moveTo
                startX = coord.x;
                startY = coord.y;
                shapePath.moveTo(coord.x, coord.y);
                break;
            case 'L': // lineTo
                shapePath.lineTo(coord.x, coord.y);
                break;
            case 'C': // bezierCurveTo
                shapePath.bezierCurveTo(coord.x1, coord.y1, coord.x2, coord.y2, coord.x, coord.y);
                break;
            case 'Q': // quadraticCurveTo
                shapePath.quadraticCurveTo(coord.x1, coord.y1, coord.x, coord.y);
                break;
            case 'Z': // lineTo
                shapePath.lineTo(startX, startY);
                break;
            default:
                console.info(coord.type, coord, 'kuake is sb');
        }
    }
}
