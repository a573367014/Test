export declare const getNewColor: (colorMap?: Map<any, any>) => string;
interface Transform {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
}
interface Options {
    transform?: Transform;
    x?: number;
    y?: number;
    width: number;
    height: number;
    inputCanvas?: HTMLCanvasElement;
    color?: string;
    effectedResult?: {
        left: number;
        top: number;
    };
}
export declare function transformLayer(ctx: CanvasRenderingContext2D, options: Options): void;
export {};
