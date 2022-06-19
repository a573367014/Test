/**
 * 设置元素轨道 id
 * @param { string } trackId
 * @param { any } element
 */
export function setTrackId(trackId, element) {
    element.trackId = trackId;

    // 兼容旧字段
    element.trackerId = trackId;
}

/**
 * 获取元素所在轨道 id
 * @param { any } element
 * @returns { string }
 */
export function getTrackId(element) {
    return element.trackId || element.trackerId || '';
}
