import type { Layer } from './basic';
export declare class LayerPicker {
    options: {
        defaultSize: number;
    };
    hitCanvas: HTMLCanvasElement;
    hitCtx: CanvasRenderingContext2D;
    imgCanvas: HTMLCanvasElement;
    imgCtx: CanvasRenderingContext2D;
    colorMap: Map<string, Layer>;
    zoom: number;
    constructor(options?: {
        defaultSize: number;
    });
    drawDefault(layer: any, color: string): void;
    drawSvg(layer: any, color: string): Promise<void>;
    drawImage(layer: Layer, color: string): void;
    update(layers: any, width: number, height: number): Promise<void>;
    pick(x: number, y: number): Layer;
}
