import { get } from 'lodash';
import { resizeElements } from './resize-element';
import { fitBrush } from '../utils/fit-elements';

export async function resizeLayout(layout, ratio) {
    const { background, border, mosaic } = layout;

    layout.width *= ratio;
    layout.height *= ratio;
    layout.left *= ratio;
    layout.top *= ratio;

    if (mosaic && mosaic.paths.length) {
        mosaic.tileWidth *= ratio;
        mosaic.tileHeight *= ratio;
        mosaic.paths = mosaic.paths.map((element) => {
            element.height *= ratio;
            element.width *= ratio;
            element.left *= ratio;
            element.top *= ratio;
            element.strokeWidth *= ratio;
            fitBrush(element, element, ratio, ratio);
            return element;
        });
    }

    if (background?.image) {
        if (background.image.width) {
            background.image.width *= ratio;
            background.image.height *= ratio;
        }
        background.image.imageTransform.position.x *= ratio;
        background.image.imageTransform.position.y *= ratio;
        background.image.imageTransform.scale.x *= ratio;
        background.image.imageTransform.scale.y *= ratio;
    }

    if (border && border.enable) {
        border.width = Math.max(1, border.width * ratio);
    }

    return resizeElements(layout.elements, ratio, {
        chartDisabled: false,
    }).then(() => layout);
}

window.layout = resizeLayout;
window.templet = resizeTemplet;

export async function resizeTemplet(templet, ratio) {
    if (!templet || Number(ratio) === 1) return Promise.resolve();
    if (get(templet, 'global.layout.backgroundImage')) {
        if (get(templet, 'global.layout.width')) {
            templet.global.layout.width *= ratio;
            templet.global.layout.height *= ratio;
        }

        if (get(templet, 'global.layout.backgroundSize')) {
            templet.global.layout.backgroundSize[0] *= ratio;
            templet.global.layout.backgroundSize[1] *= ratio;
        }

        if (get(templet, 'global.layout.backgroundImageInfo.transform')) {
            templet.global.layout.backgroundImageInfo.transform.tx *= ratio;
            templet.global.layout.backgroundImageInfo.transform.ty *= ratio;
        }
    }

    await Promise.all(templet.layouts.map((layout) => resizeLayout(layout, ratio)));
}
