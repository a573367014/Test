import { createCanvas, newDrawImageToCanvas } from '@gaoding/editor-utils/canvas';

const createImageCanvas = ({ width, height, naturalWidth, naturalHeight, imageTransform }, img) => {
    const canvas = createCanvas(width, height);
    return newDrawImageToCanvas({
        canvas,
        image: img,
        width,
        height,
        naturalWidth,
        naturalHeight,
        imageTransformArray: imageTransform.toArray(),
        blendMode: 'source-out',
    });
};

const createMosaicPathCanvas = (el) => {
    const canvas = createCanvas(el.width, el.height);
    const ctx = canvas.getContext('2d');

    const isLine = el.type === 'mosaicBrush';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = el.strokeWidth || 0;
    const path = new Path2D(el.path);
    isLine ? ctx.stroke(path) : ctx.fill(path);

    return canvas;
};

export const getLayers = (editor) => {
    const { currentLayout, getComponentById, supportTypesMap } = editor;

    if (!currentLayout) {
        return [[], 0, 0];
    }

    let { width, height, elements, mosaic } = currentLayout;
    elements = editor.operateMode === 'mosaic' && mosaic ? mosaic.paths : elements;

    const layers = elements
        .filter((element) => !element.frozen)
        .map((element) => {
            const {
                type,
                width,
                height,
                left,
                top,
                transform,
                strokeWidth,
                $id,
                $imageLeft,
                $imageTop,
                $imageWidth,
                $imageHeight,
            } = element;
            const $component = getComponentById($id);

            const layerInfo = {
                width,
                height,
                x: left,
                y: top,
                transform: transform.localTransform,
                $component,
                $element: element,
            };

            if (!supportTypesMap[element.type]) {
                return {
                    type: 'default',
                    ...layerInfo,
                };
            }

            if (
                type === 'image' &&
                $component &&
                $component.$refs.img &&
                (Math.round($imageLeft) !== 0 ||
                    Math.round($imageTop) !== 0 ||
                    Math.round($imageWidth) !== Math.round(width) ||
                    Math.round($imageHeight) !== Math.round(height))
            ) {
                const canvas = createImageCanvas(element, $component.$refs.img);
                return {
                    type: 'image',
                    $el: canvas,
                    ...layerInfo,
                };
            } else if (
                (type === 'mask' || type === 'image') &&
                $component &&
                ($component.$refs.img || $component.$refs.canvas)
            ) {
                return {
                    type: 'image',
                    $el: $component.$refs.img || $component.$refs.canvas,
                    ...layerInfo,
                };
            } else if (
                type === 'threeText' &&
                $component &&
                ($component.$refs.glCanvas || $component.$refs.img)
            ) {
                const { zoom } = editor.global;
                const { glCanvas: canvas, img } = $component.$refs;
                if (img) {
                    return {
                        type: 'image',
                        $el: img,
                        ...layerInfo,
                    };
                } else {
                    const { devicePixelRatio = 1 } = $component;
                    const scaleRatio = zoom * devicePixelRatio;
                    const width = canvas.width / scaleRatio;
                    const height = canvas.height / scaleRatio;

                    const positionData = {
                        width,
                        height,
                        x:
                            element.left +
                            element.width / 2 -
                            (canvas.width - $component.diviateX) / scaleRatio / 2,
                        y:
                            element.top +
                            element.height / 2 -
                            (canvas.height - $component.diviateY) / scaleRatio / 2,
                    };
                    Object.assign(layerInfo, positionData);
                    return {
                        type: 'image',
                        $el: canvas,
                        ...layerInfo,
                    };
                }
            } else if (
                ['rect', 'ellipse', 'line', 'brush', 'svg'].includes(type) &&
                (strokeWidth >= 1 || type === 'svg') &&
                $component &&
                $component.$el &&
                $component.$el.querySelector('svg')
            ) {
                const el = $component.$el;
                const svgElement = el.querySelector('svg');
                return {
                    type: 'svg',
                    $el: svgElement,
                    ...layerInfo,
                };
            } else if (
                type === 'watermark' &&
                $component &&
                ($component.model.$fullScreenCanvas || $component.$refs.img)
            ) {
                return {
                    type: 'image',
                    $el: $component.model.$fullScreenCanvas || $component.$refs.img,
                    ...layerInfo,
                };
            } else if (
                type === 'effectText' &&
                $component &&
                ($component.$refs.canvas || $component.$refs.img)
            ) {
                const { img, canvas, clickAreaCanvas } = $component.$refs;
                let clickCanvas;
                if (img) {
                    clickCanvas = img;
                } else {
                    const isPositionChange = element.textEffects.some((effect) => {
                        const { offset = { x: 0, y: 0 }, skew = {}, enable } = effect;
                        return enable && (Math.hypot(offset.x, offset.y) || skew.enable);
                    });

                    clickCanvas = isPositionChange ? canvas : clickAreaCanvas;
                }

                return {
                    type: 'image',
                    $el: clickCanvas,
                    ...layerInfo,
                };
            } else if (type.includes('mosaic')) {
                return {
                    type: 'image',
                    $el: createMosaicPathCanvas(element),
                    ...layerInfo,
                };
            }
            return {
                type: 'default',
                ...layerInfo,
            };
        });
    return [layers, width, height];
};
