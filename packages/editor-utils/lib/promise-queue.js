"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPromiseQueue = createPromiseQueue;

var _bluebird = _interopRequireDefault(require("bluebird"));

const createTimeoutPromise = time => {
  return new _bluebird.default((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('timeout'));
    }, time);
  });
};

function createPromiseQueue(options = {}) {
  const store = new Map();
  const queue = [];
  let isRunning = false;

  const exec = async () => {
    isRunning = true;
    const id = queue.shift();
    const idQueue = store.get(id);
    const {
      createPromise,
      resolve,
      reject
    } = idQueue.pop();
    const withTimeout = [createPromise()].concat(options.timeout ? [createTimeoutPromise(options.timeout)] : []);

    try {
      const result = await _bluebird.default.race(withTimeout);
      resolve(result);
    } catch (err) {
      reject(err);
    }

    if (queue.length) {
      await exec();
    }

    isRunning = false;
  };

  const promiseQueue = {
    debounceTimer: null,
    promises: [],
    lock: false,

    debounce(id, createPromise, delay = 300) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        if (!this.lock) {
          this.promises.push(this.run(id, createPromise));
        }

        clearTimeout(this.debounceTimer);
      }, delay);
      return new _bluebird.default(resolve => {
        const time = setInterval(() => {
          if (this.promises.length) {
            this.lock = true;
            resolve(time);
          }
        }, delay);
      }).then(() => _bluebird.default.all(this.promises).then(res => {
        this.lock = false;
        this.promises = [];
        return res;
      }));
    },

    async run(id, createPromise) {
      if (!store.get(id)) {
        store.set(id, []);
      }

      if (!queue.includes(id)) {
        queue.push(id);
      }

      const promise = new _bluebird.default((resolve, reject) => {
        store.get(id).push({
          createPromise,
          resolve,
          reject
        });
      });

      if (!isRunning) {
        if (options.wait) {
          isRunning = true;
          await _bluebird.default.delay(options.wait);
        }

        exec();
      }

      return promise;
    },

    clear() {
      queue.splice(0, queue.length);
      store.clear();
      isRunning = null;
    }

  };
  return promiseQueue;
}