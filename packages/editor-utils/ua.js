const ua = navigator.userAgent;

const rIOS = /\(i[^;]+;( U;)? CPU.+Mac OS X/i;

export const isIOS = () => {
    return rIOS.test(navigator.userAgent);
};

// 和 UA 相关的属性
export const isWebkit = () => {
    const reg = /webkit/i;
    return reg.test(ua);
};

export const isFox = () => {
    const reg = /Firefox/i;
    return reg.test(ua);
};

export const isFireFox = isFox;

export const isIE = () => {
    return 'ActiveXObject' in window;
};

export const isAndorid = () => {
    return ua.indexOf('Android') > -1 || ua.indexOf('Linux') > -1;
};

export const isMobile = () => {
    return Object.prototype.hasOwnProperty.call(window, 'ontouchstart') || isAndorid() || isIOS();
};

export const getBrowserZoom = () => {
    let ratio = 0;
    if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
        ratio = Math.round((window.outerWidth / window.innerWidth) * 100); // 屏幕宽度显示宽度比
    }

    // 360安全浏览器下的innerWidth包含了侧边栏的宽度
    if (ratio !== 100) {
        if (ratio >= 95 && ratio <= 105) {
            ratio = 100;
        }
    }
    return ratio;
};

export default {
    isMobile,
    // 是否 webkit
    isWebkit,

    isFireFox,
    isFox,

    // 是否 IE
    isIE,

    isAndorid,
    getBrowserZoom,
};
