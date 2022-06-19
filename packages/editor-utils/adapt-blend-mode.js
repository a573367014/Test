/**
 * 将已 'blend' 开头命名的混合模式名称修改为 '-' 分割的 css 命名模式
 * 如： blendDarkenColor -> darken-color
 * @param { string } blendMode - 混合模式名称
 */
export default function adaptBlendMode(blendMode) {
    if (!blendMode || !blendMode.startsWith('blend')) {
        return blendMode;
    }
    return blendMode.replace(/[A-Z]/g, (s) => '-' + s.toLowerCase()).replace('blend-', '');
}
