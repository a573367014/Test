import { TextBufferGeometry, Font } from './libs/three/Three.js';
import { parse } from './libs/facetype.js';
import { initTextGeometryOptions, replaceWithMap, debug } from './utils';
import { AI_PARAMS_MAP, VERSION } from './consts';
import {
    makeExtrudeScale,
    makeUpCurve,
    makeDownCurve,
    makeUpDownCurve,
    makeFlag,
    makeBottomSlope,
    makeTopSlope,
    makeArch,
    makeTopTrapezium,
    makeShear,
    makeSideTrapezium,
    makeChangeX,
    makeChangeY,
    makeUpDownShrink,
    makePerCharacterTransformation,
} from './transformation';
import { LRUMap } from 'lru_map';
import { cloneDeep } from 'lodash';

const bufferGeometryMap = new LRUMap(5);
export { ShapePath } from './libs/three/extras/core/ShapePath';
export * from './libs/three/deformation';

debug.log('version', `${VERSION}`);

const defaultTextGeometryOptions = {
    size: 100,
    height: 10,
    steps: 1,
    curveSegments: 10,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: -5,
    bevelSegments: 4,
    bevelType: 'quad_ellipse',
    extrudeOffsetX: 0,
    extrudeOffsetY: 0,
    laplacianIterationNumb: 0,
    shrink_factor: 0,
    enable_collision_detection: false,
    expand: 0,
    triangulateMethod: 'poly2tri', // 'earcut',
    horizon: true,
    offsetScale: 1,
    shadingSmoothAngle: 50,
    lineHeight: 1,
    letterSpacing: 1,
    modelRotate: [0, 0, 0],
    textAlign: 'center',
    writingMode: 'horizontal-tb',
    worker: true,

    isDeformationON: false, // 是否增加直线采样点
};

export async function loadFont(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const fontData = parse(arrayBuffer);
    return new Font(fontData);
}

/**
 * @param  {String} text
 * @param  {Object} options
 * @param  {THREE.Font} options.font
 * @param  {Number} options.fontSize
 * @param  {Number} options.fontHeight
 * @param  {Number} options.curveSegments
 * @param  {Number} options.fontWeight
 * @param  {Boolean} options.bevelEnabled
 * @param  {Number} options.bevelThickness
 * @param  {Number} options.bevelSize
 * @param  {Number} options.bevelSegments
 */
