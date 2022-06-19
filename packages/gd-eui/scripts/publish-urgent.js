const exec = require('child_process').exec;
// 不做检查，紧急情况下使用
console.log('running in pro...');

function errLog(...params) {
    console.error('\x1b[91m', ...params);
}

/**
 * 执行发布
 */
function execNpmPublish() {
    return new Promise((resolve, reject) => {
        console.log('running pro publish...');
        exec(
            'npm publish --access public --registry https://registry-npm.gaoding.com',
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

execNpmPublish();
