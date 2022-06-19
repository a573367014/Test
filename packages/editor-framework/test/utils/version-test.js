const test = require('ava');

const version = require('@gaoding/editor-utils/version');

test('0', t => {
    t.is(0, version.parse('0').number);
});

test('2.1.1', t => {
    t.is(2001001, version.parse('2.1.1').number);
});

test('21.01.12', t => {
    t.is(21001012, version.parse('21.01.12').number);
});

test('0.1.0', t => {
    t.is(1000, version.parse('0.1.0').number);
});
