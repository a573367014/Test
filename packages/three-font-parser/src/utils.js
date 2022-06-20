import createDebug from 'debug/src/browser';
import { PACKAGE_NAME } from './consts';

export function initTextGeometryOptions(options, defaults = {}) {
    Object.keys(defaults).forEach((key) => {
        if (typeof options[key] === 'undefined') {
            options[key] = defaults[key];
        }
    });
    return options;
}

export function replaceWithMap(data, map) {
    return Object.entries(data)
        .map(([key, value]) => [map[key] || key, map[value] || value])
        .reduce((options, entry) => Object.assign(options, { [entry[0]]: entry[1] }), {});
}

export const debug = {
    rootName: PACKAGE_NAME,
    _store: new Map(),
    _createDebug(name = '') {
        return createDebug([this.rootName, name].join(':'));
    },
    _fire(debug, ...data) {
        debug(data[0] || '', ...data.slice(1));
    },
    log(msg, ...data) {
        this._fire(this._createDebug(msg), ...data);
    },
    time(msg, ...data) {
        const debug = this._createDebug(msg);
        if (this._store.get(msg)) {
            console.warn(`timer ${msg} already exists`);
        }
        this._store.set(msg, debug);
        this._fire(debug, ...data);
    },
    timeEnd(msg, ...data) {
        const debug = this._store.get(msg);
        if (debug) {
            this._fire(debug, ...data);
            this._store.set(msg, null);
        } else {
            console.warn(`timer ${msg} not exists`);
        }
    },
};
