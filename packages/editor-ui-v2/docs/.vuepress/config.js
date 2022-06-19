const path = require('path');
const fs = require('fs');

const rootPath = path.join(__dirname, '../');
function getDocs(dirPath) {
    const docs = [];
    dirPath = path.resolve(rootPath, dirPath);
    fs.readdirSync(dirPath).forEach(file => {
        if(path.extname(file).toUpperCase() === '.MD' ) {
            docs.push(path.relative(rootPath, path.resolve(dirPath, file)));
        }
    });
    return docs;
}

const baseDocs = getDocs('base');
const componentDocs = getDocs('components');
const containerDocs = getDocs('containers');

module.exports = {
    devtool: 'source-map',
    title: 'editor ui',
    themeConfig: {
        sidebar: [
            '/start/start',
            {
                title: '布局容器',
                children: containerDocs
            },
            {
                title: '基础组件库',
                children: baseDocs
            },
            {
                title: '高级组件库',
                children: componentDocs
            }
        ]
    },
    dest: path.resolve(__dirname, '../../../../docs/public/docs/editor-ui'),
    base: '/pages/gaoding/editor/docs/editor-ui/',
    head: [
        
    ],
    plugins: [
        require('./plugins/demo')
    ],
    postcss: {
        plugins: () => [
            require('postcss-inline-svg')({
                removeFill: false,
                encode: function(code) {
                    return encodeURIComponent(code);
                }
            }),
            require('postcss-cssnext')(),
            require('autoprefixer')
        ]
    },
    chainWebpack: (config, isServer) => {
        config.resolve.alias
            .set('@', path.resolve(__dirname, '../../'));
        
        config.module
            .rule('less')
            .oneOf('normal')
            .use('sass-resources-loader')
            .loader('sass-resources-loader')
            .tap(() => {
                return {
                    resources: [path.resolve(__dirname, '../../src/styles/variables.less')]
                };
            });

        config.module
            .rule('less')
            .oneOf('vue')
            .use('sass-resources-loader')
            .loader('sass-resources-loader')
            .tap(() => {
                return {
                    resources: [path.resolve(__dirname, '../../src/styles/variables.less')]
                };
            });
    }
}