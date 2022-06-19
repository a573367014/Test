require('../setup-jsdom');
const { test } = require('ava');
const { textElement, textEffect } = require('../../lib/editor-defaults/index.js');
const TextModel = require('../../lib/models/index.js').default;
const mock = require('./mock/text.js');

test('Have default values', t => {
    const data = JSON.parse(JSON.stringify(new TextModel({
        type: 'text'
    })));

    const maskData = Object.assign({}, textElement);
    delete maskData.color;
    delete maskData.autoScale;

    Object.keys(maskData).forEach(key => {
        let val = maskData[key];

        if(typeof val === 'object' && val !== null) {
            t.deepEqual(data[key], val, `"${key}"`);
        }
        else {
            t.is(data[key], val, `"${key}"`);
        }
    });
});

test('Compatible with less than version 2.0.0', t => {
    const diffData = mock.compatible[1];
    delete diffData.color;
    delete diffData.autoScale;

    const data = JSON.parse(JSON.stringify(new TextModel(mock.compatible[0])));
    delete data.color;
    delete data.autoScale;
    data.$id = 0;

    t.deepEqual(diffData, data);
});

test('textEffects data sync in version 3.2.1', t => {
    const data = JSON.parse(JSON.stringify(new TextModel({
        type: 'text',
        textEffects: [{}],
        version: '3.2.1'
    })));
    const length = Object.keys(data.textEffects[0]).length;

    t.true(!!length && length === Object.keys(textEffect).length);
});

test('Color hexa to rgba', t => {
    const diffData = mock.hexaToRgba[1];
    delete diffData.autoScale;

    const data = JSON.parse(JSON.stringify(new TextModel(mock.hexaToRgba[0])));
    delete data.autoScale;
    data.$id = 0;

    t.deepEqual(diffData, data);

    // textEffects color
    const { textEffects } = JSON.parse(JSON.stringify(
        new TextModel(
            Object.assign(
                {},
                mock.hexaToRgba[0],
                {
                    textEffects: [textEffect]
                }
            )
        )
    ));
    const effect = textEffects[0];

    t.is(effect.stroke.color, 'rgb(0, 0, 0)', 'effect.stroke.color');
    t.is(effect.filling.color, 'rgb(0, 0, 0)', 'effect.filling.color');
    t.is(effect.shadow.color, 'rgb(0, 0, 0)', 'effect.shadow.color');
    t.is(effect.filling.gradient.stops[0].color, 'rgb(255, 255, 255)', 'effect.filling.gradient.stops[0].color');
});

test('contents', t => {
    const data = JSON.parse(JSON.stringify(new TextModel({
        type: 'text',
        contents: undefined
    })));

    t.true(data.contents.constructor === Array);
});

test('autoScale', t => {
    const diffData = mock.autoScale[mock.autoScale.length - 1];
    delete diffData.color;

    const data1 = JSON.parse(JSON.stringify(new TextModel(mock.autoScale[0])));
    const data2 = JSON.parse(JSON.stringify(new TextModel(mock.autoScale[1])));
    const data3 = JSON.parse(JSON.stringify(new TextModel(mock.autoScale[2])));
    delete data1.color;
    delete data2.color;
    delete data3.color;
    data1.$id = data2.$id = data3.$id = 0;

    t.deepEqual(Object.assign({}, diffData, { resize: 0b101 }), data1, 'autoScale undefined + horizontal-tb + 0b101');
    t.deepEqual(Object.assign({}, diffData, { resize: 0b011, writingMode: 'vertical-rl' }), data2, 'autoScale undefined + vertical-rl + 0b011');
    t.deepEqual(Object.assign({}, diffData), data3, 'autoScale undefined + !resize');
});
