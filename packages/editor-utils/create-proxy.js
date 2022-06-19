export const createProxy = (obj) => {
    return new Proxy(obj, {
        get(target, property) {
            if (typeof target[property] === 'undefined') {
                const key = Object.keys(target).find((key) => target[key][property]);
                return (target[key] && target[key][property]) || (() => {});
            }
            if (typeof target[property] === 'object') {
                return createProxy(target[property]);
            }
            return target[property];
        },
    });
};
