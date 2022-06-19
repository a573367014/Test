const editorDefaults = require('../../../lib/editor-defaults/index.js');
const { merge } = require('lodash');

const commonData = merge(
    editorDefaults.element,
    editorDefaults.elementExts,
    editorDefaults['maskElement']
);

module.exports = {
    number: [
        {
            type: 'mask',
            width: undefined,
            height: '',
            top: '100',
            left: '100'
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
                version: editorDefaults.version
            }
        )
    ]
};
