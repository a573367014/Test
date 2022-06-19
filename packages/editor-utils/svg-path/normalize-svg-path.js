/* eslint-disable */
const TAU = Math.PI * 2;

const mapToEllipse = ({ x, y }, rx, ry, cosphi, sinphi, centerx, centery) => {
    x *= rx;
    y *= ry;

    const xp = cosphi * x - sinphi * y;
    const yp = sinphi * x + cosphi * y;

    return {
        x: xp + centerx,
        y: yp + centery,
    };
};

const approxUnitArc = (ang1, ang2) => {
    // If 90 degree circular arc, use a constant
    // as derived from http://spencermortensen.com/articles/bezier-circle
    const a =
        ang2 === 1.5707963267948966
            ? 0.551915024494
            : ang2 === -1.5707963267948966
            ? -0.551915024494
            : (4 / 3) * Math.tan(ang2 / 4);

    const x1 = Math.cos(ang1);
    const y1 = Math.sin(ang1);
    const x2 = Math.cos(ang1 + ang2);
    const y2 = Math.sin(ang1 + ang2);

    return [
        {
            x: x1 - y1 * a,
            y: y1 + x1 * a,
        },
        {
            x: x2 + y2 * a,
            y: y2 - x2 * a,
        },
        {
            x: x2,
            y: y2,
        },
    ];
};

const vectorAngle = (ux, uy, vx, vy) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;

    let dot = ux * vx + uy * vy;

    if (dot > 1) {
        dot = 1;
    }

    if (dot < -1) {
        dot = -1;
    }

    return sign * Math.acos(dot);
};

const getArcCenter = (
    px,
    py,
    cx,
    cy,
    rx,
    ry,
    largeArcFlag,
    sweepFlag,
    sinphi,
    cosphi,
    pxp,
    pyp,
) => {
    const rxsq = Math.pow(rx, 2);
    const rysq = Math.pow(ry, 2);
    const pxpsq = Math.pow(pxp, 2);
    const pypsq = Math.pow(pyp, 2);

    let radicant = rxsq * rysq - rxsq * pypsq - rysq * pxpsq;

    if (radicant < 0) {
        radicant = 0;
    }

    radicant /= rxsq * pypsq + rysq * pxpsq;
    radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);

    const centerxp = ((radicant * rx) / ry) * pyp;
    const centeryp = ((radicant * -ry) / rx) * pxp;

    const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
    const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;

    const vx1 = (pxp - centerxp) / rx;
    const vy1 = (pyp - centeryp) / ry;
    const vx2 = (-pxp - centerxp) / rx;
    const vy2 = (-pyp - centeryp) / ry;

    let ang1 = vectorAngle(1, 0, vx1, vy1);
    let ang2 = vectorAngle(vx1, vy1, vx2, vy2);

    if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= TAU;
    }

    if (sweepFlag === 1 && ang2 < 0) {
        ang2 += TAU;
    }

    return [centerx, centery, ang1, ang2];
};

const arcToBezier = ({
    px,
    py,
    cx,
    cy,
    rx,
    ry,
    xAxisRotation = 0,
    largeArcFlag = 0,
    sweepFlag = 0,
}) => {
    const curves = [];

    if (rx === 0 || ry === 0) {
        return [];
    }

    const sinphi = Math.sin((xAxisRotation * TAU) / 360);
    const cosphi = Math.cos((xAxisRotation * TAU) / 360);

    const pxp = (cosphi * (px - cx)) / 2 + (sinphi * (py - cy)) / 2;
    const pyp = (-sinphi * (px - cx)) / 2 + (cosphi * (py - cy)) / 2;

    if (pxp === 0 && pyp === 0) {
        return [];
    }

    rx = Math.abs(rx);
    ry = Math.abs(ry);

    const lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);

    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }

    let [centerx, centery, ang1, ang2] = getArcCenter(
        px,
        py,
        cx,
        cy,
        rx,
        ry,
        largeArcFlag,
        sweepFlag,
        sinphi,
        cosphi,
        pxp,
        pyp,
    );

    // If 'ang2' == 90.0000000001, then `ratio` will evaluate to
    // 1.0000000001. This causes `segments` to be greater than one, which is an
    // unecessary split, and adds extra points to the bezier curve. To alleviate
    // this issue, we round to 1.0 when the ratio is close to 1.0.
    let ratio = Math.abs(ang2) / (TAU / 4);
    if (Math.abs(1.0 - ratio) < 0.0000001) {
        ratio = 1.0;
    }

    const segments = Math.max(Math.ceil(ratio), 1);

    ang2 /= segments;

    for (let i = 0; i < segments; i++) {
        curves.push(approxUnitArc(ang1, ang2));
        ang1 += ang2;
    }

    return curves.map((curve) => {
        const { x: x1, y: y1 } = mapToEllipse(curve[0], rx, ry, cosphi, sinphi, centerx, centery);
        const { x: x2, y: y2 } = mapToEllipse(curve[1], rx, ry, cosphi, sinphi, centerx, centery);
        const { x, y } = mapToEllipse(curve[2], rx, ry, cosphi, sinphi, centerx, centery);

        return { x1, y1, x2, y2, x, y };
    });
};

