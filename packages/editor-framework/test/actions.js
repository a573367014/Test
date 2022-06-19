export default {
    addText(editor) {
        editor.addText('Hello World!', { fontSize: 50 });
    },
    addImage(editor) {
        editor.addImage('//st0.dancf.com/www/0/design/1465798469378-1.png', {
            width: 800,
            height: 533
        });
    },
    addMask(editor) {
        editor.addElement({
            type: 'mask',
            left: 0,
            top: 0,
            height: 533 / 2.5,
            width: 800 / 2.5,
            imageTransform: {
                a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0
            },
            url: '//st0.dancf.com/www/0/design/1465798469378-1.png',
            mask: '//st0.dancf.com/www/0/design/1465798469378-1.png'
        });
    }
};
