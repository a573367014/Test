const path = require('path');
const { runLessToCssVariables } = require('preprocess-to-css-variable');

runLessToCssVariables({
    force: true,
    debug: true,
    libraryList: [
        {
            absolute: true,
            absolutePath: path.resolve(__dirname, '../es/index.js'),
            name: 'gd-eui',
            includes: ['es', 'lib'],
        },
        {
            absolute: true,
            absolutePath: require.resolve('@gaoding/gd-antd'),
            name: '@gaoding/gd-antd',
            includes: ['es', 'lib'],
        },
    ],
});
