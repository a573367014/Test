import normalizeSvgPath from './normalize-svg-path';
import { rectToPaths, ellipseToPaths } from './shape2path';
import parseSVG from 'parse-svg-path';
import absSvgPath from 'abs-svg-path';
import getSvgBounds from './svg-path-bounds';

function svgToPaths(str) {
    if (!str) return [];
    return parseSVG(str);
}

function pathsToSvg(arr) {
    return arr.reduce((str, path) => {
        path = path.map((v) => {
            if (typeof v === 'number') return +v.toFixed(2);
            return v;
        });

        return str + path.join(' ');
    }, '');
}

export {
    pathsToSvg,
    svgToPaths,
    getSvgBounds,
    absSvgPath,
    normalizeSvgPath,
    rectToPaths,
    ellipseToPaths,
};
