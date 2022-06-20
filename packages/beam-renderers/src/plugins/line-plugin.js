import { SchemaTypes } from '@gaoding/beam';

const vs = `
precision highp float;
uniform mat4 u_MVPMatrix;
attribute vec4 position;

varying vec3 v_Position1;
varying vec3 v_Position2;

void main() {
    v_Position1 =  position.xyz;
    gl_Position =  u_MVPMatrix * position;
    v_Position2 = gl_Position.xyz / gl_Position.w;
}
`;

const fs = `
precision highp float;
const int LINENUM = 2;
const float prec = 1.;
const float lineWidth = 1.;

uniform mat4 u_MVPMatrixInvert;
uniform vec3 u_Line[3];

varying vec3 v_Position1;
varying vec3 v_Position2;
struct Line {
    vec4 color;
    vec3 equation;
};
uniform Line u_Lines[LINENUM];

float getSmoothLine(vec3 pos, float v){
    return smoothstep(-prec-lineWidth , -lineWidth , v) - 
        smoothstep(lineWidth, lineWidth + prec, v);
}

// a*x + b*y + c=0;
float plotLine(vec3 pos1,  vec3 pos2, vec3 line){
    float molecular = dot(pos1, line);
    // float v = molecular/length(u_MVPMatrixInvert * vec4(line, 1.));
    // float v = molecular/length(u_MVPMatrix * vec4(line, 1.));
    float v = molecular/length(line);
    return getSmoothLine(pos2, v) ;
}

void main() {
    vec4 pct = vec4(0.);
    for(int i = 0; i < LINENUM; i++) {
        float k = plotLine(v_Position1, v_Position2, u_Lines[i].equation);
        pct +=  k* u_Lines[i].color;
    }
    if(pct.w > 0.){
        gl_FragColor = pct;
    }else{
        discard;
    }
    
}
`;

const { vec3, vec4, mat4, float } = SchemaTypes;

export const Line = {
    vs,
    fs,
    buffers: {
        position: { type: vec4, n: 3 },
    },
    uniforms: {
        u_MVPMatrix: { type: mat4 },
        // u_MVPMatrixInvert: { type: mat4 },
        u_time: { type: float, default: 0 },
        'u_Lines[0].equation': { type: vec3, default: [1, 0, 0] },
        'u_Lines[1].equation': { type: vec3, default: [0, 0, 1] },
        'u_Lines[0].color': { type: vec4, default: [1, 0, 0, 1] },
        'u_Lines[1].color': { type: vec4, default: [0, 1, 0, 1] },
    },
};
