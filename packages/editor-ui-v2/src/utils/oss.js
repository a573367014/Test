export let supportsWebp = false;

(function () {
    return new Promise((resolve) => {
        const image = new Image();
        image.onerror = () => resolve(false);
        image.onload = () => resolve(image.width === 1);
        image.src =
            'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    })
        .catch(() => false)
        .then((bool) => {
            supportsWebp = bool;
        });
})();

export function ossUrl(url, options = {}) {
    const {
        width,
        height,
        type = 'webp',
        scaleType,
        minDpr = 1.5,
        useDpr = true,
        resizeType = 0,
    } = options;
    if (/\.gif$/.test(url)) {
        return url;
    }
    let src = url + '?x-oss-process=';
    if (width || height) {
        src += 'image/resize';

        // 最大限制 2， 防止图片过大， 最小1.5 保证图片清晰
        const dpr = useDpr ? Math.min(2, Math.max(devicePixelRatio, minDpr)) : 1;

        if (width) {
            src += `,w_${Math.round(width * dpr)}`;
        }
        if (height) {
            src += `,h_${Math.round(height * dpr)}`;
        }
        if (scaleType) {
            // https://help.aliyun.com/document_detail/44688.html?spm=a2c4g.11186623.6.1383.36e335a8pxsRMg
            src += `,m_${scaleType}`;
        }
        if (resizeType === 6) {
            src += ',type_6';
        }
        src += '/interlace,1,';
    }

    if (type) {
        if (type === 'webp') {
            if (supportsWebp) {
                src += `image/format,${type},`;
            } else if (options.allowJPGOnUnsupportedWebp) {
                src += 'image/format,jpg,';
            }
        } else {
            src += `image/format,${type},`;
        }
    }
    if (/\?x-oss-process=$/.test(src)) return url;
    return src.replace(/,$/, '');
}
