import { parse as opentypeParse } from 'opentype.js';
import { debug } from '../utils';

export function parse(fontFile) {
    const font = opentypeParse(fontFile);
    const emSize = font.unitsPerEm || 2048;
    const scale = 1;
    const result = { glyphs: {} };

    const glyphs = Object.values(font.glyphs.glyphs);
    result.supportedGlyphs = [];
    glyphs.forEach((glyph) => {
        if (glyph.unicode !== undefined) {
            const glyphCharacter = String.fromCharCode(glyph.unicode);
            result.supportedGlyphs.push(glyphCharacter);

            Object.defineProperty(result.glyphs, glyphCharacter, {
                get() {
                    const token = {};
                    let commands = glyph.path.commands;
                    token.ha = Math.round(glyph.advanceWidth * scale);
                    token.x_min = Math.round(glyph.xMin * scale);
                    token.x_max = Math.round(glyph.xMax * scale);
                    token.o = '';

                    const reverseTagList = checkIfNeedReverseForEveryPolys(
                        commands,
                        glyphCharacter,
                    );
                    commands = reverseCommands(commands, reverseTagList);
                    const parentOfHoles = getFirstParentOfHoles(commands, glyphCharacter);
                    const Polycommands = getPolygonsCommand(commands, glyphCharacter);
                    commands = rearrangeCommands(Polycommands, parentOfHoles);

                    commands.forEach((command) => {
                        if (command.type.toLowerCase() === 'c') {
                            command.type = 'b';
                        }
                        token.o += command.type.toLowerCase();
                        token.o += ' ';
                        if (command.x !== undefined && command.y !== undefined) {
                            token.o += Math.round(command.x * scale);
                            token.o += ' ';
                            token.o += Math.round(command.y * scale);
                            token.o += ' ';
                        }
                        if (command.x1 !== undefined && command.y1 !== undefined) {
                            token.o += Math.round(command.x1 * scale);
                            token.o += ' ';
                            token.o += Math.round(command.y1 * scale);
                            token.o += ' ';
                        }
                        if (command.x2 !== undefined && command.y2 !== undefined) {
                            token.o += Math.round(command.x2 * scale);
                            token.o += ' ';
                            token.o += Math.round(command.y2 * scale);
                            token.o += ' ';
                        }
                    });

                    return token;
                },
            });
        }
    });
    result.familyName = font.familyName;
    result.lineHeightData = {
        ascender: font.ascender,
        descender: font.descender,
        emSize,
    };
    result.underlinePosition = Math.round(font.tables.post.underlinePosition * scale);
    result.underlineThickness = Math.round(font.tables.post.underlineThickness * scale);
    const { head } = font.tables;
    result.boundingBox = {
        yMin: Math.round(head.yMin * scale),
        xMin: Math.round(head.xMin * scale),
        yMax: Math.round(head.yMax * scale),
        xMax: Math.round(head.xMax * scale),
    };
    result.resolution = 1000;
    result.original_font_information = font.tables.name;
    const styleName = font.names.fontSubfamily.en;
    if (styleName.toLowerCase().indexOf('bold') > -1) {
        result.cssFontWeight = 'bold';
    } else {
        result.cssFontWeight = 'normal';
    }

    if (styleName.toLowerCase().indexOf('italic') > -1) {
        result.cssFontStyle = 'italic';
    } else {
        result.cssFontStyle = 'normal';
    }

    return result;
}

export function reverseCommands(commands, reverseTagList) {
    if (reverseTagList === undefined) {
        debug.log('error: reverseCommands: not specify reverseTagList, return original commands');
        return commands;
    }
    const paths = [];
    let path;

    commands.forEach(function (c) {
        if (c.type.toLowerCase() === 'm') {
            path = [c];
            paths.push(path);
        } else if (c.type.toLowerCase() !== 'z') {
            path.push(c);
        }
    });

    const reversed = [];
    // paths.forEach(function(p) {
    for (let pathID = 0; pathID < paths.length; pathID++) {
        // if don't need reverse， just copy original cmommands
        if (!reverseTagList[pathID]) {
            const p = paths[pathID];
            for (let i = 0; i < p.length; i++) {
                reversed.push(p[i]);
            }
            const result = { type: 'z' };
            reversed.push(result);
            continue;
        }

        // else need reverse
        const p = paths[pathID];
        let result = { type: 'm', x: p[p.length - 1].x, y: p[p.length - 1].y };
        reversed.push(result);
        for (let i = p.length - 1; i > 0; i--) {
            const command = p[i];
            result = { type: command.type };
            if (command.x2 !== undefined && command.y2 !== undefined) {
                result.x1 = command.x2;
                result.y1 = command.y2;
                result.x2 = command.x1;
                result.y2 = command.y1;
            } else if (command.x1 !== undefined && command.y1 !== undefined) {
                result.x1 = command.x1;
                result.y1 = command.y1;
            }
            result.x = p[i - 1].x;
            result.y = p[i - 1].y;
            reversed.push(result);
        }
        result = { type: 'z' };
        reversed.push(result);
    }

    return reversed;
}

