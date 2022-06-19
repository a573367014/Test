import BaseModel from '../base/element-base-model';
import renderBackgroundMask from './renderer/background-mask';
import { createCanvas } from '@gaoding/editor-utils/canvas';

export function getLayoutBackgroundImageModel(layout) {
    const { background } = layout;

    const model = new BaseModel({
        ...background.image,
        type: 'image',
        isApng: layout.isApng,
        isGif: layout.isGif,
    });

    return model;
}

export async function getLayoutBackgroundMaskModel(editor, layout) {
    const markElements = [];
    editor.walkTemplet(
        (el) => {
            el.maskEnable && markElements.push(el);
        },
        true,
        [layout],
    );
    if (!markElements.length) return;

    let canvas = createCanvas(layout.width, layout.height);
    renderBackgroundMask({
        editor,
        layout,
        filterElements: markElements,
        canvas,
    });

    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve);
    });

    const model = new BaseModel({
        type: 'backgroundMask',
        width: layout.width,
        height: layout.height,
        imageUrl: URL.createObjectURL(blob),
    });

    canvas = null;
    return model;
}
