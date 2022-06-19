import { getNewColor, transformLayer } from './utils';
import tinycolor from 'tinycolor2';

import { colorImage, debug } from './color-image';
import type { Layer } from './basic';
import loader from '@gaoding/editor-utils/loader';

export class LayerPicker {
    options: { defaultSize: number };
    hitCanvas: HTMLCanvasElement;
    hitCtx: CanvasRenderingContext2D;
    imgCanvas: HTMLCanvasElement;
    imgCtx: CanvasRenderingContext2D;
    colorMap: Map<string, Layer>;
    zoom: number;
    constructor(options?: { defaultSize: number }) {
        this.options = Object.assign({ defaultSize: 1500 }, options);
        this.hitCanvas = <HTMLCanvasElement>document.createElement('canvas');

        // debug(this.hitCanvas);
        this.hitCtx = this.hitCanvas.getContext('2d');
        this.imgCanvas = <HTMLCanvasElement>document.createElement('canvas');
        this.imgCtx = this.imgCanvas.getContext('2d');
        this.colorMap = new Map();
        this.zoom = 1;
    }

    drawDefault(layer, color: string) {
        const { transform, x, y, width, height } = layer;
        const { hitCtx } = this;

        transformLayer(hitCtx, { transform, x, y, width, height, color });
    }

    async drawSvg(layer, color: string) {
        const { transform, x, y, width, height } = layer;
        const { hitCtx } = this;

        const str = new XMLSerializer().serializeToString(layer.$el);
        const prefix = 'data:image/svg+xml; charset=utf8, ';
        const src = prefix + encodeURIComponent(str);
        try {
            const image = await loader.loadImage(src);
            const colorCanvas = colorImage(image, { color, width, height });
            transformLayer(hitCtx, {
                transform,
                x,
                y,
                width,
                height,
                inputCanvas: colorCanvas,
                color,
            });
        } catch (e) {
            console.error('svg 加载失败，可能包含非法 image');
            this.drawDefault(layer, color);
        }
    }

    drawImage(layer: Layer, color: string) {
        const { transform, x, y, width, height, $element } = layer;
        const { hitCtx } = this;
        const { effectedResult = { width: 0 } } = $element;
        // effectResult 可能由无效值 width = 0;
        const zoomEffectResult = { left: 0, width: width, top: 0, height: height };
        if (!effectedResult.width) {
            Object.assign(zoomEffectResult, {
                left: 0,
                top: 0,
                width,
                height,
            });
        } else {
            Object.keys(effectedResult).forEach((key) => {
                zoomEffectResult[key] = this.zoom * effectedResult[key];
            });
        }

        const colorCanvas = colorImage(layer.$el as HTMLImageElement | HTMLCanvasElement, {
            color,
            width: zoomEffectResult.width,
            height: zoomEffectResult.height,
        });

        transformLayer(hitCtx, {
            transform,
            x,
            y,
            width,
            height,
            inputCanvas: colorCanvas,
            effectedResult: zoomEffectResult,
            color,
        });
    }

    // todo: layer-picker 每次更新都全部重绘，是否性能消耗过高？
    async update(layers, width: number, height: number) {
        const defaultSize = this.options.defaultSize;
        const zoom = Math.min(defaultSize / width, defaultSize / height, 1);
        this.hitCanvas.width = Math.ceil(width * zoom);
        this.hitCanvas.height = Math.ceil(height * zoom);
        this.colorMap = new Map();
        this.zoom = zoom;

        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i];
            const { type, x, y, width, height } = layer;

            if (!(width >= 1 || height >= 1)) return;

            layer = Object.assign({}, layer, {
                x: x * zoom,
                y: y * zoom,
                width: Math.max(1, width * zoom),
                height: Math.max(1, height * zoom),
            });

            const newColor = getNewColor(this.colorMap);
            this.colorMap.set(newColor, layer);

            switch (type) {
                case 'image':
                    this.drawImage(layer, newColor);
                    break;
                case 'svg':
                    await this.drawSvg(layer, newColor);
                    break;
                default:
                    // 文字的点击穿透依然效果不是很好，因为使用了文字 bbox 进行点击穿透检测，而不是实际占用区域
                    this.drawDefault(layer, newColor);
            }
        }
    }

    pick(x: number, y: number) {
        const { zoom } = this;
        const rgba = this.hitCtx.getImageData(x * zoom, y * zoom, 1, 1).data;
        if (!rgba) {
            return null;
        }
        const tColor = tinycolor(`rgb(${rgba[0]},${rgba[1]},${rgba[2]})`);
        const { r: r0, g: g0, b: b0 } = tColor.toRgb();
        const hexColor = tColor.toHexString();
        let targetLayer = this.colorMap.get(hexColor);
        if (targetLayer) {
            return targetLayer;
        } else {
            let minDistance = Infinity;
            for (const [key, layer] of this.colorMap) {
                const { r, g, b } = tinycolor(key).toRgb();
                const distance = Math.hypot(r - r0, g - g0, b - b0);
                if (distance < minDistance) {
                    minDistance = distance;
                    targetLayer = layer;
                }
            }
            // todo 阈值是否合理？4 ~= Math.sqrt(2,2,2)
            if (minDistance < 4) {
                this.colorMap.set(hexColor, targetLayer);
                return targetLayer;
            }
        }
    }
}
