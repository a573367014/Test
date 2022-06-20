import { SchemaTypes, GLTypes } from '@gaoding/beam';

const vs = `
  attribute vec4 position;
  uniform mat4 u_MVPMatrix;

  void main() {
    gl_Position = u_MVPMatrix * position;
  }
  `;

const fs = `
  precision lowp float;
  uniform vec4 u_Color;
  void main() {
    gl_FragColor = u_Color;
  }
  `;
const { vec4, mat4 } = SchemaTypes;
export const Mesh = {
    vs,
    fs,
    buffers: {
        position: { type: vec4, n: 3 },
    },
    mode: GLTypes.Lines,
    uniforms: {
        u_MVPMatrix: { type: mat4 },
        u_Color: { type: vec4, default: [1, 0, 0, 1] },
    },
};
