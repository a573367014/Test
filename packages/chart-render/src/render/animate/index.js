const labelAppearAdd = (label, animateCfg, coordinate) => {
    const startX = coordinate.start.x;
    const finalX = label.attr('x');
    const labelContent = label.attr('text');
    label.attr('x', startX);
    label.attr('text', 0);

    const distance = finalX - startX;
    label.animate(
        {
            onFrame: (ratio) => {
                const position = startX + distance * ratio;
                const text = (labelContent * ratio).toFixed(0);

                return {
                    x: position,
                    text,
                };
            },
        },
        animateCfg.duration,
        animateCfg.easing,
        animateCfg.callback,
        animateCfg.delay,
    );
};

const labelUpdateAdd = (shape, animateCfg) => {
    const cacheShape = shape.get('cacheShape');
    if (!cacheShape) return;
    const formAttrs = cacheShape.attrs;

    const startX = formAttrs.x;
    const startY = formAttrs.y;
    const labelContent = formAttrs.text;

    const finalX = shape.attr('x');
    const finalY = shape.attr('y');
    const finalContent = shape.attr('text');

    shape.attr('text', labelContent);
    shape.attr('x', startX);
    shape.attr('y', startY);

    const distanceX = finalX - startX;
    const distanceY = finalY - startY;
    const numberDiff = +finalContent - +labelContent;

    shape.animate(
        {
            onFrame: (ratio) => {
                const positionX = startX + distanceX * ratio;
                const positionY = startY + distanceY * ratio;
                const text = (+labelContent + numberDiff * ratio).toFixed(0);
                return {
                    x: positionX,
                    y: positionY,
                    text,
                };
            },
        },
        animateCfg.duration,
        animateCfg.easing,
        animateCfg.callback,
        animateCfg.delay,
    );
};

const barUpdateWidthAndPosition = (shape, animateCfg) => {
    const cacheShape = shape.get('cacheShape');
    const formAttrs = cacheShape.attrs;

    const startWidth = formAttrs.width;
    const startX = formAttrs.x;
    const startY = formAttrs.y;

    const endWidth = shape.attr('width');
    const finalX = shape.attr('x');
    const finalY = shape.attr('y');

    shape.attr('width', startWidth);
    shape.attr('x', startX);
    shape.attr('y', startY);

    shape.animate(
        {
            width: endWidth,
            x: finalX,
            y: finalY,
        },
        animateCfg.duration,
        animateCfg.easing,
        animateCfg.callback,
        animateCfg.delay,
    );
};

export { labelAppearAdd, labelUpdateAdd, barUpdateWidthAndPosition };