function normalize(path) {
    // init state
    var prev;
    var result = [];
    var bezierX = 0;
    var bezierY = 0;
    var startX = 0;
    var startY = 0;
    var quadX = null;
    var quadY = null;
    var x = 0;
    var y = 0;

    for (var i = 0, len = path.length; i < len; i++) {
        var seg = path[i];
        var command = seg[0];

        switch (command) {
            case 'M':
                startX = seg[1];
                startY = seg[2];
                break;
            case 'A':
                var curves = arcToBezier({
                    px: x,
                    py: y,
                    cx: seg[6],
                    cy: seg[7],
                    rx: seg[1],
                    ry: seg[2],
                    xAxisRotation: seg[3],
                    largeArcFlag: seg[4],
                    sweepFlag: seg[5],
                });

                // null-curves
                if (!curves.length) continue;

                for (var j = 0, c; j < curves.length; j++) {
                    c = curves[j];
                    seg = ['C', c.x1, c.y1, c.x2, c.y2, c.x, c.y];
                    if (j < curves.length - 1) result.push(seg);
                }

                break;
            case 'S':
                // default control point
                var cx = x;
                var cy = y;
                if (prev === 'C' || prev === 'S') {
                    cx += cx - bezierX; // reflect the previous command's control
                    cy += cy - bezierY; // point relative to the current point
                }
                seg = ['C', cx, cy, seg[1], seg[2], seg[3], seg[4]];
                break;
            case 'T':
                if (prev === 'Q' || prev === 'T') {
                    quadX = x * 2 - quadX; // as with 'S' reflect previous control point
                    quadY = y * 2 - quadY;
                } else {
                    quadX = x;
                    quadY = y;
                }
                seg = quadratic(x, y, quadX, quadY, seg[1], seg[2]);
                break;
            case 'Q':
                quadX = seg[1];
                quadY = seg[2];
                seg = quadratic(x, y, seg[1], seg[2], seg[3], seg[4]);
                break;
            case 'L':
                seg = line(x, y, seg[1], seg[2]);
                break;
            case 'H':
                seg = line(x, y, seg[1], y);
                break;
            case 'V':
                seg = line(x, y, x, seg[1]);
                break;
            case 'Z':
                seg = line(x, y, startX, startY);
                break;
        }

        // update state
        prev = command;
        x = seg[seg.length - 2];
        y = seg[seg.length - 1];
        if (seg.length > 4) {
            bezierX = seg[seg.length - 4];
            bezierY = seg[seg.length - 3];
        } else {
            bezierX = x;
            bezierY = y;
        }
        result.push(seg);
    }

    return result;
}

function line(x1, y1, x2, y2) {
    return ['C', x1, y1, x2, y2, x2, y2];
}

function quadratic(x1, y1, cx, cy, x2, y2) {
    return [
        'C',
        x1 / 3 + (2 / 3) * cx,
        y1 / 3 + (2 / 3) * cy,
        x2 / 3 + (2 / 3) * cx,
        y2 / 3 + (2 / 3) * cy,
        x2,
        y2,
    ];
}

export default normalize;
/* eslint-enable */
