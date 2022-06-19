#!/usr/bin/env node
/**
 * build script
 */
'use strict';

const path = require('path');
const less = require('less');
const lodash = require('lodash');
const postcss = require('postcss');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const IS_PROD = process.env.NODE_ENV === 'production';

const BUILD_CWD = path.resolve(__dirname, '..');
const BUILD_LIB = path.join(BUILD_CWD, 'lib');
const BUILD_SRC = path.join(BUILD_CWD, 'src');

const pkgs = require('../package.json');
const { exec } = require('./utils');

// style config
const stylesName = 'vue-poster-editor.css';
const stylesPath = path.join(BUILD_SRC, 'styles');
const stylesEntry = path.join(stylesPath, 'index.less');
const stylesLibDist = path.resolve(BUILD_LIB, 'styles', stylesName);

// mixin process.env
Promise.try(() => {
    console.log('Init env variables');

    // global env
    process.env.__VERSION__ = pkgs.version;
    process.env.__DEV__ = IS_PROD ? '' : 'true';
})
    // clean
    .then(() => {
        console.log('○ Clean...');

        return Promise.all([exec(`rimraf ${BUILD_LIB}`)]);
    })
    .then(() => {
        return Promise.all([fs.mkdirAsync(BUILD_LIB)]);
    })
    .then(() => {
        return fs.mkdirAsync(path.resolve(BUILD_LIB, 'styles'));
    })
    // compile less
    .then(() => {
        console.log('○ Compile less...');

        return fs.readFileAsync(stylesEntry).then((buf) => {
            return less.render(buf.toString(), {
                filename: stylesEntry,
                paths: [stylesPath],
                relativeUrls: true,
                compress: false,
            });
        });
    })
    // postcss
    .then((output) => {
        console.log('○ Postcss...');

        return postcss([
            require('postcss-inline-svg')({
                removeFill: false,
            }),
            require('postcss-cssnext')(),
        ]).process(output.css, {
            from: stylesEntry,
        });
    })
    // Write css to lib
    .tap((output) => {
        console.log('○ Write css to lib...');

        return fs.writeFileAsync(stylesLibDist, output.css);
    })
    // Build JS modules
    .then(() => {
        console.log('○ Build JS modules...');

        const CWD = process.cwd();
        const cmd = [
            'babel',
            path.relative(CWD, BUILD_SRC),
            `--out-dir ${path.relative(CWD, BUILD_LIB)}`,
            '--copy-files',
        ].join(' ');

        return exec(cmd, {
            env: lodash.defaults(
                {
                    BABEL_ENV: 'lib',
                },
                process.env,
            ),
        });
    })
    // Build TS modules
    .then(() => {
        console.log('○ Build TS modules...');
        return exec('tsc');
    })
    // Clean up redundant TS files
    .then(() => {
        return Promise.all([exec(`rimraf "${BUILD_LIB}/**/*.ts"`)]);
    })
    // done
    .then(() => {
        console.log('🌈 Build done!');
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
