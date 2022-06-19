const test = require('ava');
const { JSDOM } = require('jsdom');
const window = new JSDOM('<!DOCTYPE html>').window;
const document = window.document;

global.window = window;
global.document = document;

const serialize = require('../../lib/utils/rich-text/utils/serialize.js');

test('Invalid: fromJSON', t => {
    t.deepEqual([], serialize.fromJSON('<span></span>'), 'return empty');

    t.deepEqual(
        [{ content: 'Hello World' }],
        serialize.fromJSON('<span>Hello World</span>'),
        'serialization'
    );

    t.deepEqual(
        [{ content: '1 2 3 4' }],
        serialize.fromJSON('<span>1 <span style="">2 <span>3</span></span> 4</span>'),
        'complex serialization'
    );

    t.deepEqual(
        [{ content: '<">"' }],
        serialize.fromJSON('<div><">"</div>'),
        'unescaped string'
    );

    t.deepEqual(
        [{ content: 'Hello <">" World' }],
        serialize.fromJSON('Hello &lt;&quot;&gt;&quot; World'),
        'unescaped string v2'
    );

    const style = 'font-size: 12px; text-decoration: underline; font-weight: bold; font-style:italic; color: rgba(0,0,0,0.9)';
    const styleModel = {
        fontSize: 12,
        textDecoration: 'underline',
        fontWeight: 700,
        fontStyle: 'italic',
        color: 'rgba(0, 0, 0, 0.9)'
    };

    // 样式转model
    t.deepEqual(
        [
            Object.assign({}, styleModel, { content: 'Hello World' })
        ],
        serialize.fromJSON(`<span style="${style}">Hello World</span>`),
        'style serialization'
    );

    // 特殊标签转样式model
    t.deepEqual(
        [
            { fontWeight: 700, content: '加粗' },
            { fontStyle: 'italic', content: 'i倾斜em倾斜' },
            { textDecoration: 'underline', content: '下划线' },
            { textDecoration: 'line-through', content: '删除线' },
            { fontFamily: '微软雅黑', color: '#ffffff', content: '字体、颜色' }
        ],
        serialize.fromJSON('<b>加粗</b><i>i倾斜</i><em>em倾斜</em><u>下划线</u><strike>删除线</strike><font face="微软雅黑" color="#ffffff">字体、颜色</font>'),
        'tag to style'
    );

    // 样式继承
    t.deepEqual(
        [
            { fontSize: 12, fontWeight: 700, content: '1 ' },
            { fontSize: 14, fontWeight: 700, content: '2 ' },
            { fontSize: 14, fontWeight: 700, textDecoration: 'underline', content: '3' },
        ],
        serialize.fromJSON('<span style="font-size: 12px; font-weight: bold">1 <span style="font-size: 14px">2 <u>3</u></span><span>'),
        'style extends'
    );

    // 样式合并
    t.deepEqual(
        [
            { fontSize: 12, content: '1 23' },
        ],
        serialize.fromJSON('<span style="font-size: 12px;">1 <span style="font-size: 12px">2</span><span><span style="font-size: 12px;">3</span><span>'),
        'style merge'
    );

    // 空节点移除
    t.deepEqual(
        [{ content: 'test' }],
        serialize.fromJSON('<div><span></span></div>test'),
        'remove invalid node'
    );

    // br转换规则
    t.deepEqual(
        [{ content: 'test1<br>test2<br>test3' }],
        serialize.fromJSON('test1<div>test2</div>test3'),
        'div之前添加br， div后不是块元素也添加br'
    );

    t.deepEqual(
        [{ content: 'test1<br><br>test2' }],
        serialize.fromJSON('<div>test1</div><br>test2'),
        'div若是第一个节点则不在之前添加br'
    );

    t.deepEqual(
        [{ content: 'test1<br><br>test2' }],
        serialize.fromJSON('<div>test1<br></div><br>test2'),
        '移除div元素内最后的br'
    );

    t.deepEqual(
        [{ content: 'test1<br>test2<br>test3<br><br>test4' }],
        serialize.fromJSON('<span>test1<br></span><div>test2</div><span>test3<br></span><br>test4'),
        '在span + div的前提下，移除span元素内最后的br'
    );
});

test('Invalid: fromHTML', t => {
    t.is(
        'Hello &lt;&quot;&gt;&quot; World',
        serialize.fromHTML([
            { content: 'Hello <">" World' }
        ]),
        'empty style return text'
    );

    t.is(
        '<span data-customize="1" style=\'font-size: 12px;font-weight: 700;\'>Hello <br>World</span>',
        serialize.fromHTML([
            { fontSize: 12, fontWeight: 700, content: 'Hello <br>World' }
        ]),
        'model deserialization'
    );
});

test('Invalid: injectStyleProps', t => {
    const injectStyleProps = { fontSize: 20, color: '#000000' };
    const model = [
        { content: 'test' },
        { fontSize: 12, content: 'test' },
        { fontWeight: 700, content: 'test' }
    ];
    const diffModel = [
        Object.assign({}, injectStyleProps, { content: 'test' }),
        Object.assign({}, injectStyleProps, { content: 'test' }),
        Object.assign({}, injectStyleProps, { fontWeight: 700, content: 'test' }),
    ];

    t.deepEqual(diffModel, serialize.injectStyleProps(model, injectStyleProps));
});

test('Invalid: getAllEqualStyleProps', t => {
    t.deepEqual(
        {
            textDecoration: 'none',
            fontStyle: 'normal',
            fontWeight: 400,
        },
        serialize.getAllEqualStyleProps([
            { content: 'test' },
            { content: 'test' },
        ]),
        'return default'
    );

    t.deepEqual(
        {
            fontStyle: 'normal',
            fontWeight: 400,
            color: '#ffffff',
            fontSize: 14
        },
        serialize.getAllEqualStyleProps([
            { textDecoration: 'line-through', color: '#ffffff', fontSize: 14, content: 'test' },
            { textDecoration: 'underline', color: '#ffffff', fontSize: 14, content: 'test' }
        ]),
        'delete different, return the same, including all undefine'
    );
});
