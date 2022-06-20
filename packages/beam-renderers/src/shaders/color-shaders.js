export const vertexShader = `
    uniform mat4 mvpMat;
    uniform float size;
    uniform float time;


    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_UV;

    varying vec4 v_Color;
    varying vec2 v_TexCoord;


    void main() {
        vec4 position = a_Position;
        vec3 point1 = vec3(size/4.0,0,-size*sqrt(3.)/4.0);
        vec3 point2 = vec3(-size/4.0,0,-size*sqrt(3.)/4.0);
        vec3 point3 = vec3(0,0,size/2.0);
        float dist1 = length( vec3(position)- point1);
        float dist2 = length( vec3(position)- point2);
        float dist3 = length( vec3(position)- point3);

        float y1 = sin(dist1/-2.0 + time);
        float y2 = sin(dist2/-2.0 + time);
        float y3 = sin(dist3/-2.0 + time);

        const float n = 3.0;
        float y = (y1 + y2 + y3 )/n;
        position.y += y*3.0;

        gl_Position = mvpMat * position;

        float c1 = (y1+1.0) * 0.4 + 0.2;
        float c2 = (y2+1.0) * 0.4 + 0.2;
        float c3 = (y3+1.0) * 0.4 + 0.2;
        v_Color = vec4(c1, c2, c3, 1.0);
        v_TexCoord = a_UV;
    }
`;

export const fragmentShader = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D u_BaseColorSampler;

    varying vec2 v_TexCoord;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;
