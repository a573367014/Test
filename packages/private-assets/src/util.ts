export function getPrivateUrl(url: string, authKey: string) {
    if (!/^(http|\/\/)/.test(url)) {
        return url;
    }

    if (url.includes('?')) {
        url = url.replace('&.auth_key=[^&]*', '');
        url += '&auth_key=' + authKey;
    } else {
        url += '?auth_key=' + authKey;
    }

    return url;
}

const replaceUrl = (str: string, authKey: string) => {
    return str.replace(/url\((https?:\/\/.+)\)/, (a, b) => {
        return `url(${getPrivateUrl(b, authKey)})`;
    });
};

export function getStylePrivateUrl(style: any, authKey: string) {
    if (typeof style === 'string') {
        return replaceUrl(style, authKey);
    } else {
        const newStyle = {} as any;
        for (const k in style) {
            newStyle[k] = replaceUrl(style[k], authKey);
        }
        return newStyle;
    }
}
