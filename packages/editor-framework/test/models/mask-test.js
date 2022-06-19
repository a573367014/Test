require('../setup-jsdom');
const { test } = require('ava');
const { maskElement } = require('../../lib/editor-defaults/index.js');
const MaskModel = require('../../lib/models/index.js').default;
const mock = require('./mock/mask.js');

test('Have default values', t => {
    const data = JSON.parse(JSON.stringify(new MaskModel({
        type: 'mask'
    })));

    const maskData = Object.assign({}, maskElement);

    Object.keys(maskData).forEach(key => {
        const val = maskData[key];

        if(typeof val === 'object' && val !== null) {
            t.deepEqual(data[key], val, `"${key}"`);
        }
        else {
            t.is(data[key], val, `"${key}"`);
        }
    });
});

test('Compatible with less than version 2.0.0', t => {
    mock.compatible[1].$id = 2;
    t.deepEqual(
        mock.compatible[1],
        JSON.parse(JSON.stringify(new MaskModel(mock.compatible[0])))
    );
});

test('[imageWidth,imageHeight] must be a number', t => {
    mock.number[1].$id = 3;
    t.deepEqual(
        mock.number[1],
        JSON.parse(JSON.stringify(new MaskModel(mock.number[0])))
    );
});
