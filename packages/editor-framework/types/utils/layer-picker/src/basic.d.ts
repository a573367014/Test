import REGL from 'regl';
export declare const ATTRIBUTES: {
    position: number[];
};
export declare const BaseDrawConfig: {
    vert: string;
    attributes: {
        position: number[];
    };
    depth: {
        enable: boolean;
    };
    count: number;
};
export declare function getViewport(regl: REGL.Regl): {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare function getTextureConfig(image: HTMLImageElement | HTMLCanvasElement): {
    width: number;
    height: number;
    mag: REGL.TextureMagFilterType;
    min: REGL.TextureMinFilterType;
    data: HTMLCanvasElement | HTMLImageElement;
    flipY: boolean;
    premultiplyAlpha: boolean;
};
export interface Layer {
    type: 'string';
    x: number;
    y: number;
    width: number;
    height: number;
    $element: {
        effectedResult?: {
            left: number;
            top: number;
            width: any;
            height: any;
        };
    };
    $el: HTMLImageElement | HTMLCanvasElement | SVGElement;
    transform: {
        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
    };
}
