const editorDefaults = require('../../../lib/editor-defaults/index.js');
const { merge } = require('lodash');

const commonData = merge(
    editorDefaults.element,
    editorDefaults.elementExts,
    editorDefaults['textElement']
);

const compatibleData = {
    'type': 'text',
    'writingMode': 'lr-tb',
    'padding': [10, 10, 10, 10],
    'width': 100,
    'height': 100,
    'resize': 0b111
};

module.exports = {
    commonData,
    compatible: [
        compatibleData,
        merge(
            {}, commonData, {
                type: 'text',
                writingMode: 'horizontal-tb',
                padding: compatibleData.padding,
                width: 120,
                height: 120,
                version: editorDefaults.version,
                resize: compatibleData.resize
            }
        )
    ],

    hexaToRgba: [
        {
            type: 'text',
            backgroundColor: '#000000ff',
            textShadow: {
                color: '#000000f0'
            }
        },
        merge({}, commonData, {
            type: 'text',
            color: 'rgb(0, 0, 0)',
            backgroundColor: 'rgb(0, 0, 0)',
            textShadow: {
                color: 'rgba(0, 0, 0, 0.94)'
            },
            version: editorDefaults.version
        })
    ],

    autoScale: [
        {
            type: 'text',
            writingMode: 'horizontal-tb',
            resize: 0b101
        },
        {
            type: 'text',
            writingMode: 'vertical-rl',
            resize: 0b011
        },
        {
            type: 'text'
        },
        merge({}, commonData, {
            type: 'text',
            autoScale: true,
            version: editorDefaults.version
        })
    ]
};
