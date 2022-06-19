const test = require('ava');

const escape = require('../../lib/utils/escape-html');

test('escape keep', t => {
    t.is(
        '123',
        escape('123')
    );
    t.is(
        '123 456',
        escape('123 456')
    );
    t.is(
        '  123 456',
        escape('  123 456')
    );
    t.is(
        `123
456`,
        escape(`123
456`)
    );
    t.is(
        `123


456`,
        escape(`123


456`)
    );
    t.is(
        '123 456     789  ',
        escape('123 456     789  ')
    );
    t.is(
        '<span>123</span>',
        escape('<span>123</span>', true)
    );
    t.is(
        '<span123span>',
        escape('<span123span>', true)
    );
    t.is(
        '<span>1&lt;23<span>',
        escape('<span>1<23<span>', true)
    );
    t.is(
        '<span>1&lt;2&lt;3<span>',
        escape('<span>1<2<3<span>', true)
    );
});

test('escape sanitize', t => {
    t.is(
        '&lt;div&gt;123&lt;/div&gt;',
        escape('<div>123</div>', true)
    );
    t.is(
        '&lt;div&gt;123&lt;/div&gt;<span>456</span>',
        escape('<div>123</div><span>456</span>', true)
    );
    t.is(
        '&lt;div&gt;123<span>456</span>&lt;/div&gt;',
        escape('<div>123<span>456</span></div>', true)
    );
});

test('escape keep props', t => {
    t.is(
        '&lt;div&gt;123&lt;/div&gt;<span style="color: red">456</span>',
        escape('<div>123</div><span style="color: red">456</span>', true)
    );
});
