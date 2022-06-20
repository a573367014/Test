import { SchemaTypes } from '@gaoding/beam';

const vs = `
attribute vec4 position;

uniform mat4 mvpMat;
uniform float size;
uniform float time;

varying vec4 vColor;

void main() {
    vec4 _position = position;
    vec3 point1 = vec3(size/4.0,0,-size*sqrt(3.)/4.0);
    vec3 point2 = vec3(-size/4.0,0,-size*sqrt(3.)/4.0);
    vec3 point3 = vec3(0,0,size/2.0);
    float dist1 = length( vec3(position)- point1);
    float dist2 = length( vec3(position)- point2);
    float dist3 = length( vec3(position)- point3);

    const float k1 = 10.;
    float y1 = cos(dist1*k1 + time);
    float y2 = cos(dist2*k1 + time);
    float y3 = cos(dist3*k1 + time);

    const float n = 3.0;
    float y = (y1 )/n;
    _position.x += y*0.2;

    gl_Position = mvpMat * _position;

    float ratio = 0.5;
    float k= 2.*(.5-ratio);
    float c1 = (y1+1.0) * ratio + k;
    float c2 = (y2+1.0) * ratio + k;
    float c3 = (y3+1.0) * ratio + k;
    vColor = vec4(c1, c2, c3, 1);
}
`;

const fs = `
precision highp float;

varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
`;

const { float, vec4, mat4 } = SchemaTypes;

export const Wave = {
    vs,
    fs,
    buffers: {
        position: { type: vec4, n: 3 },
    },
    uniforms: {
        mvpMat: { type: mat4 },
        size: { type: float },
        time: { type: float },
    },
};
