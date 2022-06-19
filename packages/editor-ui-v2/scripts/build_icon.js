const path = require('path');
const fs = require('fs');
const SVGSpriter = require('svg-sprite');

const iconDirPath = path.resolve(__dirname, '../src/base/icon/icons');
const outputPath = path.resolve(__dirname, '../src/base/icon');

const config = {
    svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
    },
    shape: {
        id: { // SVG shape ID related options
            generator(name) {
                return 'eui-v2-icon--' + name.split('.').slice(0, -1).join('.');
            },
        },
        dimension: { // Dimension related options
            maxWidth: 2000, // Max. shape width
            maxHeight: 2000, // Max. shape height
            precision: 2, // Floating point precision
            attributes: false, // Width and height attributes on embedded shapes
        },
        spacing: { // Spacing related options
            padding: 0, // Padding around all shapes
            box: 'content' // Padding strategy (similar to CSS `box-sizing`)
        },
        transform: [
            'svgo'
        ],
        // transform: ['svgo'], // List of transformations / optimizations
        sort: function() {
            /* ... */
        }, // SVG shape sorting callback
        meta: null, // Path to YAML file with meta / accessibility data
    },
    mode: {
        inline: true,
        'symbol': {
            'common': 'eui-v2-icons', // 公用类名
            'prefix': 'eui-v2-icons', // 单个图标前缀
            'sprite': 'icon-sprite', // svg名前缀
            'dimensions': true,
            id: 'eui'
        }
    }
};

const spriter = new SVGSpriter(config);

const iconDir = fs.readdirSync(iconDirPath);

iconDir.forEach(file => {
    const iconPath = path.resolve(iconDirPath, file);
    const svg = fs.readFileSync(iconPath, 'utf-8');
    spriter.add(iconPath, file, svg);
});

spriter.compile(function(error, result) {
    if(error) throw error;

    fs.writeFileSync(path.resolve(outputPath, 'icon-sprite.js'), 'export default `' + result.symbol.sprite.contents + '`');
});
