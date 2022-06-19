import { walkLayouts, isGifElement, isApngElement } from './element';
import { get } from 'lodash';

export const walkTemplet = walkLayouts;

export function getElementsByWalkTemplet(elements) {
    elements = [].concat(elements);
    const newElements = [];
    walkTemplet(
        (el) => {
            el.type && newElements.push(el);
        },
        true,
        [{ elements }],
    );

    return newElements;
}

export function isVideoTemplet(layouts) {
    layouts = [].concat(layouts);

    let isVideo = false;
    walkTemplet(
        (element) => {
            if (element.type === 'video') {
                isVideo = true;
                return false;
            }
        },
        true,
        layouts,
    );

    return isVideo;
}

export function isAnimationTemplet(layouts) {
    layouts = [].concat(layouts);

    let isAnimation = false;
    walkTemplet(
        (element) => {
            if (element.animations?.length) {
                isAnimation = true;
                return false;
            }
        },
        true,
        layouts,
    );

    return isAnimation;
}

export function isGifTemplet(layouts) {
    layouts = [].concat(layouts);

    let isGif = false;

    isGif = layouts.some((layout) => {
        return (
            get(layout, 'background.image.resourceType') === 'gif' ||
            get(layout, 'background.image.resourceType') === 'apng'
        );
    });

    !isGif &&
        walkTemplet(
            (element) => {
                if (isGifElement(element) || element.resourceType === 'apng') {
                    isGif = true;
                    return false;
                }
            },
            true,
            layouts,
        );

    return isGif;
}

export function isApngTemplet(layouts) {
    layouts = [].concat(layouts);

    let isApng = false;

    isApng = layouts.some((layout) => {
        return get(layout, 'background.image.resourceType') === 'apng';
    });

    !isApng &&
        walkTemplet(
            (element) => {
                if (isApngElement(element)) {
                    isApng = true;
                    return false;
                }
            },
            true,
            layouts,
        );

    return isApng;
}

export function checkEditorType(type) {
    const odysseyTypes = ['web_page', 'h5_bargraph'];
    const videoTypes = ['movie', 'video'];
    const imageTypes = ['image', 'plog'];
    const clipperTypes = ['clipper'];
    const docTypes = ['doc'];

    if (odysseyTypes.includes(type)) {
        // h5 轻页
        return 'odyssey';
    }

    if (videoTypes.includes(type)) {
        // 视频模板
        return 'video';
    }

    if (clipperTypes.includes(type)) {
        // 视频剪辑
        return 'clipper';
    }

    if (imageTypes.includes(type)) {
        return 'image';
    }

    if (docTypes.includes(type)) {
        return 'doc';
    }

    // 平面模板
    return 'design';
}

export default {
    walkTemplet,
    isVideoTemplet,
    isAnimationTemplet,
    isGifTemplet,
    getElementsByWalkTemplet,
    checkEditorType,
};
