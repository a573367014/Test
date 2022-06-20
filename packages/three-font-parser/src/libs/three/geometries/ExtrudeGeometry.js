/* eslint-disable */
/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Creates extruded geometry from a path shape.
 *
 * parameters = {
 *
 *  curveSegments: <int>, // number of points on the curves
 *  steps: <int>, // number of points for z-side extrusions / used for subdividing segments of extrude spline too
 *  depth: <float>, // Depth to extrude the shape
 *
 *  bevelEnabled: <bool>, // turn on bevel
 *  bevelThickness: <float>, // how deep into the original shape bevel goes
 *  bevelSize: <float>, // how far from shape outline is bevel
 *  bevelSegments: <int>, // number of bevel layers
 *
 *  extrudePath: <THREE.Curve> // curve to extrude shape along
 *
 *  UVGenerator: <Object> // object that provides UV generator functions
 *
 * }
 */

import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Vector2 } from '../math/Vector2.js';
import { Vector3 } from '../math/Vector3.js';
import { Box2 } from '../math/Box2';
import { ShapeUtils } from '../extras/ShapeUtils.js';

// not used for now
// const poly2tri = '';

function ExtrudeBufferGeometry(shapes, options) {
    BufferGeometry.call(this);

    this.type = 'ExtrudeBufferGeometry';

    this.parameters = {
        shapes: shapes,
        options: options,
    };

    // extrudeScale  disabled, yunyang
    options.extrudeScale = 1;

    shapes = Array.isArray(shapes) ? shapes : [shapes];

    const scope = this;

    const verticesArray = [];
    const uvArray = [];

    const curveSegmentsAdaptive =
        options.curveSegmentsAdaptive !== undefined ? options.curveSegmentsAdaptive : 0.1;

    const shapesExtractedPoints = new Array(shapes.length);

    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];
        shape.isDeformationON = options.isDeformationON;
        shapesExtractedPoints[i] = shape.extractPointsAdaptively(curveSegmentsAdaptive);
    }

    const shapes_center = new Vector2(0, 0);
    const boundingbox_for_shapes = new Box2();

    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];
        const ret = calculateShapeCenter(shape, shapesExtractedPoints[i]);
        const shape_center_ret = ret[0];
        const boundingbox = ret[1];
        shapes_center.x = shapes_center.x + shape_center_ret.x;
        shapes_center.y = shapes_center.y + shape_center_ret.y;
        boundingbox_for_shapes.union(boundingbox);
    }

    // update extrudePath
    if (options.extrudePath != undefined) {
        const vlen = options.extrudePath.points.length;
        for (let i = 0; i < vlen; i++) {
            const temp = options.extrudePath.points[i];
            options.extrudePath.points[i].set(
                temp.x + shapes_center.x,
                temp.y + shapes_center.y,
                temp.z,
            );
        }
    }

    const charVertexGroup = [];
    let charCount = 0;
    for (let i = 0, l = shapes.length; i < l; i++) {
        if (options.charFlag[charCount] == i) {
            charCount = charCount + 1;
            charVertexGroup.push(verticesArray.length / 3);
        }

        const shape = shapes[i];
        addShape(shape, shapes_center, boundingbox_for_shapes, shapesExtractedPoints[i]);
    }

    charVertexGroup.push(verticesArray.length / 3);

    for (let i = 0; i < verticesArray.length / 3; i++) {
        for (let j = 0; j < charVertexGroup.length - 1; j++) {
            if (i >= charVertexGroup[j] && i < charVertexGroup[j + 1]) {
                this.charVertexFlagArray.push(j);
                break;
            }
        }
    }

    // build geometry

    this.addAttribute('position', new Float32BufferAttribute(verticesArray, 3));
    this.addAttribute('uv', new Float32BufferAttribute(uvArray, 2));

    if (options.shadingSmoothAngle == 0) {
        this.computeVertexNormals();
    } else {
        this.computeVertexNormals4TextgeometryYunyang(options.shadingSmoothAngle);
    }

    this.mergeSameVertex();

    this.center();

    this.perCharCalculation();

    function calculateShapeCenter(shape, shapePoints) {
        const vertices = shapePoints.shape;
        const boundingbox = new Box2();
        boundingbox.setFromPoints(vertices);

        const vlen = vertices.length;
        const shapeCenter = new Vector2();
        const weight = 1.0 / vlen;
        // 计算back facing vertices的中心点
        for (let i = 0; i < vlen; i++) {
            shapeCenter.x += vertices[i].x * weight;
            shapeCenter.y += vertices[i].y * weight;
        }
        return [shapeCenter, boundingbox];
    }

    // yunyang
    function laplacianSmooth(vertices, iteration_numb) {
        if (iteration_numb == 0) return;
        for (let it = 0; it < iteration_numb; it++) {
            // const vertices_old = [].concat(vertices);//深拷贝数组
            const vertices_old = [];
            for (let i = 0; i < vertices.length; i++) {
                const vec2_temp = new Vector2();
                vec2_temp.copy(vertices[i]);
                vertices_old.push(vec2_temp);
            }

            for (
                let i = 0, il = vertices_old.length, j = il - 1, k = i + 1;
                i < il;
                i++, j++, k++
            ) {
                if (j === il) j = 0;
                if (k === il) k = 0;

                vertices[i].x = 0.5 * (vertices_old[j].x + vertices_old[k].x);
                vertices[i].y = 0.5 * (vertices_old[j].y + vertices_old[k].y);
            }
        }
    }

    function addShape(shape, shapes_center, boundingbox_for_shapes, shapePoints) {
        const placeholder = [];

        const steps = options.steps !== undefined ? options.steps : 1;
        const depth = options.depth !== undefined ? options.depth : 100;
        const scale = options.scale !== undefined ? options.scale : 0; // 基于膨胀向量进行膨胀和缩小

        const triangulateMethod =
            options.triangulateMethod !== undefined ? options.triangulateMethod : 'earcut';
        const bevelEnabled = options.bevelEnabled !== undefined ? options.bevelEnabled : true;
        let bevelThickness = options.bevelThickness !== undefined ? options.bevelThickness : 6;
        let bevelSize = options.bevelSize !== undefined ? options.bevelSize : bevelThickness - 2;
        let bevelSegments = options.bevelSegments !== undefined ? options.bevelSegments : 3;
        const bevelType = options.bevelType !== undefined ? options.bevelType : 'quad_ellipse';
        const bevelBackEnabled = false; // 背面倒角不再支持了

        const extrudePath = options.extrudePath;
        const extrudeScale = options.extrudeScale;

        const uvgen = options.UVGenerator !== undefined ? options.UVGenerator : WorldUVGenerator;

        const { extrudeOffsetX = 0 } = options;
        const { extrudeOffsetY = 0 } = options;

        const laplacianIterationNumb = options.laplacianIterationNumb;
        let uvSideWallLengthOffset = 0;

        // deprecated options

        if (options.amount !== undefined) {
            console.warn('THREE.ExtrudeBufferGeometry: amount has been renamed to depth.');
            depth = options.amount;
        }

        // const shrinkedShape = options.shrinkedShape!== undefined ? options.shrinkedShape : shape;

        //

        let extrudePts;
        let extrudeByPath = false;
        let splineTube;

        const boundingbox = new Box2();

        if (extrudePath) {
            extrudePts = extrudePath.getSpacedPoints(steps);

            extrudeByPath = true;
            bevelEnabled = false; // bevels not supported for path extrusion

            // SETUP TNB variables

            // TODO1 - have a .isClosed in spline?

            splineTube = extrudePath.computeFrenetFrames(steps, false);
        }

        // Safeguards if bevels are not enabled

        if (!bevelEnabled) {
            bevelSegments = 0;
            bevelThickness = 0;
            bevelSize = 0;
        }

        // Variables initialization

        let ahole, h, hl; // looping of holes

        let vertices = shapePoints.shape;
        let holes = shapePoints.holes;

        // todo with shrink
        const reverse = !ShapeUtils.isClockWise(vertices);

        if (reverse) {
            vertices = vertices.reverse();

            // Maybe we should also check if holes are in the opposite direction, just to be safe ...

            for (let h = 0, hl = holes.length; h < hl; h++) {
                ahole = holes[h];

                if (ShapeUtils.isClockWise(ahole)) {
                    holes[h] = ahole.reverse();
                }
            }
        }

        // yunyang, test laplacianSmooth
        laplacianSmooth(vertices, laplacianIterationNumb);
        // laplacianSmooth(shrinkedVertices, shrinkOutlineLaplacianIterationNumb);
        for (let h = 0, hl = holes.length; h < hl; h++) {
            const ahole = holes[h];
            laplacianSmooth(ahole, laplacianIterationNumb);
        }

        boundingbox.copy(boundingbox_for_shapes);

        let faces;
        if (triangulateMethod === 'earcut') {
            faces = ShapeUtils.triangulateShape(vertices, holes);
        } else if (triangulateMethod === 'poly2tri') {
            try {
                faces = ShapeUtils.triangulateShapePoly2tri(vertices, holes);
            } catch (err) {
                faces = ShapeUtils.triangulateShape(vertices, holes);
                console.error(err);
            }
        }

        /* Vertices */

        const contour = vertices; // vertices has all points but contour has only points of circumference
        // const shrinkedContour = shrinkedVertices; // vertices has all points but contour has only points of circumference

        for (let h = 0, hl = holes.length; h < hl; h++) {
            const ahole = holes[h];
            vertices = vertices.concat(ahole);
        }

        function scalePt2(pt, vec, size) {
            if (!vec) console.error('THREE.ExtrudeGeometry: vec does not exist');

            return vec.clone().multiplyScalar(size).add(pt);
        }

        let b;
        let bs;
        let t;
        let z;
        let vert;
        const vlen = vertices.length;
        //, face, flen = faces.length
        // Find directions for point movement

        function getBevelVec(inPt, inPrev, inNext) {
            let v_trans_x, v_trans_y, shrink_by; // resulting translation vector for inPt

            // good reading for geometry algorithms (here: line-line intersection)
            // http://geomalgorithms.com/a05-_intersect-1.html

            const v_prev_x = inPt.x - inPrev.x;
            const v_prev_y = inPt.y - inPrev.y;
            const v_next_x = inNext.x - inPt.x;
            const v_next_y = inNext.y - inPt.y;

            const v_prev_lensq = v_prev_x * v_prev_x + v_prev_y * v_prev_y;

            // yunyang
            if (v_prev_lensq < Number.EPSILON) console.error('inPt and inPrev are the same point');
            const v_next_lensq = v_next_x * v_next_x + v_next_y * v_next_y;
            if (v_next_lensq < Number.EPSILON) console.error('inPt and inNext are the same point');

            // check for collinear edges
            const collinear0 = v_prev_x * v_next_y - v_prev_y * v_next_x; // cross to get triangle area

            // larget epslion, yunyang，在移动端可能会有问题
            const epslion = 0.01; // 1000*Number.EPSILON;
            // debug.log('epslion is ', epslion);
            if (Math.abs(collinear0) > epslion) {
                // if ( Math.abs( collinear0 ) > Number.EPSILON ) {

                // not collinear

                // length of vectors for normalizing

                const v_prev_len = Math.sqrt(v_prev_lensq);
                const v_next_len = Math.sqrt(v_next_x * v_next_x + v_next_y * v_next_y);

                // shift adjacent points by unit vectors to the left

                const ptPrevShift_x = inPrev.x - v_prev_y / v_prev_len;
                const ptPrevShift_y = inPrev.y + v_prev_x / v_prev_len;

                const ptNextShift_x = inNext.x - v_next_y / v_next_len;
                const ptNextShift_y = inNext.y + v_next_x / v_next_len;

                // scaling factor for v_prev to intersection point

                const sf =
                    ((ptNextShift_x - ptPrevShift_x) * v_next_y -
                        (ptNextShift_y - ptPrevShift_y) * v_next_x) /
                    (v_prev_x * v_next_y - v_prev_y * v_next_x);

                // vector from inPt to intersection point

                v_trans_x = ptPrevShift_x + v_prev_x * sf - inPt.x;
                v_trans_y = ptPrevShift_y + v_prev_y * sf - inPt.y;

                // Don't normalize!, otherwise sharp corners become ugly
                //  but prevent crazy spikes
                const v_trans_lensq = v_trans_x * v_trans_x + v_trans_y * v_trans_y;
                if (v_trans_lensq <= 2) {
                    return new Vector2(v_trans_x, v_trans_y);
                } else {
                    shrink_by = Math.sqrt(v_trans_lensq / 2);
                    return new Vector2(v_trans_x / shrink_by, v_trans_y / shrink_by);
                }
            } else {
                // handle colinear, yunyang
                // debug.log("colinear", inPt, inPrev, inNext);
                // rotate v_prev 90 degree to get vector
                const v_prev_len = Math.sqrt(v_prev_lensq);
                const v_trans_x = -v_prev_y / v_prev_len;
                const v_trans_y = v_prev_x / v_prev_len;
                return new Vector2(v_trans_x, v_trans_y);
            }
        }

        function getMovement(contour, holes, bevelSize) {
            //, step){
            // const step = 0.06;
            const average_with_neighbour = false;
            const contourMovements = [];

            for (let i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
                if (j === il) j = 0;
                if (k === il) k = 0;

                //  (j)---(i)---(k)
                // debug.log('i,j,k', i, j , k)

                // contourMovements[ i ] = getBevelVec( contour[ i ], contour[ j ], contour[ k ] );//.multiplyScalar(Math.abs(bevelSize)*step);
                contourMovements[i] = getBevelVec(
                    contour[i],
                    contour[j],
                    contour[k],
                ).multiplyScalar(Math.abs(bevelSize));
            }

            // average with neighbour
            if (average_with_neighbour) {
                const contourMovements_old = [].concat(contourMovements); // 拷贝数组

                const contourMovements_temp = new Vector2();
                for (let i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
                    if (j === il) j = 0;
                    if (k === il) k = 0;
                    //  (j)---(i)---(k)
                    // debug.log('i,j,k', i, j , k)
                    contourMovements_temp.copy(contourMovements_old[i]);
                    contourMovements_temp.add(contourMovements_old[j]);
                    contourMovements_temp.add(contourMovements_old[k]);
                    contourMovements_temp.divideScalar(3);
                    contourMovements[i].copy(contourMovements_temp);
                    // contourMovements[ i ] = contourMovements_old[ j ].add(contourMovements_old[ k ]).divideScalar(2);
                }
            }

            const holesMovements = [];
            let oneHoleMovements;
            let verticesMovements = contourMovements.concat();

            for (let h = 0, hl = holes.length; h < hl; h++) {
                const ahole = holes[h];

                oneHoleMovements = [];

                for (let i = 0, il = ahole.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
                    if (j === il) j = 0;
                    if (k === il) k = 0;

                    //  (j)---(i)---(k)
                    // oneHoleMovements[ i ] = getBevelVec( ahole[ i ], ahole[ j ], ahole[ k ] );
                    oneHoleMovements[i] = getBevelVec(ahole[i], ahole[j], ahole[k]).multiplyScalar(
                        Math.abs(bevelSize),
                    );
                }

                // average  with neighbour, yunyang
                if (average_with_neighbour) {
                    // const oneHoleMovements_old = new Array();
                    // for(let i = 0; i<oneHoleMovements.length; i++)
                    // oneHoleMovements_old.push(oneHoleMovements[i]);
                    // const oneHoleMovements_old = JSON.parse(JSON.stringify(oneHoleMovements[i]));
                    const oneHoleMovements_old = [].concat(oneHoleMovements); // 拷贝数组
                    const oneHoleMovements_temp = new Vector2();
                    for (
                        let i = 0, il = ahole.length, j = il - 1, k = i + 1;
                        i < il;
                        i++, j++, k++
                    ) {
                        if (j === il) j = 0;
                        if (k === il) k = 0;

                        //  (j)---(i)---(k)
                        oneHoleMovements_temp.copy(oneHoleMovements_old[i]);
                        oneHoleMovements_temp.add(oneHoleMovements_old[j]);
                        oneHoleMovements_temp.add(oneHoleMovements_old[k]);
                        oneHoleMovements_temp.divideScalar(3);
                        oneHoleMovements[i].copy(oneHoleMovements_temp);

                        // oneHoleMovements[ i ] = oneHoleMovements_old[ i ].add(oneHoleMovements_old[ j ]).add(oneHoleMovements_old[ k ]);
                        // oneHoleMovements[ i ].divideScalar(3);
                        // oneHoleMovements[ i ] = oneHoleMovements_old[ j ].add(oneHoleMovements_old[ k ]).divideScalar(2);
                    }
                }
                holesMovements.push(oneHoleMovements);
                verticesMovements = verticesMovements.concat(oneHoleMovements);
            }
            const Arrays = new Array();
            Arrays.push(contourMovements);
            Arrays.push(holesMovements);
            Arrays.push(verticesMovements);
            return Arrays;
        }

        const Arrays = getMovement(contour, holes, bevelSize * 0.06);
        const contourMovements = Arrays[0];
        const holesMovements = Arrays[1];

        const Arrays4ExtrudeScale = getMovement(contour, holes, 0.5); // todo : 所有的getMovement调用 可以统一一下
        const contourMovements4ExtrudeScale = Arrays4ExtrudeScale[0];
        const holesMovements4ExtrudeScale = Arrays4ExtrudeScale[1];

        //
        // 放大膨胀
        //
        if (scale > 0) {
            const Arrays4Scale = getMovement(contour, holes, scale);
            const contourMovements4Scale = Arrays4Scale[0];
            const holesMovements4Scale = Arrays4Scale[1];

            for (let i = 0; i < contour.length; i++) {
                contour[i] = scalePt2(contour[i], contourMovements4Scale[i], 1);
            }

            // expand holes
            for (let h = 0; h < holes.length; h++) {
                const ahole = holes[h];
                const oneHoleMovements = holesMovements4Scale[h];
                for (let i = 0; i < ahole.length; i++) {
                    ahole[i] = scalePt2(ahole[i], oneHoleMovements[i], 1);
                }
                holes[h] = ahole;
            }
        }

        // 倒角类型
        // Math.sign(bevelSize)== -1 膨胀倒角
        // Math.sign(bevelSize)== 1 收缩倒角

        // 准备倒角生成的起始点, yunyang
        if (bevelEnabled) {
            // && false) // 现阶段不使用
            const bs = bevelSize;
            for (let i = 0; i < contour.length; i++) {
                if (Math.sign(bevelSize) == -1) {
                    // 膨胀倒角，外轮廓不收缩
                    // contour[ i ] = scalePt2( contour[ i ], contourMovements[ i ], -bs );
                    contour[i] = contour[i];
                } /// /内缩倒角，收缩
                // contour[ i ] = shrinkedContour[i].clone();
                else {
                    contour[i] = contour[i];
                }
            }

            for (let h = 0; h < holes.length; h++) {
                const ahole = holes[h];
                const oneHoleMovements = holesMovements[h];

                for (let i = 0; i < ahole.length; i++) {
                    if (Math.sign(bevelSize) == -1) {
                        // 膨胀倒角，孔不膨胀
                        // ahole[ i ] = scalePt2( ahole[ i ], oneHoleMovements[ i ], -bs );
                        ahole[i] = ahole[i];
                    }
                    // ahole[ i ] = shrinkedHoles[ h ][i].clone();
                    else {
                        ahole[i] = ahole[i];
                    }
                }
                holes[h] = ahole;
            }

            // Arrays = getMovement(contour, holes);
            // contourMovements = Arrays[0];
            // holesMovements = Arrays[1];
            // verticesMovements = Arrays[2];
        }

        let face;
        const flen = faces.length;

        // 添加 正面倒角 的点
        let il;
        for (let b = 0; b < bevelSegments; b++) {
            //
            // 计算这一层的倒角的深度z和bs
            //
            let t = b / bevelSegments;

            if (bevelType == 'quad_ellipse') {
                t = t * t;
                z = bevelThickness * Math.cos((t * Math.PI) / 2);
                bs = Math.sin((t * Math.PI) / 2);
            } else if (bevelType == 'line') {
                z = bevelThickness * (1 - t);
                bs = t;
            } else if (bevelType == 'half_ellipse') {
                z = bevelThickness * Math.cos(t * Math.PI - Math.PI / 2);
                bs = t;
            }

            //
            // 添加这一层的倒角顶点
            //
            // contract shape
            for (let i = 0, il = contour.length; i < il; i++) {
                const vert = scalePt2(contour[i], contourMovements[i], bs);
                placeholder.push(vert.x, vert.y, z);
            }

            // expand holes
            for (let h = 0, hl = holes.length; h < hl; h++) {
                const ahole = holes[h];
                const oneHoleMovements = holesMovements[h];
                for (let i = 0, il = ahole.length; i < il; i++) {
                    vert = scalePt2(ahole[i], oneHoleMovements[i], bs);
                    placeholder.push(vert.x, vert.y, z);
                }
            }
        }

        bs = bevelSize;

        // 一层一层 往z轴正方向 添加 正面 和 侧面的点
        for (let s = 0; s <= steps; s++) {
            const extrudeX = extrudeOffsetX; // depth * Math.sin(extrudeOffsetX/180 * Math.PI);
            const extrudeY = extrudeOffsetY; // depth * Math.sin(extrudeOffsetY/180 * Math.PI);

            if (bevelEnabled) {
                // yunyang 's bevel
                // extrudeScaleFactor = extrudeScale/ steps * s;
                // 外围
                for (let i = 0; i < contour.length; i++) {
                    vert = contour[i]
                        .clone()
                        .add(contourMovements[i])
                        .add(
                            contourMovements4ExtrudeScale[i]
                                .clone()
                                .multiplyScalar((extrudeScale / steps) * s),
                        );
                    placeholder.push(
                        vert.x + (extrudeX / steps) * s,
                        vert.y + (extrudeY / steps) * s,
                        (-depth / steps) * s,
                    );
                }
                // 内部孔
                for (let h = 0; h < holes.length; h++) {
                    const ahole = holes[h];
                    const oneHoleMovements = holesMovements[h];
                    const oneHoleMovements4ExtrudeScale = holesMovements4ExtrudeScale[h];
                    for (let i = 0; i < ahole.length; i++) {
                        vert = ahole[i]
                            .clone()
                            .add(oneHoleMovements[i])
                            .add(
                                oneHoleMovements4ExtrudeScale[i]
                                    .clone()
                                    .multiplyScalar((extrudeScale / steps) * s),
                            );
                        placeholder.push(
                            vert.x + (extrudeX / steps) * s,
                            vert.y + (extrudeY / steps) * s,
                            (-depth / steps) * s,
                        );
                    }
                }
            } // 没有倒角时，正面和背面的点
            else {
                // 外围
                for (let i = 0; i < contour.length; i++) {
                    vert = contour[i]
                        .clone()
                        .add(
                            contourMovements4ExtrudeScale[i]
                                .clone()
                                .multiplyScalar((extrudeScale / steps) * s),
                        );
                    placeholder.push(
                        vert.x + (extrudeX / steps) * s,
                        vert.y + (extrudeY / steps) * s,
                        (-depth / steps) * s,
                    );
                }
                // 内部孔
                for (let h = 0; h < holes.length; h++) {
                    const ahole = holes[h];
                    const oneHoleMovements = holesMovements4ExtrudeScale[h];
                    for (let i = 0; i < ahole.length; i++) {
                        vert = ahole[i]
                            .clone()
                            .add(
                                oneHoleMovements[i]
                                    .clone()
                                    .multiplyScalar((extrudeScale / steps) * s),
                            );
                        placeholder.push(
                            vert.x + (extrudeX / steps) * s,
                            vert.y + (extrudeY / steps) * s,
                            (-depth / steps) * s,
                        );
                    }
                }
            }
        }

        // 添加背面的倒角点
        if (bevelEnabled && bevelBackEnabled) {
            const extrudeX = extrudeOffsetX; // depth * Math.sin(extrudeOffsetX/180 * Math.PI);
            const extrudeY = extrudeOffsetY; // depth * Math.sin(extrudeOffsetY/180 * Math.PI);
            // for ( b = 1; b <= bevelSegments; b ++ ) {
            for (
                let b = bevelSegments - 1;
                b >= 0;
                b-- // 从倒角外围往内长
            ) {
                const t = b / bevelSegments;
                if (bevelType == 'quad_ellipse') {
                    z = bevelThickness * Math.cos((t * Math.PI) / 2);
                    bs = Math.sin((t * Math.PI) / 2);
                } else if (bevelType == 'line') {
                    z = bevelThickness * (1 - t);
                    bs = t;
                } else if (bevelType == 'half_ellipse') {
                    z = bevelThickness * Math.cos(t * Math.PI - Math.PI / 2);
                    bs = t;
                }

                // 轮廓往外长
                for (let i = 0; i < contour.length; i++) {
                    const vert = scalePt2(contour[i], contourMovements[i], bs);
                    vert.add(contourMovements4ExtrudeScale[i].clone().multiplyScalar(extrudeScale));
                    placeholder.push(vert.x + extrudeX, vert.y + extrudeY, -depth - z);
                }

                // 内孔往外长
                for (let h = 0; h < holes.length; h++) {
                    const ahole = holes[h];
                    const oneHoleMovements = holesMovements[h];
                    const oneHoleMovements4ExtrudeScale = holesMovements4ExtrudeScale[h];
                    for (let i = 0, il = ahole.length; i < il; i++) {
                        vert = scalePt2(ahole[i], oneHoleMovements[i], bs);
                        vert.add(
                            oneHoleMovements4ExtrudeScale[i].clone().multiplyScalar(extrudeScale),
                        );

                        if (!extrudeByPath) {
                            placeholder.push(vert.x + extrudeX, vert.y + extrudeY, -depth - z);
                        } else {
                            placeholder.push(
                                vert.x,
                                vert.y + extrudePts[steps - 1].y,
                                extrudePts[steps - 1].x + z,
                            );
                        }
                    }
                }
            }
        } else if (bevelEnabled && !bevelBackEnabled) {
            const extrudeX = extrudeOffsetX; // depth * Math.sin(extrudeOffsetX/180 * Math.PI);
            const extrudeY = extrudeOffsetY; // depth * Math.sin(extrudeOffsetY/180 * Math.PI);
            const s = steps;
            // 外围
            for (let i = 0; i < contour.length; i++) {
                const vert = contour[i]
                    .clone()
                    .add(
                        contourMovements4ExtrudeScale[i]
                            .clone()
                            .multiplyScalar((extrudeScale / steps) * s),
                    );
                placeholder.push(
                    vert.x + (extrudeX / steps) * s,
                    vert.y + (extrudeY / steps) * s,
                    (-depth / steps) * s,
                );
            }
            // 内部孔
            for (let h = 0; h < holes.length; h++) {
                const ahole = holes[h];
                const oneHoleMovements = holesMovements4ExtrudeScale[h];
                for (let i = 0; i < ahole.length; i++) {
                    vert = ahole[i]
                        .clone()
                        .add(
                            oneHoleMovements[i].clone().multiplyScalar((extrudeScale / steps) * s),
                        );
                    placeholder.push(
                        vert.x + (extrudeX / steps) * s,
                        vert.y + (extrudeY / steps) * s,
                        (-depth / steps) * s,
                    );
                }
            }
        }

        /* Faces */

        // Top and bottom faces

        buildLidFaces();

        buildBevelFaces();

        // Sides faces

        buildSideFaces();

        /// //  Internal functions

        function buildLidFaces() {
            const start = verticesArray.length / 3;

            if (bevelEnabled) {
                let layer = 0; // steps + 1
                let offset = vlen * layer;

                // Bottom faces

                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    triangleToPoint(face[0] + offset, face[1] + offset, face[2] + offset);
                }

                layer = steps + bevelSegments * 1; // 2;
                offset = vlen * layer;

                // Top faces

                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    triangleToPoint(face[2] + offset, face[1] + offset, face[0] + offset);
                }
            } else {
                // Bottom faces

                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    triangleToPoint(face[0], face[1], face[2]);
                }

                // Top faces

                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    triangleToPoint(
                        face[2] + vlen * steps,
                        face[1] + vlen * steps,
                        face[0] + vlen * steps,
                    );
                }
            }

            scope.addGroup(start, verticesArray.length / 3 - start, 0);
        }

        function buildBevelFaces() {
            if (bevelSegments == 0 || !bevelEnabled) return 0;

            let start = verticesArray.length / 3;
            let layeroffset = 0;
            bevelwalls(contour, layeroffset);
            layeroffset += contour.length;

            for (let h = 0, hl = holes.length; h < hl; h++) {
                ahole = holes[h];
                bevelwalls(ahole, layeroffset);

                //, true
                layeroffset += ahole.length;
            }

            scope.addGroup(start, verticesArray.length / 3 - start, 1);
        }

        function bevelwalls(contour, layeroffset) {
            let contour_length = [];

            let closedContour = [];
            for (let i = 0; i < contour.length; i++) {
                closedContour.push(contour[i]);
            }
            closedContour.push(contour[0]);

            contour_length[0] = 0;
            for (let x = 1; x < closedContour.length; x++) {
                let temp =
                    contour_length[x - 1] +
                    closedContour[x]
                        .clone()
                        .sub(closedContour[x - 1])
                        .length();
                contour_length[x] = temp;
            }

            let sl = bevelSegments;

            // calculate side wall depth length
            let sideWallLength = [];
            sideWallLength[0] = 0;
            let j = 1;
            let k = 0;
            for (let s = 0; s < sl; s++) {
                let slen1 = vlen * s;
                let slen2 = vlen * (s + 1);

                let a = layeroffset + j + slen1;
                let d = layeroffset + j + slen2;
                let va = new Vector3(
                    placeholder[a * 3 + 0],
                    placeholder[a * 3 + 1],
                    placeholder[a * 3 + 2],
                );
                let vd = new Vector3(
                    placeholder[d * 3 + 0],
                    placeholder[d * 3 + 1],
                    placeholder[d * 3 + 2],
                );

                let temp = vd.sub(va).length();
                sideWallLength.push(sideWallLength[sideWallLength.length - 1] + temp);
            }
            // console.log(sideWallLength);
            uvSideWallLengthOffset = sideWallLength[sideWallLength.length - 1];

            let i = contour.length;
            while (--i >= 0) {
                let j = i;
                let k = i - 1;
                if (k < 0) k = contour.length - 1;

                for (let s = 0; s < sl; s++) {
                    const slen1 = vlen * s;
                    const slen2 = vlen * (s + 1);

                    const a = layeroffset + j + slen1;
                    const b = layeroffset + k + slen1;
                    const c = layeroffset + k + slen2;
                    const d = layeroffset + j + slen2;

                    quadToPoint(contour_length, sideWallLength, i, s, b, a, d, c);
                }
            }
        }

        // Create faces for the z-sides of the shape

        function buildSideFaces() {
            let start = verticesArray.length / 3;
            let layeroffset = vlen * bevelSegments;
            sidewalls(contour, layeroffset);
            layeroffset += contour.length;

            for (let h = 0, hl = holes.length; h < hl; h++) {
                ahole = holes[h];
                sidewalls(ahole, layeroffset);

                layeroffset += ahole.length;
            }

            scope.addGroup(start, verticesArray.length / 3 - start, 1);
        }

        function sidewalls(contour, layeroffset) {
            let contour_length = [];

            let closedContour = [];
            for (let i = 0; i < contour.length; i++) {
                closedContour.push(contour[i]);
            }
            closedContour.push(contour[0]);

            contour_length[0] = 0;
            for (let x = 1; x < closedContour.length; x++) {
                const temp =
                    contour_length[x - 1] +
                    closedContour[x]
                        .clone()
                        .sub(closedContour[x - 1])
                        .length();
                contour_length[x] = temp;
            }

            let sl = steps;

            // calculate side wall depth length
            let sideWallLength = [];
            sideWallLength[0] = uvSideWallLengthOffset; // 0;
            let j = 1;
            let k = 0;
            for (let s = 0; s < sl; s++) {
                let slen1 = vlen * s;
                let slen2 = vlen * (s + 1);

                let a = layeroffset + j + slen1;
                let d = layeroffset + j + slen2;
                let va = new Vector3(
                    placeholder[a * 3 + 0],
                    placeholder[a * 3 + 1],
                    placeholder[a * 3 + 2],
                );
                let vd = new Vector3(
                    placeholder[d * 3 + 0],
                    placeholder[d * 3 + 1],
                    placeholder[d * 3 + 2],
                );

                let temp = vd.sub(va).length();
                sideWallLength.push(sideWallLength[sideWallLength.length - 1] + temp);
            }

            let i = contour.length;
            while (--i >= 0) {
                let j = i;
                let k = i - 1;
                if (k < 0) k = contour.length - 1;

                for (let s = 0; s < sl; s++) {
                    let slen1 = vlen * s;
                    let slen2 = vlen * (s + 1);

                    let a = layeroffset + j + slen1;
                    let b = layeroffset + k + slen1;
                    let c = layeroffset + k + slen2;
                    let d = layeroffset + j + slen2;

                    quadToPoint(contour_length, sideWallLength, i, s, b, a, d, c);
                }
            }
        }

        function triangleToPoint(a, b, c) {
            addVertex(a);
            addVertex(b);
            addVertex(c);

            const nextIndex = verticesArray.length / 3;
            const uvs = uvgen.generateTopUV(
                scope,
                verticesArray,
                boundingbox,
                nextIndex - 3,
                nextIndex - 2,
                nextIndex - 1,
            );

            addUV(uvs[0]);
            addUV(uvs[1]);
            addUV(uvs[2]);
        }

        function quadToPoint(
            contour_length,
            sideWallLength,
            uvStartIndex,
            uvStartIndexDepthDirection,
            a,
            b,
            c,
            d,
        ) {
            addVertex(a);
            addVertex(b);
            addVertex(d);

            addVertex(b);
            addVertex(c);
            addVertex(d);

            const nextIndex = verticesArray.length / 3;
            const uvs = uvgen.generateSideWallUVExtend(
                scope,
                verticesArray,
                boundingbox,
                depth,
                contour_length,
                sideWallLength,
                uvStartIndex,
                uvStartIndexDepthDirection,
                nextIndex - 6,
                nextIndex - 3,
                nextIndex - 2,
                nextIndex - 1,
            );

            addUV(uvs[0]);
            addUV(uvs[1]);
            addUV(uvs[3]);

            addUV(uvs[1]);
            addUV(uvs[2]);
            addUV(uvs[3]);
        }

        function addVertex(index) {
            verticesArray.push(
                placeholder[index * 3 + 0],
                placeholder[index * 3 + 1],
                placeholder[index * 3 + 2],
            );
        }

        function addUV(vector2) {
            uvArray.push(vector2.x);
            uvArray.push(vector2.y);
        }
    }
}

ExtrudeBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
ExtrudeBufferGeometry.prototype.constructor = ExtrudeBufferGeometry;

ExtrudeBufferGeometry.prototype.toJSON = function () {
    const data = BufferGeometry.prototype.toJSON.call(this);

    const shapes = this.parameters.shapes;
    const options = this.parameters.options;

    return toJSON(shapes, options, data);
};

function rotateCoord45degree(x, y, new_x, new_y) {
    new_x = Math.SQRT2 * x - Math.SQRT2 * y;
    new_y = Math.SQRT2 * x + Math.SQRT2 * y;
    return [new_x, new_y];
}

// https://github.com/mrdoob/three.js/issues/1824
const WorldUVGenerator = {
    generateTopUV: function (geometry, vertices, boundingbox, indexA, indexB, indexC) {
        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];

        const bb = boundingbox; // extrudedShape.boundingBox();
        const bby = bb.max.y - bb.min.y;
        const amt = bby;
        return [
            new Vector2((a_x - bb.min.x) / amt, 1 - (a_y - bb.min.y) / amt),
            new Vector2((b_x - bb.min.x) / amt, 1 - (b_y - bb.min.y) / amt),
            new Vector2((c_x - bb.min.x) / amt, 1 - (c_y - bb.min.y) / amt),
        ];
    },

    generateBottomUV: function (geometry, vertices, boundingbox, indexA, indexB, indexC) {
        return this.generateTopUV(geometry, boundingbox, indexA, indexB, indexC);
    },
    // yunyang
    generateSideWallUV: function (
        geometry,
        vertices,
        boundingbox,
        extrudeheight,
        indexA,
        indexB,
        indexC,
        indexD,
    ) {
        const ax = vertices[indexA * 3];
        const ay = vertices[indexA * 3 + 1];
        const az = vertices[indexA * 3 + 2];
        const bx = vertices[indexB * 3];
        const by = vertices[indexB * 3 + 1];
        const bz = vertices[indexB * 3 + 2];
        const cx = vertices[indexC * 3];
        const cy = vertices[indexC * 3 + 1];
        const cz = vertices[indexC * 3 + 2];
        const dx = vertices[indexD * 3];
        const dy = vertices[indexD * 3 + 1];
        const dz = vertices[indexD * 3 + 2];

        const // amt = extrudeheight,//this.extrudedOptions.amount,
            bb = boundingbox;
        const // extrudedShape.getBoundingBox(),
            bbx = bb.max.x - bb.min.x;
        const bby = bb.max.y - bb.min.y;
        const bbz = bb.max.z - bb.min.z;

        const amt = bby;

        // const ab_angle = Math.abs(ay - by) /  Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by));
        // const ab_angle = (ay - by) /  Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by));
        let ba = new Vector3(bx - ax, by - ay, 0);
        let xAxis = new Vector3(1, 0, 0);

        const abAngle = (ba.angleTo(xAxis) * 180) / Math.PI;
        if (abAngle < 0 || abAngle > 180) console.error('abAngle<0 || abAngle>180', abAngle);
        const angleConst = 30;
        // if(Math.abs(ay - by)/bbx < 0.01)
        if (abAngle < angleConst || abAngle > 180 - angleConst) {
            return [
                new Vector2(ax / amt, az / amt),
                new Vector2(bx / amt, bz / amt),
                new Vector2(cx / amt, cz / amt),
                new Vector2(dx / amt, dz / amt),
            ];
        } else if (abAngle > 90 - angleConst && abAngle < 90 + angleConst) {
            return [
                new Vector2(ay / amt, az / amt),
                new Vector2(by / amt, bz / amt),
                new Vector2(cy / amt, cz / amt),
                new Vector2(dy / amt, dz / amt),
            ];
        } else {
            const [new_ax, new_ay] = rotateCoord45degree(ax, ay);
            const [new_bx, new_by] = rotateCoord45degree(bx, by);

            let ba = new Vector3(new_bx - new_ax, new_by - new_ay, 0);
            let newAbAngle = (ba.angleTo(xAxis) * 180) / Math.PI;
            let new_amt = amt / 1.41421;
            let newAngleConst = 45 - angleConst;
            if (newAbAngle < newAngleConst || newAbAngle > 180 - newAngleConst) {
                return [
                    new Vector2(ax / new_amt, az / amt),
                    new Vector2(bx / new_amt, bz / amt),
                    new Vector2(cx / new_amt, cz / amt),
                    new Vector2(dx / new_amt, dz / amt),
                ];
            } else newAbAngle > 90 - newAngleConst && newAbAngle < 90 + newAngleConst;
            {
                return [
                    new Vector2(ay / new_amt, az / amt),
                    new Vector2(by / new_amt, bz / amt),
                    new Vector2(cy / new_amt, cz / amt),
                    new Vector2(dy / new_amt, dz / amt),
                ];
            }
        }
    },

    // yunyang
    generateSideWallUVExtend: function (
        geometry,
        vertices,
        boundingbox,
        extrudeheight,
        contour_length,
        sideWallLength,
        uvStartIndex,
        uvStartIndexDepthDirection,
        indexA,
        indexB,
        indexC,
        indexD,
    ) {
        const bb = boundingbox;
        const bby = bb.max.y - bb.min.y;

        const amt = bby;

        if (uvStartIndex - 1 < 0) {
            uvStartIndex = contour_length.length - 1;
        }

        let uv0U = contour_length[uvStartIndex - 1] / amt; /// contour_length[contour_length.length-1];
        let uv1U = contour_length[uvStartIndex] / amt; // / contour_length[contour_length.length-1];

        return [
            new Vector2(uv0U, sideWallLength[uvStartIndexDepthDirection] / amt),
            new Vector2(uv1U, sideWallLength[uvStartIndexDepthDirection] / amt),
            new Vector2(uv1U, sideWallLength[uvStartIndexDepthDirection + 1] / amt),
            new Vector2(uv0U, sideWallLength[uvStartIndexDepthDirection + 1] / amt),
        ];
    },
};

function toJSON(shapes, options, data) {
    data.shapes = [];

    if (Array.isArray(shapes)) {
        for (let i = 0, l = shapes.length; i < l; i++) {
            const shape = shapes[i];

            data.shapes.push(shape.uuid);
        }
    } else {
        data.shapes.push(shapes.uuid);
    }

    if (options.extrudePath !== undefined) data.options.extrudePath = options.extrudePath.toJSON();

    return data;
}

export { ExtrudeBufferGeometry };