function getArea(points) {
    const n = points.length;
    let a = 0.0;

    for (let p = n - 1, q = 0; q < n; p = q++) {
        a += points[p].x * points[q].y - points[q].x * points[p].y;
    }
    return a * 0.5;
}

function getAbsArea(points) {
    const n = points.length;
    let a = 0.0;

    for (let p = n - 1, q = 0; q < n; p = q++) {
        a += points[p].x * points[q].y - points[q].x * points[p].y;
    }
    return Math.abs(a * 0.5);
}

function isClockwise(points) {
    return getArea(points) < 0;
}

export function isCommandClockWise(commands) {
    const typeZIndex = commands.findIndex((command) => /z/i.test(command.type));
    const outline = commands.slice(0, typeZIndex).map((command) => [command.x, command.y]);

    return isClockwise(outline);
}

function getPolygons(commands) {
    const paths = [];
    let path;

    commands.forEach((c) => {
        if (c.type.toLowerCase() === 'm') {
            path = [c];
            paths.push(path);
        } else if (c.type.toLowerCase() !== 'z') {
            path.push(c);
        }
    });

    const polys = [];
    paths.forEach((p) => {
        const poly = [];
        for (let i = 0; i < p.length; i++) {
            const command = p[i];
            if (command.x2 !== undefined && command.y2 !== undefined) {
                const point1 = { x: 0, y: 0 };
                point1.x = command.x1;
                point1.y = command.y1;
                poly.push(point1);
                const point2 = { x: 0, y: 0 };
                point2.x = command.x2;
                point2.y = command.y2;
                poly.push(point2);
            } else if (command.x1 !== undefined && command.y1 !== undefined) {
                const point1 = { x: 0, y: 0 };
                point1.x = command.x1;
                point1.y = command.y1;
                poly.push(point1);
            }
            const point = { x: 0, y: 0 };
            point.x = command.x;
            point.y = command.y;
            poly.push(point);
        }
        // make sure the polygon is closed(first and end point are the same)
        if (!(poly[0].x === poly[poly.length - 1].x && poly[0].y === poly[poly.length - 1].y)) {
            const point = { x: poly[0].x, y: poly[0].y };
            poly.push(point);
        }
        polys.push(poly);
    });
    return polys;
}

function getPolygonsCommand(commands) {
    const paths = [];
    let path;

    commands.forEach((c) => {
        if (c.type.toLowerCase() === 'm') {
            path = [c];
            paths.push(path);
        } else if (c.type.toLowerCase() !== 'z') {
            path.push(c);
        }
    });
    return paths;
}

//  The function will return YES if the point x,y is inside the polygon, or
//  NO if it is not.  If the point is exactly on the edge of the polygon,
//  then the function may return YES or NO.
// int pointInsidePolygon(glm::vec2 point, std::vector<glm::vec2> polygon)
function pointInsidePolygon(point, polygon) {
    let i;
    let j;
    let c = 0;
    for (i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (
            polygon[i].y > point.y !== polygon[j].y > point.y &&
            point.x <
                ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
                    (polygon[j].y - polygon[i].y) +
                    polygon[i].x
        ) {
            c = !c;
        }
    }
    return c;
}

function checkIfPolyIsHole(inPolyId, polygons) {
    let insideNumber = 0;
    for (let polyId = 0; polyId < polygons.length; polyId++) {
        if (polyId === inPolyId) continue;
        if (checkIfPolygon1IsInsidePolygon2(inPolyId, polyId, polygons)) {
            insideNumber++;
        }
    }
    if (insideNumber % 2 === 0) return false;
    else return true;
}

