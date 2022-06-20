import { mat3, mat4, vec3, quat } from 'gl-matrix';
import { multiplyVec3 } from './math';
import tinycolor from 'tinycolor2';
import { config } from '../data/config';

export const getViewMat = (eye = [0, 0, 700], center = [0, 0, 0], up = [0, 1, 0]) => {
    return mat4.lookAt([], eye, center, up);
};

export const rotateCamera = (rotate3d = [0, 0, 0], cameraDistance = 700) => {
    // rotate3d[0]接近 Math.PI/2 时由于上方向操作会变的很敏感
    const maxAngle = Math.PI * 0.4;
    rotate3d[0] = Math.sign(rotate3d[0]) * Math.min(Math.abs(rotate3d[0]), maxAngle);
    const eye = vec3.fromValues(0, 0, cameraDistance);
    const rotateMat = mat4.create();
    mat4.rotateX(rotateMat, rotateMat, -rotate3d[0]);
    mat4.rotateY(rotateMat, rotateMat, -rotate3d[1]);
    vec3.transformMat4(eye, eye, rotateMat);
    return eye;
};

export const getOrthoProjMat = (
    left = -2,
    right = 2,
    bottom = -2,
    top = 2,
    near = 0.1,
    far = 100,
) => {
    return mat4.ortho([], left, right, bottom, top, near, far);
};

export const getProjMat = (canvas, viewAngle = Math.PI / 6, zNear = 0.1, zFar = 5000) => {
    const aspect = canvas.width / canvas.height;
    return mat4.perspective([], viewAngle, aspect, zNear, zFar);
};

export const getModelMat = (rotate3d = [0, 0, 0], translateVec = [0, 0, 0], scale = [1, 1, 1]) => {
    const eulerAngle = rotate3d.map((x) => (x * 180) / Math.PI);
    const rotateQuat1 = quat.fromEuler([], ...eulerAngle);
    const modelMat = mat4.fromRotationTranslationScale([], rotateQuat1, translateVec, scale);
    return modelMat;
};

export const getMvpMat = (modelMat, viewMat, projMat) => {
    return mat4.multiply([], projMat, mat4.multiply([], viewMat, modelMat));
};

export const getTexMat = (translateVec = [0, 0], angle = 0, scale = [1, 1]) => {
    const texMat = mat3.create();
    mat3.rotate(texMat, texMat, angle);
    mat3.translate(texMat, texMat, translateVec);
    mat3.scale(texMat, texMat, scale);
    return texMat;
};

export const getModelSize = (
    boundingBox,
    mvpMat,
    shadowMatrix,
    shadow = {
        enable: false,
        blur: 10, // 模糊半径
        offset: 0, // 相对值 0～1
        opacity: 1, // 暂时没用
        angle: 0, // 偏移角度 单位度
    },
) => {
    const borderPoints = [
        boundingBox.min,
        [boundingBox.min[0], boundingBox.min[1], boundingBox.max[2]],
        [boundingBox.min[0], boundingBox.max[1], boundingBox.min[2]],
        [boundingBox.min[0], boundingBox.max[1], boundingBox.max[2]],
        [boundingBox.max[0], boundingBox.min[1], boundingBox.min[2]],
        [boundingBox.max[0], boundingBox.min[1], boundingBox.max[2]],
        [boundingBox.max[0], boundingBox.max[1], boundingBox.min[2]],
        boundingBox.max,
    ];

    for (let i = 0; i < 8; i++) {
        borderPoints[i] = multiplyVec3(mvpMat, borderPoints[i]);
    }
    // initBox = [minX,maxX,minY,maxY]
    const initBox = [
        borderPoints[0][0],
        borderPoints[0][0],
        borderPoints[0][1],
        borderPoints[0][1],
    ];
    for (let i = 1; i < 8; i++) {
        initBox[0] = Math.min(initBox[0], borderPoints[i][0]);
        initBox[1] = Math.max(initBox[1], borderPoints[i][0]);
        initBox[2] = Math.min(initBox[2], borderPoints[i][1]);
        initBox[3] = Math.max(initBox[3], borderPoints[i][1]);
    }
    if (shadow.enable && shadowMatrix) {
        const radiusTmp = Math.ceil(shadow.blur * 6.0 + 1.0);
        const blur = Math.log(radiusTmp / config.offscreenSize + 1);
        const shadowPoints = [
            [initBox[0], initBox[3], 0],
            [initBox[1], initBox[2], 0],
        ];
        const shadowBox = shadowPoints.map((element) => multiplyVec3(shadowMatrix, element));
        const shadowBoxAfterBlur = [
            shadowBox[0][0] - blur,
            shadowBox[1][0] + blur,
            shadowBox[1][1] - blur,
            shadowBox[0][1] + blur,
        ];

        initBox[0] = Math.min(shadowBoxAfterBlur[0], initBox[0]);
        initBox[1] = Math.max(shadowBoxAfterBlur[1], initBox[1]);
        initBox[2] = Math.min(shadowBoxAfterBlur[2], initBox[2]);
        initBox[3] = Math.max(shadowBoxAfterBlur[3], initBox[3]);
    }
    return initBox;
};

