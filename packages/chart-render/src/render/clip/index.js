import {
    createSpecialShapePathRender,
    CLIPSHAPE_RENDER_TYPE,
    CLIPSHAPE_RENDER_SIZE,
} from './clip-shape';

export function createSpecialShapeRender(group, shapeType) {
    const createPathPath = createSpecialShapePathRender(shapeType);

    return function specialShapeRender({
        id,
        x,
        y,
        style,
        renderType,
        renderSize,
        width,
        height,
        position,
    }) {
        // 生成path
        const path = createPathPath({
            x,
            y,
            renderType,
            renderSize,
            shapeBox: {
                width,
                height,
            },
            position,
        });

        return group.addShape('path', {
            id,
            attrs: {
                path,
                ...style,
            },
        });
    };
}

export { CLIPSHAPE_RENDER_TYPE, CLIPSHAPE_RENDER_SIZE };
