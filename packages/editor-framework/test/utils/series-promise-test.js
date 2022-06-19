
const test = require('ava');
const Promise = require('bluebird');
const { SeriesPromise } = require('../../lib/utils/series-promise.js');

test('new SeriesPromise', t => {
    let series = new SeriesPromise();
    t.deepEqual(series.concurrency, 5);
});

let series = new SeriesPromise({
    concurrency: 10
});

test('New concurrency', t => {
    t.is(series.concurrency, 10);
    t.is(series.isRunning, false);
});

test('sereis add', t => {
    series.add(function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('ok');
            }, 2000);
        });
    }).then(res => {
        t.is(res, 'ok');
    });

    t.is(series.isRunning, true);
});

test('Runing max', t => {
    series.add(function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('ok');
            }, 2000);
        });
    }).then(() => {

    });

    t.is(series.isRunning, true);
});

test('Runing max', t => {
    let series = new SeriesPromise({
        concurrency: 10
    });

    for(let i = 100; i > 0; i--) {
        series.add(function() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve('ok');
                }, 100);
            });
        }).then(() => {

        }).catch(() => {

        });
    }

    t.is(series.promises.length + series.runnings, 100);

    setTimeout(() => {
        t.is(series.promises.length, 0);
    }, 1000);
});