function checkIfNeedReverseForEveryPolys(commands, glyphCharacter) {
    if (commands.length === 0) return;
    const polys = getPolygons(commands, glyphCharacter);
    const reverseTagList = [];
    for (let polyId = 0; polyId < polys.length; polyId++) {
        const poly = polys[polyId];
        const isHole = checkIfPolyIsHole(polyId, polys);
        if (isHole) {
            if (isClockwise(poly)) {
                reverseTagList.push(true);
            } else {
                reverseTagList.push(false);
            }
        } else {
            if (isClockwise(poly)) {
                reverseTagList.push(false);
            } else {
                reverseTagList.push(true);
            }
        }
    }

    return reverseTagList;
}

function checkIfPolygon1IsInsidePolygon2(polyId1, polyId2, polys) {
    // strict check: if all the control points of polys[polyId]  is inside polys[polyNotHoleId]
    let insideCount = 0;
    for (let pointId = 0; pointId < polys[polyId1].length; pointId++) {
        if (pointInsidePolygon(polys[polyId1][pointId], polys[polyId2])) {
            insideCount++;
        }
    }

    // if 60% of the control points of polygons[inPolyId] is inside polygons[polyId]),
    // the polygons[inPolyId] is treated as inside polygons[polyId])
    if (insideCount / polys[polyId1].length > 0.6) {
        return true;
    } else return false;
}

// 获取孔的直接父外围轮廓
// 输入的command已经进行reverse修正，顺时针是外轮廓，逆时针是孔
function getFirstParentOfHoles(commands, glyphCharacter) {
    if (commands.length === 0) return;
    const polys = getPolygons(commands, glyphCharacter);
    const parentOfHoles = [];

    for (let polyId = 0; polyId < polys.length; polyId++) {
        const poly = polys[polyId];
        if (isClockwise(poly)) {
            const polyNode = { hole: false, parent: -1, area: -1 };
            polyNode.hole = false;
            polyNode.area = getAbsArea(poly);
            parentOfHoles.push(polyNode);
        } else {
            const polyNode = { hole: false, parent: -1, area: -1 };
            polyNode.hole = true;
            polyNode.area = getAbsArea(poly);
            parentOfHoles.push(polyNode);
        }
    }

    for (let polyId = 0; polyId < polys.length; polyId++) {
        const polyNode = parentOfHoles[polyId];
        if (polyNode.hole) {
            // find hole's first parent
            let currentParentArea = Number.MAX_VALUE;

            for (let polyNotHoleId = 0; polyNotHoleId < polys.length; polyNotHoleId++) {
                if (polyId === polyNotHoleId) continue;
                const polyNode1 = parentOfHoles[polyNotHoleId];
                // if this path is not hole
                if (
                    polyNode1.hole ||
                    !checkIfPolygon1IsInsidePolygon2(polyId, polyNotHoleId, polys) ||
                    polyNode1.area <= polyNode.area ||
                    polyNode1.area >= currentParentArea
                ) {
                    continue;
                }

                polyNode.parent = polyNotHoleId;
                currentParentArea = polyNode1.area;
            }
            if (polyNode.parent === -1) {
                console.error('polyId', polyId, 'is hole, but cannnot find parent');
            }
        }
    }

    return parentOfHoles;
}

function rearrangeCommands(Polycommands, parentOfHoles) {
    // get Hierachy
    const outlines = [];

    for (let pathID = 0; pathID < Polycommands.length; pathID++) {
        const polyNode = parentOfHoles[pathID];
        if (!polyNode.hole) {
            const outlineNode = { path_id: pathID, child: [] };
            outlines.push(outlineNode);
        }
    }

    for (let i = 0; i < Polycommands.length; i++) {
        const polyNode = parentOfHoles[i];
        if (polyNode.hole) {
            for (let j = 0; j < outlines.length; j++) {
                if (outlines[j].path_id === polyNode.parent) {
                    outlines[j].child.push(i);
                }
            }
        }
    }

    const rearrange = [];
    for (let i = 0; i < outlines.length; i++) {
        const outline = outlines[i];
        const p = Polycommands[outline.path_id];
        for (let i = 0; i < p.length; i++) {
            rearrange.push(p[i]);
        }
        const result = { type: 'z' };
        rearrange.push(result);

        for (let j = 0; j < outline.child.length; j++) {
            const p = Polycommands[outline.child[j]];
            for (let i = 0; i < p.length; i++) {
                rearrange.push(p[i]);
            }
            const result = { type: 'z' };
            rearrange.push(result);
        }
    }

    return rearrange;
}
