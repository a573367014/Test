import REGL, { TextureMagFilterType, TextureMinFilterType } from 'regl';

const vertexShader = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
`;
export const ATTRIBUTES = {
    position: [-2, -2, 2, -2, 0, 4], // 构建一个覆盖 -1~1 绘制区域的三角形
};

export const BaseDrawConfig = {
    vert: vertexShader,
    attributes: ATTRIBUTES,
    depth: {
        enable: false,
    },
    count: 3,
};

// canvas 大小改变时需更新
export function getViewport(regl: REGL.Regl) {
    return {
        x: 0,
        y: 0,
        width: regl.prop<any, 'width'>('width') as unknown as number,
        height: regl.prop<any, 'height'>('height') as unknown as number,
    };
}

export function getTextureConfig(image: HTMLImageElement | HTMLCanvasElement) {
    const { width, height } = image;

    return {
        width,
        height,
        mag: 'linear' as TextureMagFilterType,
        min: 'linear' as TextureMinFilterType,
        data: image,
        flipY: true,
        premultiplyAlpha: true,
    };
}

export interface Layer {
    type: 'string';
    x: number;
    y: number;
    width: number;
    height: number;
    $element: { effectedResult?: { left: number; top: number; width; height } };
    $el: HTMLImageElement | HTMLCanvasElement | SVGElement;
    transform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
}
