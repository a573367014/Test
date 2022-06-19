/**
 * manually link poster editor to other projects
 */
'use strict';

const path = require('path');
const { exec } = require('./utils');

const target = process.argv[2];
console.log('Begin linking, please make sure other deps in gd-editor are built.');

if(!target) {
    console.warn('Invalid link target');
    return;
}

const baseDir = path.join(__dirname, '../');
// 区分相对路径与绝对路径
const targetDepsDir = target[0] === '/'
    ? path.join(target, 'node_modules/@gaoding/editor-ui')
    : path.join(__dirname, '../', target, 'node_modules/@gaoding/editor-ui');

console.log(`${baseDir} → ${targetDepsDir}`);

exec(`rm -rf ${targetDepsDir} && ln -s ${baseDir} ${targetDepsDir}`)
    .then(() => {
        console.log('🌈 Link done!');
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
