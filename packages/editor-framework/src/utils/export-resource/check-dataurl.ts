import { get } from 'lodash';
import { isDataUrl, isBlobUrl } from '@gaoding/editor-utils/binary';
import type { ElementModel, ILayoutModel } from '../../types/editor';

const commonUrlKeys: string[] = [
    'border.image',
    'backgroundEffect.image.url',
    'metaInfo.thirdParty.imageEditor.url',
    'metaInfo.thirdParty.matting.url',
    'metaInfo.thirdParty.inpaint.url',
    'maskInfo.imageUrl',
];

const elementUrlKeyMap = {
    global: () => {
        return ['layout.backgroundImage'];
    },
    layout: () => {
        return ['background.image.url', 'backgroundEffectImage'];
    },
    mask: () => {
        return ['url', 'mask'];
    },
    image: () => {
        return ['url'];
    },
    ninePatch: () => {
        return ['url'];
    },
    cell: () => {
        return ['url'];
    },
    watermark: () => {
        return ['imageUrl', 'url', 'logo.url', 'logo.defaultUrl'];
    },
    video: () => {
        return ['url', 'mask'];
    },
};

export function getUrlKeys(element: Partial<ElementModel | ILayoutModel>): string[] {
    const fn = elementUrlKeyMap['type' in element ? element.type : 'layout'];
    return commonUrlKeys.concat(fn ? fn() : []);
}

export const PLACEHOLDER_PROTOCOL = 'placeholder://';

export function isPlacehoderUrl(url: string): boolean {
    return url && url.includes(PLACEHOLDER_PROTOCOL);
}

export function isLocalUrl(url: string): boolean {
    return url && (isBlobUrl(url) || isDataUrl(url));
}

export function checkDataUrl(
    props: Partial<ElementModel | ILayoutModel>,
    callback: (key: string, url: string) => void,
) {
    const urlKeys = getUrlKeys(props) || [];
    if (urlKeys.length) {
        urlKeys.forEach((key) => {
            const url = get(props, key) as string;
            if (isLocalUrl(url) || isPlacehoderUrl(url)) {
                callback(key, url);
            }
        });
    }
}
