import REGL, { Vec3 } from 'regl';
import { BaseDrawConfig, getViewport, getTextureConfig } from './basic';
import tinycolor from 'tinycolor2';

const edgeDetect = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
// 基础图
uniform sampler2D img; 
// 图片大小
uniform vec2 canvasSize;
// 输出颜色
uniform vec3 color;

void main() {
  // 图片外扩一点，方便选中细小的元素
  float alpha = texture2D(img,  gl_FragCoord.xy / canvasSize).a
            + texture2D(img, (gl_FragCoord.xy + vec2(1, 1))/canvasSize).a
            + texture2D(img, (gl_FragCoord.xy + vec2(1, -1))/canvasSize).a
            + texture2D(img, (gl_FragCoord.xy + vec2(-1, 1))/canvasSize).a
            + texture2D(img, (gl_FragCoord.xy + vec2(-1, -1))/canvasSize).a
    ;
  if(alpha > 0.5){
    gl_FragColor = vec4(color, 1.);
  }else{
    gl_FragColor = vec4(0., 0., 0., 0.);
  }
}`;

let glCanvas: HTMLCanvasElement;
let regl: REGL.Regl;
let draw: (_: Props) => void;
let imgTexture: REGL.Texture2D;

interface Props {
    width: number;
    height: number;
    color: Vec3;
}

export function debug(canvas) {
    document.body.appendChild(canvas);
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.right = '0px';
    canvas.style.zIndex = '10000';
    canvas.style.border = '4px dashed red';
}

export function initWebgl() {
    glCanvas = document.createElement('canvas');
    // debug(glCanvas);
    regl = REGL({ canvas: glCanvas });
    const textureConfig: REGL.Texture2DOptions = {
        mag: 'linear',
        min: 'linear',
        wrap: 'clamp',
        premultiplyAlpha: true,
    };
    imgTexture = regl.texture(textureConfig);

    const data: REGL.DrawConfig = {
        frag: edgeDetect,
        uniforms: {
            img: imgTexture,
            canvasSize: [regl.prop<Props, 'width'>('width'), regl.prop<Props, 'height'>('height')],
            color: regl.prop<Props, 'color'>('color'),
        },
        viewport: getViewport(regl),
    };

    const baseDraw = regl(Object.assign(data, BaseDrawConfig));
    draw = (prop) => {
        const { width, height } = prop;

        glCanvas.width = width;
        glCanvas.height = height;

        regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
        });

        baseDraw(prop);
    };
}

// 4个作用：缩放图片、半透明移除、粗化细线、着色
// ps: 这种缩放是有损缩放（ 但比drawImage 效率高），采用不连续采样的方式进行缩放，对于绝大部分图片可以获取缩小后的轮廓，
// 但如果图像只有频率小于采样频率的空间波，则可能出现明显出入（比如规律均匀的网）
// 由于频繁更换纹理，目前并没有明显的性能提升，考虑纹理缓存？

export function colorImage(
    image: HTMLCanvasElement | HTMLImageElement,
    options: { color: string; width: number; height: number },
): HTMLCanvasElement {
    if (!regl) initWebgl();
    const { width, height, color } = options;
    glCanvas.width = width;
    glCanvas.height = height;
    imgTexture(getTextureConfig(image));
    const { r, g, b } = tinycolor(color).toRgb();
    draw({ width, height, color: [r / 255, g / 255, b / 255] });
    return glCanvas;
}
