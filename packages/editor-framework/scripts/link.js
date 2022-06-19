/**
 * manually link poster editor to other projects
 */
'use strict';

const path = require('path');
const { exec } = require('./utils');
const pkg = require('../package.json');

const target = process.argv[2];
console.log('Begin linking, please make sure other deps in gd-editor are built.');

if (!target) {
    console.warn('Invalid link target');
    return;
}

if (!pkg.name) {
    console.warn('Invalid package.json > name');
    return;
}

const baseDir = path.join(__dirname, '../');
// 区分相对路径与绝对路径
const targetDepsDir =
    target[0] === '/'
        ? path.join(target, `node_modules/${pkg.name}`)
        : path.join(__dirname, '../', target, `node_modules/${pkg.name}`);

// npm pack 打包出的压缩包
const baseTgz = baseDir + '/' + pkg.name + '*.tgz';
const targetTgz = targetDepsDir + '/' + pkg.name + '.tgz';

exec(
    `rm -rf ${targetDepsDir} && echo 'step 1' &&
    mkdir ${targetDepsDir} && echo 'step 2' &&
    npm pack && echo 'step 3' &&
    mv ${baseTgz} ${targetTgz} && echo 'step 4' &&
    cd ${targetDepsDir} && tar -xf ${targetTgz} && echo 'step 5' &&
    cp -rf ${targetDepsDir}/package/* ${targetDepsDir} && echo 'step 6'`,
)
    .then(() => {
        console.log('🌈 Link done!');
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
