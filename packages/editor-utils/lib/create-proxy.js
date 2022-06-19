"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createProxy = void 0;

const createProxy = obj => {
  return new Proxy(obj, {
    get(target, property) {
      if (typeof target[property] === 'undefined') {
        const key = Object.keys(target).find(key => target[key][property]);
        return target[key] && target[key][property] || (() => {});
      }

      if (typeof target[property] === 'object') {
        return createProxy(target[property]);
      }

      return target[property];
    }

  });
};

exports.createProxy = createProxy;