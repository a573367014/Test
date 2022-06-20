import { SchemaTypes } from '@gaoding/beam';
import { config } from '../data/config';

const vs = `
precision highp float;
attribute vec4 position;
attribute vec4 normal;

uniform mat4 mvpMat;

varying vec3 vNormal;
varying vec3 v_Position;

void main() {
  vNormal = vec3(normal);
  v_Position = vec3(position);
  gl_Position = mvpMat * position;
}
`;

const fs = `
precision highp float;

struct pointLight {
  vec3 pos;
  vec3 color;
  float strength;
};
uniform pointLight u_Lights[NR_POINT_LIGHTS];
uniform float powerNum;

varying vec3 vNormal;
varying vec3 v_Position;

void main() {
float nDotL;
vec3 color = vec3(0,0,0);
vec3 lightDirection, normalizeLightPos, tempDirection;
float a;

for(int i=0;i < NR_POINT_LIGHTS; i++){
  normalizeLightPos = normalize(u_Lights[i].pos) * 10.0;
  lightDirection = normalize(normalizeLightPos - vec3(v_Position));
  nDotL = max(dot(vNormal, lightDirection), 0.0);
  a = pow(nDotL, powerNum);
  color += u_Lights[i].color * a;
}

gl_FragColor = vec4(color,1.0);
}
`;

const { float, vec3, vec4, mat4 } = SchemaTypes;
export const LightBall = {
    vs,
    fs,
    defines: {
        NR_POINT_LIGHTS: config.pointLightsNum + 1,
    },
    buffers: {
        position: { type: vec4, n: 3 },
        normal: { type: vec3 },
    },
    uniforms: {
        mvpMat: { type: mat4 },
        powerNum: { type: float, default: 2 },
        'u_Lights[0].pos': { type: vec3 },
        'u_Lights[0].color': { type: vec3 },
        'u_Lights[1].pos': { type: vec3 },
        'u_Lights[1].color': { type: vec3 },
        'u_Lights[2].pos': { type: vec3 },
        'u_Lights[2].color': { type: vec3 },
        'u_Lights[3].pos': { type: vec3 },
        'u_Lights[3].color': { type: vec3 },
        'u_Lights[4].pos': { type: vec3 },
        'u_Lights[4].color': { type: vec3 },
        'u_Lights[5].pos': { type: vec3, default: [0, 0, 1] },
        'u_Lights[5].color': { type: vec3, default: [0, 0, 0] },
    },
};
