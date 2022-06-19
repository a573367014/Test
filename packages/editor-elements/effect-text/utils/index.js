import { getEffectShadowList } from '@gaoding/editor-utils/effect/browser/adaptor';
import { get, uniq } from 'lodash';

export function toRadian(angle) {
    return (angle / 180) * Math.PI;
}

export function drawPath(ctx, commands, options) {
    options = Object.assign({ strokeWidth: 1 }, options);
    ctx.beginPath();
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
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
}

// 获取相关竖排替换表
export function getGsubVrtrCharMap(font) {
    if (!get(font, 'tables.gsub.features') || !get(font, 'tables.gsub.lookups')) return {};
    const gsub = font.tables.gsub;
    const { features, lookups } = gsub;
    let vrt2Features = [];
    let vertFeatures = [];
    const resultsMap = {};

    features.forEach((item) => {
        if (item && item.tag === 'vrt2') {
            vrt2Features = vrt2Features.concat(item.feature);
        } else if (item && item.tag === 'vert' && !window.safari) {
            // safari 不会读这个表
            vertFeatures = vertFeatures.concat(item.feature);
        }
    });

    const fn = (verts) => {
        const lookupListIndexes = uniq(
            verts.reduce((r, item) => {
                return r.concat(...item.lookupListIndexes);
            }, []),
        );

        lookupListIndexes.forEach((i) => {
            const subtables = lookups[i].subtables;
            subtables.forEach(({ coverage, substitute }) => {
                if (!coverage || !substitute) return;
                if (coverage.format === 1 && coverage.glyphs) {
                    coverage.glyphs.forEach((code, i) => {
                        resultsMap[code] = substitute[i];
                    });
                } else if (coverage.format === 2 && coverage.ranges) {
                    coverage.ranges.forEach(({ start, end, index }) => {
                        for (let i = start; i < end + 1; i++) {
                            resultsMap[i] = substitute[index];
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

export function drawCanvas({ ctx, word, path, fontWeight = 400 }) {
    drawPath(ctx, path.commands, {
        strokeWidth:
            fontWeight > 400
                ? 0
                : word.fontWeight === 700
                ? ((word.fontSize * 3) / 100).toFixed(1) - 0
                : 0,
    });

    if (word.textDecoration === 'line-through') {
        drawPath(ctx, path.lineThroughCommands);
    }

    if (word.textDecoration === 'underline') {
        drawPath(ctx, path.underlineCommands);
    }
}

export function getEffectExpand(model, rect) {
    const { width, height, min } = rect;
    const totalPoleArray = [0, width, 0, height];
    getEffectShadowList(model).forEach((effect) => {
        const { offset, stroke, shadow, skew } = effect;
        const points = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
            { x: width, y: height },
        ];

        if (skew && skew.enable) {
            points.forEach((point) => {
                const x = point.x + point.y * Math.tan(toRadian(skew.x));
                const y = point.y + point.x * Math.tan(toRadian(skew.y));
                point.x = x;
                point.y = y;
            });
        }

        const poleArray = [0, 0, 0, 0]; // 分别是xMin, xMax = 0, yMin, yMax;
        points.forEach((point) => {
            poleArray[0] = Math.min(poleArray[0], point.x);
            poleArray[1] = Math.max(poleArray[1], point.x);
            poleArray[2] = Math.min(poleArray[2], point.y);
            poleArray[3] = Math.max(poleArray[3], point.y);
        });

        if (offset) {
            poleArray.forEach((val, i, arr) => {
                arr[i] = val + (i < 2 ? offset.x : offset.y);
            });
        }

        let newPoleArray1 = null;
        if (stroke && stroke.enable) {
            // const strokeExpand = stroke.width * (stroke.type === 'outer' ? 1 : 0);
            const strokeExpand = stroke.width;
            newPoleArray1 = poleArray.map((val, i) => {
                return val + Math.pow(-1, i + 1) * strokeExpand;
            });
        }

        let newPoleArray2 = null;
        if (shadow && shadow.enable) {
            const { offsetX, offsetY, blur } = shadow;
            newPoleArray2 = poleArray.map((val, i) => {
                return val + Math.pow(-1, i + 1) * blur + (i < 2 ? offsetX || 0 : offsetY || 0);
            });
        }

        poleArray.forEach((val, i) => {
            const func = i % 2 ? Math.max : Math.min;
            totalPoleArray[i] = func(
                (newPoleArray1 || poleArray)[i],
                (newPoleArray2 || poleArray)[i],
                totalPoleArray[i],
            );
        });
    });

    return {
        width: totalPoleArray[1] - totalPoleArray[0],
        height: totalPoleArray[3] - totalPoleArray[2],
        min: {
            x: totalPoleArray[0] + min.x,
            y: totalPoleArray[2] + min.y,
        },
    };
}
