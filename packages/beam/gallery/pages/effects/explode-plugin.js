import { SchemaTypes } from '../../../src/index.js';

const vs = `
precision highp float;

attribute vec2 position;
attribute vec2 center;
attribute vec2 texCoord;

uniform mat4 viewMat;
uniform mat4 projectionMat;
uniform mat4 rotateMat;
uniform float progress;
uniform float aspectRatio;

varying vec2 vTexCoord;

const vec3 camera = vec3(0, 0, 1);

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 dir = normalize(vec3(center, 0) * rand(center) - camera);
  vec3 translatedPos = vec3(position.x * aspectRatio, position.y, 0) + dir * progress;
  vec4 mvpPos = projectionMat * viewMat * vec4(translatedPos, 1);

  vTexCoord = texCoord;
  gl_Position = mvpPos;
}
`;

const fs = `
precision highp float;
uniform sampler2D img;
uniform float progress;

varying highp vec2 vTexCoord;

void main() {
  float a = 1.0 - progress / 16.0;
  gl_FragColor = vec4(texture2D(img, vTexCoord).rgb * a, 1.0);
}
`;

const { vec2, mat4, float, tex2D } = SchemaTypes;

export const ImageExplode = {
    vs,
    fs,
    buffers: {
        position: { type: vec2 },
        center: { type: vec2 },
        texCoord: { type: vec2 },
    },
    uniforms: {
        progress: { type: float, default: 0 },
        aspectRatio: { type: float, default: 1 },
        viewMat: { type: mat4 },
        projectionMat: { type: mat4 },
    },
    textures: {
        img: { type: tex2D },
    },
};
