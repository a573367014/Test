/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * @author mrdoob / http://mrdoob.com/
 */

import { ShapePath } from './ShapePath.js';

class Font {
    constructor(data) {
        this.type = 'Font';
        this.data = data;
        this.isFont = true;
    }

    static generateShapes(glyphs, size = 100, data, offsetScale) {
        const shapes = [];
        const pathData = createPaths(glyphs, size, data, offsetScale);
        const { paths } = pathData;
        const charFlag = [];
        let count = 0;
        for (let i = 0; i < paths.length; i++) {
            const tempShapes = paths[i].toShapes();
            shapes.push(...tempShapes);
            charFlag.push(count);
            count += tempShapes.length;
        }
        const resultData = { shapes };
        resultData.para = Object.assign({}, pathData.para, { charFlag });
        return resultData;
    }
}

function createPaths(glyphs, size = 100, data, offsetScale) {
    const { letterSpacing, lineHeight, lineHeightData, textAlign } = data;
    const { emSize = 1024 } = lineHeightData;
    const scale = size / emSize;
    const realLineHeight = size * lineHeight;

    const shapePaths = [];
    const charPosDatas = [];
    const linesWidth = [0];
    let j = 0;
    let offsetX = 0;
    let offsetY = 0;
    let k = -1;
    for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i];
        if (glyph.name === '\n') {
            linesWidth[++j] = 0;
            k = -1;
        } else {
            offsetX = glyph.ha * scale * offsetScale + letterSpacing;
            linesWidth[j] += offsetX;
            if (glyph.name && glyph.name !== ' ') {
                charPosDatas.push({
                    rowNum: j,
                    columnNum: ++k,
                });
            }
        }
    }
    const maxLineWidth = Math.max(...linesWidth);

    offsetX = 0;
    j = 0;
    for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i];
        if (glyph.name === '\n') {
            offsetY -= realLineHeight;
            switch (textAlign) {
                case 'center':
                    offsetX -= (linesWidth[j] + linesWidth[++j]) / 2;
                    break;
                case 'right':
                    offsetX -= linesWidth[++j];
                    break;
                default:
                    offsetX = 0;
            }
        } else if (glyph.name === ' ' || !glyph.name) {
            offsetX += glyph.ha * scale + letterSpacing;
        } else {
            const ret = createPath(glyph, scale, offsetX, offsetY, offsetScale);
            offsetX += ret.offsetX + letterSpacing;
            shapePaths.push(ret.path);
        }
    }

    // const ffdForPaths = new FFDForPaths();
    // ffdForPaths.FFDForPaths(shapePaths, 50, 0, 'rhomboid');
    // convertPaths(paths);
    // ffdForPaths.FFDForPaths([{subPaths:paths[1].subPaths}], 100, 0, 'rhomboid');

    // const bendForPaths = new BendForPaths();
    // bendForPaths.bendingForPaths(paths, 'vertical', 0);
    // const verbatimTrans = new VerbatimForPaths();
    // verbatimTrans.verbatimTransformation(paths, 50, 'randomSize', 10, 10);
    const resultData = { paths: shapePaths };
    resultData.para = {
        baseLineHeight: size,
        charPosDatas,
        realLineHeight,
        maxLineWidth,
    };
    // verbatimTrans.verbatimTransformation(paths, 50, 'randomSize', 10, 10, resultData.para);
    return resultData;
}

function createPath(glyph, scale, offsetX, offsetY, offsetScale) {
    if (!glyph) return;

    const shapePath = new ShapePath();

    let x, y, cpx, cpy, cpx1, cpy1, cpx2, cpy2;

    if (glyph.o) {
        const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));
        // let outline = outlineOri.slice(0);
        let startX = 0;
        let startY = 0;
        for (let i = 0, l = outline.length; i < l; ) {
            const action = outline[i++];

            switch (action) {
                case 'm': // moveTo
                    x = outline[i++] * scale + offsetX;
                    y = outline[i++] * scale + offsetY;

                    shapePath.moveTo(x, y);

                    startX = x;
                    startY = y;
                    break;

                case 'l': // lineTo
                    x = outline[i++] * scale + offsetX;
                    y = outline[i++] * scale + offsetY;

                    shapePath.lineTo(x, y);

                    break;

                case 'q': // quadraticCurveTo
                    cpx = outline[i++] * scale + offsetX;
                    cpy = outline[i++] * scale + offsetY;
                    cpx1 = outline[i++] * scale + offsetX;
                    cpy1 = outline[i++] * scale + offsetY;

                    shapePath.quadraticCurveTo(cpx1, cpy1, cpx, cpy);

                    break;

                case 'b': // bezierCurveTo
                    cpx = outline[i++] * scale + offsetX;
                    cpy = outline[i++] * scale + offsetY;
                    cpx1 = outline[i++] * scale + offsetX;
                    cpy1 = outline[i++] * scale + offsetY;
                    cpx2 = outline[i++] * scale + offsetX;
                    cpy2 = outline[i++] * scale + offsetY;

                    shapePath.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);

                    break;
                case 'z': // lineTo
                    x = startX;
                    y = startY;

                    shapePath.lineTo(x, y);

                    break;
            }
        }
    }

    return {
        offsetX: glyph.ha * scale * offsetScale,
        offsetY: glyph.ha * scale * offsetScale,
        path: shapePath,
    };
}

export { Font };
