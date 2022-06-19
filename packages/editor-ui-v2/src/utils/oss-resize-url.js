
const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 2;
const USER_DPR = Math.round(Math.min(devicePixelRatio, 2));

export default function ossResizeURL(url, width, height, defaultDpr = 2) {
    const factor = defaultDpr || USER_DPR;
    if(/\.gif$/.test(url)) {
        return url;
    }
    return url + `?x-oss-process=image/resize,w_${width * factor},h_${height * factor}/interlace,1`;
}
