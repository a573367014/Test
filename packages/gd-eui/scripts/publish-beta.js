const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const package = require('../package.json');
console.log('running in beta...');

function errLog(...params) {
    console.error('\x1b[91m', ...params);
}

/**
 * 执行发布
 */
function execNpmPublish() {
    return new Promise((resolve, reject) => {
        console.log('running publish...');
        exec(
            'npm publish --tag beta --registry https://registry-npm.gaoding.com',
            (err, stdout) => {
                if (err) {
                    errLog('exec err, npm publish', err);
                    reject();
                    return;
                }
                console.log('npm publish success.');
                console.log(stdout);
                resolve();
            },
        );
    });
}

function getNextBetaVersion() {
    const btInfo = execSync('npm dist-tag ls @editor/gd-eui', {
        encoding: 'utf-8',
    });
    const betaVersion = btInfo.match(/[\w.]*-beta/)[0].replace('-beta', '');
    const versionSpl = betaVersion.split('.');
    const nextBetaVersion = versionSpl.reduce((pre, currentValue, currentIndex) => {
        if (currentIndex === versionSpl.length - 1) {
            return pre + `${parseInt(currentValue) + 1}`;
        }
        return pre + currentValue + '.';
    }, '');
    return nextBetaVersion;
}

async function main() {
    const nextBetaVersion = getNextBetaVersion();
    const packageFilePath = path.resolve(__dirname, '../package.json');
    const packageContent = readFileSync(packageFilePath, 'utf-8');
    writeFileSync(
        packageFilePath,
        packageContent.replace(
            `"version": "${package.version}"`,
            `"version": "${nextBetaVersion}-beta"`,
        ),
    );
    await execNpmPublish();
    writeFileSync(packageFilePath, packageContent);
}

main();
