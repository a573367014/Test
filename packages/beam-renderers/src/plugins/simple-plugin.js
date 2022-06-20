import { SchemaTypes } from '@gaoding/beam';
import { mat4 as matrix4 } from 'gl-matrix';

const { vec4, mat4 } = SchemaTypes;

const vs = `
attribute vec4 position;
uniform mat4 u_TranslateMat;
uniform mat4 u_ScaleMat;
uniform mat4 u_RotateMat;
uniform mat4 u_MVPMatrix;

void main() {
  gl_Position = u_MVPMatrix * u_RotateMat * u_ScaleMat * u_TranslateMat * position;
}
`;

const fs = `
precision highp float;
uniform vec4 u_Color;

void main() {
  gl_FragColor = u_Color;
}
`;

const uitMatrix = matrix4.create();
export const Simple = {
    vs,
    fs,
    buffers: {
        position: { type: vec4, n: 3 },
    },
    uniforms: {
        u_TranslateMat: { type: mat4, default: uitMatrix },
        u_RotateMat: { type: mat4, default: uitMatrix },
        u_ScaleMat: { type: mat4, default: uitMatrix },
        u_MVPMatrix: { type: mat4 },
        u_Color: { type: vec4, default: [0.96, 0.6, 0, 0.15] },
    },
};
