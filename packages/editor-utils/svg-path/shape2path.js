import absSvgPath from 'abs-svg-path';
import parseSVG from 'parse-svg-path';
import normalizeSvgPath from './normalize-svg-path';

export function rectToPaths(x, y, width, height, rx, ry) {
    /*
     * rx 和 ry 的规则是：
     * 1. 如果其中一个设置为 0 则圆角不生效
     * 2. 如果有一个没有设置则取值为另一个
     */
    rx = rx || ry || 0;
    ry = ry || rx || 0;

    // 非数值单位计算，如当宽度像100%则移除
    if (isNaN(x - y + width - height + rx - ry)) return;
    rx = rx > width / 2 ? width / 2 : rx;
    ry = ry > height / 2 ? height / 2 : ry;

    // 如果其中一个设置为 0 则圆角不生效
    if (rx === 0 || ry === 0) {
        return normalizeSvgPath(
            absSvgPath(
                parseSVG('M' + x + ' ' + y + 'h' + width + 'v' + height + 'h' + -width + 'z'),
            ),
        );
    } else {
        return normalizeSvgPath(
            absSvgPath(
                parseSVG(
                    'M' +
                        x +
                        ' ' +
                        (y + ry) +
                        'a' +
                        rx +
                        ' ' +
                        ry +
                        ' 0 0 1 ' +
                        rx +
                        ' ' +
                        -ry +
                        'h' +
                        (width - rx - rx) +
                        'a' +
                        rx +
                        ' ' +
                        ry +
                        ' 0 0 1 ' +
                        rx +
                        ' ' +
                        ry +
                        'v' +
                        (height - ry - ry) +
                        'a' +
                        rx +
                        ' ' +
                        ry +
                        ' 0 0 1 ' +
                        -rx +
                        ' ' +
                        ry +
                        'h' +
                        (rx + rx - width) +
                        'a' +
                        rx +
                        ' ' +
                        ry +
                        ' 0 0 1 ' +
                        -rx +
                        ' ' +
                        -ry +
                        'z',
                ),
            ),
        );
    }
}

export function ellipseToPaths(cx, cy, rx, ry) {
    // 非数值单位计算，如当宽度像100%则移除
    if (isNaN(cx - cy + rx - ry)) return;
    const path =
        'M' +
        (cx - rx) +
        ' ' +
        cy +
        'a' +
        rx +
        ' ' +
        ry +
        ' 0 1 0 ' +
        2 * rx +
        ' 0' +
        'a' +
        rx +
        ' ' +
        ry +
        ' 0 1 0 ' +
        -2 * rx +
        ' 0' +
        'z';
    return normalizeSvgPath(absSvgPath(parseSVG(path)));
}
