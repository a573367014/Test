import loader from '@gaoding/editor-utils/loader';

/**
 * svg 元素转 base64
 *
 * @export
 * @param {*} node
 * @returns
 */
export default function convertSvgElementToImg(node) {
    const xml = new XMLSerializer().serializeToString(node);

    const svg64 = window.btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    return loader.loadImage(image64);
}