export const setViewAngle = (viewAngle) => {
    const oldAngle = this.envState.viewAngle;
    viewAngle *= Math.PI / 180;
    const height = Math.tan(oldAngle / 2) * this.envState.eyeDistance;
    this.setEnvState('eyeDistance', height / Math.tan(viewAngle / 2));
    this.setEnvState('viewAngle', viewAngle);
    this.setCameraRotate(this.envState.rotate3d);
};
export const createSolidCanvas = (color, width = 2, height = 2) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
};

export const createMaterialImages = () => {
    const blackCanvas = createSolidCanvas('black');
    const whiteCanvas = createSolidCanvas('white');
    const mrCanvas = createSolidCanvas('#00ffff'); // OORRMM
    const normalCanvas = createSolidCanvas('#807fff');

    return {
        u_BaseColorSampler: { image: whiteCanvas, repeat: true },
        u_NormalSampler: { image: normalCanvas, repeat: true },
        u_MetallicRoughnessSampler: { image: mrCanvas, repeat: true },
        u_EmissiveSampler: { image: blackCanvas },
        u_OcclusionSampler: { image: blackCanvas },
    };
};

export const createPointLights = () => ({
    'u_Lights[0].pos': [100, 0, 0],
    'u_Lights[0].color': [1, 1, 1],
    'u_Lights[0].strength': 1,
    'u_Lights[1].pos': [0, 0, 0],
    'u_Lights[1].color': [1, 1, 1],
    'u_Lights[1].strength': 0,
    'u_Lights[2].pos': [0, 0, 0],
    'u_Lights[2].color': [1, 1, 1],
    'u_Lights[2].strength': 0,
    'u_Lights[3].pos': [0, 0, 0],
    'u_Lights[3].color': [1, 1, 1],
    'u_Lights[3].strength': 0,
    'u_Lights[4].pos': [0, 0, 0],
    'u_Lights[4].color': [1, 1, 1],
    'u_Lights[4].strength': 0,
});

export const getMapUrls = (materials) => [
    materials.albedo.type === 1 ? materials.albedo.image : materials.albedo.color || '#ffffff',
    materials.normal,
    materials.metalRoughness,
];

export const getColorVec = (color) => {
    const tinyColor = tinycolor(color);
    const tempColor = tinyColor.toRgb();
    return [tempColor.r / 255, tempColor.g / 255, tempColor.b / 255, tinyColor.getAlpha()];
};

export const getColorVec3 = (color, strength = 1, enable = true) => {
    const tempColor = tinycolor(color).toRgb();
    const k = enable ? strength / 255 : 0;
    return [tempColor.r * k, tempColor.g * k, tempColor.b * k];
};

export const getFontParserParameter = (font, model) => {
    const layer = model.layers[0];
    const { deformation, warpByWord } = model;
    const fontParserPara = {
        font,
        fontSize: config.initFontSize,
        fontWeight: model.fontWeight,
        extrudeDepth: layer.extrudeDepth,
        curveSegments: layer.curveSegments,
        bevelEnabled: Boolean(layer.bevelSize),
        bevelThickness: layer.bevelThickness,
        bevelSize: layer.bevelSize,
        bevelSegments: 4,
        scale: layer.expand,
        extrudeOffsetX: layer.extrudeOffsetX,
        extrudeOffsetY: layer.extrudeOffsetY,
        lineHeight: model.lineHeight,
        letterSpacing: model.$relativeLetterSpacing * config.initFontSize,
        horizon: model.writingMode !== 'vertical-rl',
        textAlign: model.textAlign,
        deformation,
        warpByWord,
    };

    return fontParserPara;
};
