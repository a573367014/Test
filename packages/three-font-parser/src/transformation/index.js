// import configData from './deformation-data';
import { Bend, FFD, Verbatim } from '../libs/three/deformation';
// export function makeDeformation(geometry, options) {
//     const config = configData[options.case];
//     const [intensity = 0, intensity1 = 0, intensity2 = 0] =
//     config.strengthArray.map((element, index) => {
//         return element * options.intensity[index];
//     });
//     const tranformOptions = {
//         pattern: config.pattern,
//         basisType: config.basisType,
//         intensity,
//         intensity1,
//         intensity2
//     };
//     let transformEngine;
//     switch (config.type) {
//     case 'bend':transformEngine = new BEND(); break;
//     case 'twist':transformEngine = new TWIST(); break;
//     case 'warp':transformEngine = new WARP(); break;
//     default :transformEngine = new FFD();
//     }
//     transformEngine.RUN(geometry, tranformOptions);

//     return geometry;
// }

// 拱形
export function makeArch(geometry, pathSizeData, archIntensity) {
    const ffdOptions = {
        pattern: 3,
        intensity: archIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 弯曲
export function makeBendHorizon(geometry, pathSizeData, bendHorizonIntensity) {
    const bendOptions = {
        bendType: '2',
        bend_intersity: bendHorizonIntensity,
    };
    Object.assign(bendOptions, pathSizeData);
    const bend = new Bend();
    bend.runPattern(geometry, bendOptions);

    return geometry;
}

// 弯曲
export function makeBendVertical(geometry, pathSizeData, bendVerticalIntensity) {
    const bendOptions = {
        bendType: '3',
        bend_intersity: bendVerticalIntensity,
    };
    Object.assign(bendOptions, pathSizeData);
    const bend = new Bend();
    bend.runPattern(geometry, bendOptions);

    return geometry;
}

// 下屋顶
export function makeBottomRoof(geometry, pathSizeData, bottomRoofIntensity) {
    const ffdOptions = {
        pattern: 4,
        intensity: bottomRoofIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 底部斜坡
export function makeBottomSlope(geometry, pathSizeData, bottomSlopeIntensity, changeYIntensity) {
    const ffdOptions = {
        pattern: 5,
        intensity: bottomSlopeIntensity,
        intensity1: changeYIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 梯形
export function makeBottomTrapezium(geometry, pathSizeData, bottomTrapeziumIntensity) {
    const ffdOptions = {
        pattern: 8,
        intensity: bottomTrapeziumIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// x方向变形
export function makeChangeX(geometry, pathSizeData, changeXIntensity) {
    const ffdOptions = {
        pattern: 501,
        intensity: changeXIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// y方向变形
export function makeChangeY(geometry, pathSizeData, changeYIntensity) {
    const ffdOptions = {
        pattern: 502,
        intensity: changeYIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 下弧形
export function makeDownCurve(geometry, pathSizeData, downCurveIntensity) {
    const ffdOptions = {
        pattern: 4,
        intensity: downCurveIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

export function makeExtrudeScale(geometry, scaleX, scaleY) {
    const ffdOptions = {
        pattern: 14, // text_control.ffd_pattern,
        intensity: scaleX, // x方向缩放 [-1,1] (>0 放大，<0 缩小)
        intensity1: scaleY, // y方向缩放 [-1,1] (>0 放大，<0 缩小)
        basisType: 'linear', // text_control.ffd_basisType
    };
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 扇形
export function makeFan(geometry, pathSizeData, fanIntensity) {
    const bendOptions = {
        bendType: '1',
        bend_intersity: fanIntensity,
    };
    Object.assign(bendOptions, pathSizeData);
    const bend = new Bend();
    bend.runPattern(geometry, bendOptions);

    return geometry;
}

// 旗形
export function makeFlag(geometry, pathSizeData, flagIntensity) {
    const ffdOptions = {
        pattern: 101,
        intensity: flagIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// xy切变
export function makeShearXY(geometry, pathSizeData, shearXIntensity, shearYIntensity) {
    const ffdOptions = {
        pattern: 15,
        intensity: shearXIntensity,
        intensity1: shearYIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// yz切变
export function makeShearY(geometry, pathSizeData, shearYIntensity) {
    const ffdOptions = {
        pattern: 17,
        intensity: shearYIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 斜切
export function makeShear(geometry, pathSizeData, intensity = 0, intensity1 = 0) {
    const ffdOptions = {
        pattern: 9,
        intensity,
        intensity1,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 侧边梯形
export function makeSideTrapezium(
    geometry,
    pathSizeData,
    sideTrapeziumIntensity,
    changeYIntensity,
) {
    const ffdOptions = {
        pattern: 10,
        intensity: sideTrapeziumIntensity,
        intensity1: changeYIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

//
export function makeStraightBend(geometry, pathSizeData, straightBendIntensity) {
    const ffdOptions = {
        pattern: 12,
        intensity: straightBendIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 上屋顶
export function makeTopRoof(geometry, pathSizeData, topRoofIntensity) {
    const ffdOptions = {
        pattern: 1,
        intensity: topRoofIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 顶部斜坡
export function makeTopSlope(geometry, pathSizeData, topSlopeIntensity, changeYIntensity) {
    const ffdOptions = {
        pattern: 6,
        intensity: topSlopeIntensity,
        intensity1: changeYIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 梯形
export function makeTopTrapezium(geometry, pathSizeData, topTrapeziumIntensity, changeYIntensity) {
    const ffdOptions = {
        pattern: 402,
        intensity: topTrapeziumIntensity,
        intensity1: changeYIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 上弧形
export function makeUpCurve(geometry, pathSizeData, upCurveIntensity) {
    const ffdOptions = {
        pattern: 1, // text_control.ffd_pattern,
        intensity: upCurveIntensity, // x方向缩放 [-1,1] (>0 放大，<0 缩小)
        basisType: 'bernstein', // text_control.ffd_basisType
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 上下弧形
export function makeUpDownCurve(geometry, pathSizeData, updownCurveIntensity) {
    const ffdOptions = {
        pattern: 2, // 102
        intensity: updownCurveIntensity,
        basisType: 'bernstein',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 上下
export function makeUpDownShrink(geometry, pathSizeData, upShrinkIntensity, downShrinkIntensity) {
    const ffdOptions = {
        pattern: 16,
        intensity: upShrinkIntensity,
        intensity1: downShrinkIntensity,
        basisType: 'linear',
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

// 波形
export function makeWave(geometry, pathSizeData, waveIntensity) {
    const ffdOptions = {
        pattern: 201, // text_control.ffd_pattern,
        intensity: waveIntensity, // x方向缩放 [-1,1] (>0 放大，<0 缩小)
        basisType: 'bernstein', // text_control.ffd_basisType
    };
    Object.assign(ffdOptions, pathSizeData);
    const ffd = new FFD();
    ffd.RUN(geometry, ffdOptions);

    return geometry;
}

export function makePerCharacterTransformation(geometry, options) {
    const warp = new Verbatim();
    warp.RUN(geometry, options);

    return geometry;
}
