import Promise from 'bluebird';

const createTimeoutPromise = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('timeout'));
        }, time);
    });
};

/**
 * 按顺序执行 promise，
 * 忽略同 id 下中间状态的 promise（不会被 resolve）。
 *
 * @export
 * @returns
 */
export function createPromiseQueue(options = {}) {
    const store = new Map();
    const queue = [];
    let isRunning = false;
    const exec = async () => {
        isRunning = true;

        const id = queue.shift();
        const idQueue = store.get(id);
        const { createPromise, resolve, reject } = idQueue.pop();
        const withTimeout = [createPromise()].concat(
            options.timeout ? [createTimeoutPromise(options.timeout)] : [],
        );

        try {
            const result = await Promise.race(withTimeout);
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

            return new Promise((resolve) => {
                const time = setInterval(() => {
                    if (this.promises.length) {
                        this.lock = true;
                        resolve(time);
                    }
                }, delay);
            }).then(() =>
                Promise.all(this.promises).then((res) => {
                    this.lock = false;
                    this.promises = [];
                    return res;
                }),
            );
        },
        async run(id, createPromise) {
            if (!store.get(id)) {
                store.set(id, []);
            }
            if (!queue.includes(id)) {
                queue.push(id);
            }

            const promise = new Promise((resolve, reject) => {
                store.get(id).push({
                    createPromise,
                    resolve,
                    reject,
                });
            });

            if (!isRunning) {
                if (options.wait) {
                    isRunning = true;
                    await Promise.delay(options.wait);
                }
                exec();
            }

            return promise;
        },
        clear() {
            queue.splice(0, queue.length);
            store.clear();
            isRunning = null;
        },
    };

    return promiseQueue;
}
