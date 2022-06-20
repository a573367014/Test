/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

import earcut from 'earcut';
import { debug } from '../../../utils';
import * as poly2tri from 'poly2tri';

const ShapeUtils = {
    // calculate area of the contour polygon

    area: function (contour) {
        const n = contour.length;
        let a = 0.0;

        for (let p = n - 1, q = 0; q < n; p = q++) {
            a += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
        }

        return a * 0.5;
    },

    isClockWise: function (pts) {
        return ShapeUtils.area(pts) < 0;
    },

    triangulateShape: function (contour, holes) {
        const vertices = []; // flat array of vertices like [ x0,y0, x1,y1, x2,y2, ... ]
        const holeIndices = []; // array of hole indices
        const faces = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

        removeDupEndPts(contour);
        addContour(vertices, contour);

        //

        let holeIndex = contour.length;

        holes.forEach(removeDupEndPts);

        for (let i = 0; i < holes.length; i++) {
            holeIndices.push(holeIndex);
            holeIndex += holes[i].length;
            addContour(vertices, holes[i]);
        }

        //

        const triangles = earcut(vertices, holeIndices);

        //

        for (let i = 0; i < triangles.length; i += 3) {
            faces.push(triangles.slice(i, i + 3));
        }

        return faces;
    },

    // yunyang todo
    triangulateShapePoly2tri: function (contour, holes) {
        removeDupEndPts(contour);
        holes.forEach(removeDupEndPts);

        const pointMap = {};
        let count = 0;

        let points = makePoints(contour);

        const sweepContext = new poly2tri.SweepContext(points);

        for (let i = 0, il = holes.length; i < il; i++) {
            points = makePoints(holes[i]);

            sweepContext.addHole(points);

            points = points.concat(points);
        }

        const object = sweepContext.triangulate();

        const triangles = object.triangles_;

        let a;
        let b;
        let c;
        const result = [];

        for (let i = 0, il = triangles.length; i < il; i++) {
            points = triangles[i].points_;

            a = pointMap[points[0].x + ',' + points[0].y];
            b = pointMap[points[1].x + ',' + points[1].y];
            c = pointMap[points[2].x + ',' + points[2].y];

            result.push([a, b, c]);
        }

        return result;

        function makePoints(a) {
            const il = a.length;
            const points = [];

            for (let i = 0; i < il; i++) {
                points.push(new poly2tri.Point(a[i].x, a[i].y));
                pointMap[a[i].x + ',' + a[i].y] = count;
                count++;
            }

            return points;
        }
    },
    triangulateShapeTessy: function (contour, holes, tessy) {
        removeDupEndPts(contour);
        holes.forEach(removeDupEndPts);

        const triangles = [];
        const pointMap = {};
        let count = 0;

        // libtess will take 3d verts and flatten to a plane for tesselation
        // since only doing 2d tesselation here, provide z=1 normal to skip
        // iterating over verts only to get the same answer.
        // comment out to test normal-generation code
        tessy.gluTessNormal(0, 0, 1);

        tessy.gluTessBeginPolygon(triangles);

        let points = makePoints(contour);

        for (let i = 0, il = holes.length; i < il; i++) {
            points = makePoints(holes[i]);
        }

        tessy.gluTessEndPolygon();

        debug.log('tessy tesselation');

        let a;
        let b;
        let c;
        const result = [];

        for (let i = 0, il = triangles.length; i < il; i += 6) {
            a = pointMap[triangles[i] + ',' + triangles[i + 1]];
            b = pointMap[triangles[i + 2] + ',' + triangles[i + 3]];
            c = pointMap[triangles[i + 4] + ',' + triangles[i + 5]];

            result.push([a, b, c]);
        }

        return result;

        function makePoints(a) {
            const il = a.length;

            tessy.gluTessBeginContour();

            for (let i = 0; i < il; i++) {
                const coordinates = [a[i].x, a[i].y, 0];
                tessy.gluTessVertex(coordinates, coordinates);
                pointMap[a[i].x + ',' + a[i].y] = count;
                count++;
            }

            tessy.gluTessEndContour();

            return points;
        }
    },
};

function removeDupEndPts(points) {
    const l = points.length;

    if (l > 2 && points[l - 1].equals(points[0])) {
        points.pop();
    }
}

function addContour(vertices, contour) {
    for (let i = 0; i < contour.length; i++) {
        vertices.push(contour[i].x);
        vertices.push(contour[i].y);
    }
}

export { ShapeUtils };
