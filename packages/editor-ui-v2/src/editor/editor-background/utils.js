import isUndefined from 'lodash/isUndefined';

export function getBackgroundGradientStyle(gradient) {
    const style = {};
    const result = [];

    // Gradient is not performance same as PS.
    result.push(90 - gradient.angle + 'deg');

    gradient.stops.forEach((item) => {
        result.push(`${item.color} ${item.offset * 100}%`);
    });

    const gradientString = result.join(',');

    style.backgroundImage = `linear-gradient(${gradientString})`;
    return style;
}

export function getBackgroundImageStyle(image, zoom = 1) {
    if (!image) return [];
    return [getBackgroundWrapImageStyle(image, zoom), getBackgroundInnerImageStyle(image, zoom)];
}

export function getBackgroundWrapImageStyle(image, zoom) {
    const transform = image.transform.toJSON ? image.transform.toJSON() : image.transform;
    return {
        position: 'absolute',
        left: image.left * zoom + 'px',
        top: image.top * zoom + 'px',
        width: image.width * zoom + 'px',
        height: image.height * zoom + 'px',
        overflow: 'hidden',
        transform: `matrix(${Object.values(transform).join(',')})`,
        opacity: isUndefined(image.opacity) ? 1 : image.opacity,
    };
}

export function getBackgroundInnerImageStyle(image, zoom) {
    // 基于图框居中位置变换
    const left = -((image.naturalWidth - image.width) / 2) * zoom + 'px';
    const top = -((image.naturalHeight - image.height) / 2) * zoom + 'px';
    const width = image.naturalWidth * zoom + 'px';
    const height = image.naturalHeight * zoom + 'px';
    const { a, b, c, d, tx, ty } = image.imageTransform.toJSON
        ? image.imageTransform.toJSON()
        : image.imageTransform;
    const transformArray = [a, b, c, d, tx * zoom, ty * zoom];
    return {
        position: 'absolute',
        left,
        top,
        width,
        height,
        transform: `matrix(${transformArray.join(',')})`,
    };
}
