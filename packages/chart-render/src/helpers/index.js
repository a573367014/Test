import { degToRadian } from './math';
import { isPlainObject } from '@antv/g2/lib/util';

/**
 * 修改css
 * @param {element} dom
 * @param {*} css
 */
export function modifyCSS(dom, css) {
    if (dom) {
        for (const key in css) {
            if (Object.prototype.hasOwnProperty.call(css, key)) {
                dom.style[key] = css[key];
            }
        }
    }

    return dom;
}

/**
 * 重新函数
 * @param {*} target
 * @param {*} funcName
 * @param {*} callback
 */
export function rewriteCallback(target, funcName, callback) {
    const _rewriteFunc = target[funcName];
    target[funcName] = function (...args) {
        callback.apply(target, args);
        if (typeof _rewriteFunc === 'function') {
            _rewriteFunc.apply(target, args);
        }
    };
}

export function pickPropsWith(config = {}, adapterMap) {
    if (!adapterMap) return config;
    const adapterMapKeys = Object.keys(adapterMap);
    return adapterMapKeys.reduce((source, keyName) => {
        if (config[keyName] !== undefined) {
            source[adapterMap[keyName]] = config[keyName];
        }
        return source;
    }, {});
}

export const formatPolarParams = ({ startAngle, allAngle, coordRadius, coordInnerRadius }) => {
    if ((startAngle >= 0 && startAngle < 90) || (startAngle > 270 && startAngle < 360)) {
        startAngle = startAngle - 360;
    } else if (startAngle === 360) {
        startAngle = -360;
    }
    startAngle = degToRadian(startAngle);
    const endAngle = startAngle + degToRadian(allAngle);

    return {
        startAngle,
        endAngle,
        innerRadius: coordInnerRadius,
        radius: coordRadius,
    };
};

const MAX_MIX_LEVEL = 5;
function _deepCombine(dist, src, level, maxLevel) {
    level = level || 0;
    maxLevel = maxLevel || MAX_MIX_LEVEL;
    for (const key in src) {
        if (Object.prototype.hasOwnProperty.call(src, key)) {
            const value = src[key];
            if (value !== null && isPlainObject(value)) {
                if (!isPlainObject(dist[key])) {
                    dist[key] = {};
                }
                if (level < maxLevel) {
                    _deepCombine(dist[key], value, level + 1, maxLevel);
                } else {
                    dist[key] = src[key];
                }
            } else if (
                value !== undefined &&
                dist &&
                dist[key] !== value &&
                (!Object.prototype.hasOwnProperty.call(dist, key) || dist[key] === undefined)
            ) {
                dist[key] = value;
            }
        }
    }
}

export function combine() {
    const args = new Array(arguments.length);
    const length = args.length;
    for (let i = 0; i < length; i++) {
        args[i] = arguments[i];
    }
    const rst = args[0];
    for (let _i = 1; _i < length; _i++) {
        _deepCombine(rst, args[_i]);
    }
    return rst;
}
