/**
 * manually link poster editor to other projects
 */
'use strict';

const path = require('path');
const { exec } = require('./utils');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config');

const target = process.argv[2];
console.log('Begin linking');

if(!target) {
    console.warn('Invalid link target');
    return;
}

const distDir = 'dist';
let baseDir = path.join(__dirname, '../');
// 区分相对路径与绝对路径
let targetDepsDir = target[0] === '/'
    ? path.join(target, 'node_modules/@gaoding/editor-ui')
    : path.join(__dirname, '../', target, 'node_modules/@gaoding/editor-ui');
baseDir = path.join(baseDir, distDir);
targetDepsDir = path.join(targetDepsDir, distDir);

console.log(`${baseDir} → ${targetDepsDir}`);

const compiler = webpack(Object.assign({}, webpackConfig, { mode: 'development' }));

compiler.watch({}, (err) => {
    if(err) {
        console.log(err);
    }

    exec(`rm -rf ${targetDepsDir} && cp -R ${baseDir} ${targetDepsDir}`)
        .then(() => {
            console.log('🌈 Link done!');
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
});


