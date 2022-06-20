#!/usr/bin/env node
/**
 * changelog script
 */
'use strict';

const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const INJECT_STR = '<!--NEW_LOG_INJECT_HERE-->';
const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');
const pkg = require('../package.json');

const date = new Date().toISOString().slice(0, 10);

const template = `${INJECT_STR}

### \`V${pkg.version}\` - ${date}
* feat: TODO
* fix: TODO
* docs:
* style:
* refactor:
* test:
* chore:
`;

fs.readFileAsync(CHANGELOG_PATH, 'utf8')
    .then((file) => {
        const newFile = file.replace(INJECT_STR, template);
        fs.writeFileSync(CHANGELOG_PATH, newFile, 'utf8');
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
