/**
 * 获取滤镜强度
 * @param { any } filterInfo
 */
export function getFilterIntensity(filterInfo) {
    if (!filterInfo) {
        return 0.8;
    }
    return typeof filterInfo.intensity === 'number' ? filterInfo.intensity : filterInfo.strong || 0;
}

/**
 * 设置滤镜强度
 * @param { number } intensity
 * @param { any } filterInfo
 */
export function setFilterIntensity(intensity, filterInfo) {
    filterInfo.intensity = intensity;

    // 旧字段兼容
    filterInfo.strong = intensity;
}
