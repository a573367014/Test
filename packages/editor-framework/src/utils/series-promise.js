import Promise from 'bluebird';
import { assign } from 'lodash';

function SeriesPromise(opts = {}) {
    this.concurrency = 5;
    assign(this, opts);
    this.isRunning = false;
    this.runnings = 0;
    this.promises = [];
}

SeriesPromise.prototype.add = function (loader) {
    const promise = new Promise((resolve, reject) => {
        this.promises.push({
            resolve,
            reject,
            loader,
        });

        this.run();
    });
    return promise;
};

SeriesPromise.prototype.run = function () {
    if (this.promises.length && this.runnings < this.concurrency) {
        this.isRunning = true;

        const loader = this.promises.shift();
        ++this.runnings;
        loader
            .loader(() => {
                --this.runnings;
                if (!this.runnings) {
                    this.isRunning = false;
                }
                this.run();
            })
            .then(loader.resolve, loader.reject);
    }
};

export default new SeriesPromise();
export { SeriesPromise };
