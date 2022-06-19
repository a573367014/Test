const editorDefaults = require('../../../lib/editor-defaults/index.js');
const { merge } = require('lodash');

const commonData = merge(
    editorDefaults.element,
    editorDefaults.elementExts,
    editorDefaults['maskElement']
);

const compatibleData = {
    'type': 'mask',
    'width': 972,
    'height': 2208,
    'image': '//cdn.dancf.com/img/editor/place.png',
    'clip': {
        'left': 10,
        'right': 60,
        'top': 10,
        'bottom': 60
    }
};

module.exports = {
    compatible: [
        compatibleData,
        merge(
            {},
            commonData,
            {
                type: 'mask',
                width: 972,
                height: 2208,
                image: null,

                // compatible
                imageUrl: compatibleData.image,
                imageWidth: compatibleData.width + compatibleData.clip.left + compatibleData.clip.right,
                imageHeight: compatibleData.height + compatibleData.clip.top + compatibleData.clip.bottom,
                imageTransform: { a: 1, b: 0, c: 0, d: 1, tx: -10, ty: -10 },
                version: editorDefaults.version
            }
        )
    ],

    number: [
        {
            type: 'mask',
            width: undefined,
            height: '',
            top: '100',
            left: '100',
            imageWidth: '100',
            imageHeight: '100'
        },
        merge(
            {},
            commonData,
            {
                type: 'mask',
                width: editorDefaults['maskElement'].width,
                height: 0,
                top: 100,
                left: 100,
                imageWidth: 100,
                imageHeight: 100,
                version: editorDefaults.version
            }
        )
    ]
};
