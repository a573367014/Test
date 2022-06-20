import { SchemaTypes } from '@gaoding/beam';

const { vec2, vec4, mat4, tex2D } = SchemaTypes;
const identityMat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const fillVS = `
attribute vec4 position;

uniform mat4 u_MVPMatrix;
uniform mat4 u_ShadowMatrix;

void main() {
  vec4 position = u_MVPMatrix * position;
  gl_Position = u_ShadowMatrix * position;
}
`;

const fillFS = `
precision highp float;
uniform vec4 shadowColor;

void main() {
  gl_FragColor = shadowColor;
}
`;

export const VoidFill = {
    vs: fillVS,
    fs: fillFS,
    buffers: {
        position: { type: vec4, n: 3 },
    },
    uniforms: {
        u_MVPMatrix: { type: mat4 },
        u_ShadowMatrix: { type: mat4, default: identityMat },
        shadowColor: { type: vec4, default: [0, 0, 0, 0] },
    },
};

const { int, float } = SchemaTypes;

const blurVS = `
attribute vec4 position;
attribute vec2 texCoord;
uniform vec2 shadowOffset;

varying highp vec2 vTexCoord;

void main() {
  gl_Position = position + vec4(shadowOffset * 0.1, 0, 0);
  vTexCoord = texCoord;
}
`;

const blurFS = `
/*
* 完整模糊流程：先调用横向模糊（或竖）-> Texture -> 结果纹理传入再调用竖向模糊
*/
precision highp float;
varying vec2 vTexCoord;

// 基础图层
uniform sampler2D blurImg; 
// 半径
uniform float sigma;
// 方向
uniform int direction;
// 图像宽度
uniform float imgWidth;
// 图像高度
uniform float imgHeight;

void main() {
  vec4 src = texture2D(blurImg, vTexCoord);
  float kernelRadius = ceil(sigma * 3.0 * 2.0 + 1.0);
  kernelRadius /=2.0;
  float kernelSize = kernelRadius * 2.0 + 1.0;
  // 当 sigma 小于 0 时，采用公式得到只与 n 有关的 sigma
  float sigmaX = sigma > 0.0 ? sigma : ((kernelSize - 1.0)*0.5 - 1.0)*0.3 + 0.8;
  float scale2X = -0.5 / (sigmaX*sigmaX); // 后续高斯表达式中使用

  vec4 rgba = vec4(0.0);
  const float maxKernelSize = 1000.0;
  float stepV = 1.0;
  float weightSum = 0.0;
  for (float y = 0.0; y < maxKernelSize; y++) {
    if (y * stepV >= kernelSize) break;

    // 间距采样
    vec2 uvCoord = vTexCoord + mix(vec2(y * stepV - kernelRadius, 0.0), 
    vec2(0.0, y * stepV - kernelRadius), float (direction == 0)) / vec2(imgWidth, imgHeight);
    vec4 srcTmp = texture2D(blurImg, uvCoord);
    // 权重计算
    vec2 mn = vec2(y * stepV, y * stepV) - (kernelSize - 1.0) * 0.5;
    mn *= mn;
    vec2 weightxy = exp(scale2X * mn);
    float weight = weightxy.x;
    weightSum += weight;
    // 模糊过程 
    rgba += srcTmp * weight;
  }
  if (weightSum != 0.0) gl_FragColor = clamp(rgba / weightSum, 0.0, 1.0);
  else gl_FragColor = src;
}
`;

export const Blur = {
    vs: blurVS,
    fs: blurFS,
    buffers: {
        position: { type: vec4, n: 3 },
        texCoord: { type: vec2 },
    },
    uniforms: {
        shadowOffset: { type: vec2, default: [0, 0] },
        sigma: { type: float, default: 0 },
        imgWidth: { type: float },
        imgHeight: { type: float },
        direction: { type: int, default: 0 },
    },
    textures: {
        blurImg: { type: tex2D },
    },
};