export async function createTextModel(text, options) {
    const textGeometryOptions = initTextGeometryOptions(
        replaceWithMap(options, AI_PARAMS_MAP),
        defaultTextGeometryOptions,
    );
    debug.log('textGeometry options is', textGeometryOptions);

    const { deformation, warpByWord } = options;
    const { intensity, type, intensity1 } = deformation;
    const isCurve = /Curve$/.test(type);
    if (isCurve && deformation.intensity) {
        textGeometryOptions.isDeformationON = true;
    }
    if (warpByWord.enable && warpByWord.pattern === '90') {
        // 圆弧形变形不支持换行，删除换行符
        text = text.replace(/\n/, '');
    }
    let key = text + options.font.url;
    for (const index in options) {
        const val = options[index];
        if (!(val instanceof Object)) {
            key += '_' + index + '_' + val;
        }
    }
    let bufferGeometry = bufferGeometryMap.get(key);
    if (!bufferGeometry) {
        bufferGeometry = new TextBufferGeometry(text, textGeometryOptions);
        try {
            await bufferGeometry.init();
        } catch (err) {
            console.info(err);
            throw new Error('Error occurred when parsing font');
        }

        const bufferGeometryCopy = cloneDeep(bufferGeometry);
        bufferGeometryCopy.initPosArray = bufferGeometry.attributes.position.array.slice();
        bufferGeometryMap.set(key, bufferGeometryCopy);
    } else {
        bufferGeometry.attributes.position.array = bufferGeometry.initPosArray.slice();
    }

    const { charPosDatas, textAlign, baseLineHeight, maxLineWidth } =
        bufferGeometry.parameters.options;
    if (warpByWord.enable) {
        const { intensity, intensity1, randNum, pattern, offsetX = 0 } = warpByWord;
        const options = {
            pattern,
            offsetX,
            intensity,
            intensity1,
            charPosDatas,
            textAlign,
            randNum,
            maxLineWidth,
        };
        makePerCharacterTransformation(bufferGeometry, options);
    }

    const pathSizeData = {
        baseLineHeight,
        maxLineWidth,
    };

    switch (type) {
        case 'none':
            break;
        case 'archCurve':
            makeArch(bufferGeometry, pathSizeData, intensity);
            break;
        case 'concaveCurve':
            makeUpDownCurve(bufferGeometry, pathSizeData, -intensity);
            break;
        case 'upperArchCurve':
            makeUpCurve(bufferGeometry, pathSizeData, intensity);
            break;
        case 'lowerArchCurve':
            makeDownCurve(bufferGeometry, pathSizeData, -intensity);
            break;
        case 'bulbCurve':
            makeUpDownCurve(bufferGeometry, pathSizeData, intensity);
            break;
        case 'skew':
            makeShear(bufferGeometry, pathSizeData, intensity, -intensity1);
            break;
        case 'flagCurve':
            makeFlag(bufferGeometry, pathSizeData, intensity);
            break;
        case 'trapezoid':
            makeTopTrapezium(bufferGeometry, pathSizeData, intensity, intensity1);
            break;
        case 'lowerTrapezoid':
            makeBottomSlope(bufferGeometry, pathSizeData, -intensity, intensity1);
            break;
        case 'topTrapezoid':
            makeTopSlope(bufferGeometry, pathSizeData, -intensity, intensity1);
            break;
        case 'horizontalTrapezoid':
            makeSideTrapezium(bufferGeometry, pathSizeData, -intensity, intensity1);
            break;
        case 'bevel':
            makeUpDownShrink(bufferGeometry, pathSizeData, intensity, intensity);
            break;
        case 'upperRoof':
            makeUpDownShrink(bufferGeometry, pathSizeData, intensity, 0);
            break;
        case 'lowerRoof':
            makeUpDownShrink(bufferGeometry, pathSizeData, 0, -intensity);
            break;
        case 'angledProjection':
            makeUpDownShrink(bufferGeometry, pathSizeData, intensity, -intensity);
            break;
        case 'foldedCorner':
            makeUpDownShrink(bufferGeometry, pathSizeData, -intensity, intensity);
            break;
        case 'lateralStretching':
            makeChangeX(bufferGeometry, pathSizeData, intensity);
            break;
        case 'verticalStretching':
            makeChangeY(bufferGeometry, pathSizeData, intensity);
            break;
    }

    debug.time('字体挤出缩放');
    makeExtrudeScale(bufferGeometry, deformation.extrudeScaleX, deformation.extrudeScaleY);
    debug.timeEnd('字体挤出缩放');

    bufferGeometry.center();
    bufferGeometry.computeBoundingBox();

    const indexs = bufferGeometry.index;
    const positions = bufferGeometry.getAttribute('position');
    const normals = bufferGeometry.getAttribute('normal');
    const uvs = bufferGeometry.getAttribute('uv');
    const { boundingBox, groups } = bufferGeometry;

    debug.log('bufferGeometry vertex count' + positions.count);

    const { bevelEnabled } = textGeometryOptions;
    let [sideCount, bevelCount, frontCount] = [0, 0, 0];
    for (let i = 0; i < groups.length; i++) {
        const k = bevelEnabled ? i % 3 : (i % 2) * 2;
        switch (k) {
            case 0:
                frontCount += groups[i].count;
                break;
            case 1:
                bevelCount += groups[i].count;
                break;
            case 2:
                sideCount += groups[i].count;
                break;
        }
    }
    const indexArray = [
        new Uint32Array(frontCount),
        new Uint32Array(bevelCount),
        new Uint32Array(sideCount),
    ];
    const offSet = [0, 0, 0];
    for (let i = 0; i < groups.length; i++) {
        const k = bevelEnabled ? i % 3 : (i % 2) * 2;
        const { start, count } = groups[i];
        if (indexArray[k].length) {
            indexArray[k].set(indexs.array.slice(start, start + count), offSet[k]);
        }
        offSet[k] += groups[i].count;
    }

    const data = {
        position: new Float32Array(positions.array),
        normal: new Float32Array(normals.array),
        texCoord: new Float32Array(uvs.array),
    };

    const model = {
        data,
        indexArray,
        boundingBox: {
            min: [boundingBox.min.x, boundingBox.min.y, boundingBox.min.z],
            max: [boundingBox.max.x, boundingBox.max.y, boundingBox.max.z],
        },
    };

    return model;
}
