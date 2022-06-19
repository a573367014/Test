const { spawn } = require('child_process');
const path = require('path');
const exec = require('child_process').exec;
let currentCwd = path.resolve(__dirname, '../../');

/**
 * @param {string} command
 * @param {string} args
 */
function commandline(command, args = [], callback = () => {}, close = () => {}) {
    const ps = spawn(command + ' && echo cwd=$PWD', args, {
        cwd: currentCwd,
        shell: true,
        env: process.env,
    });
    ps.stdout.setEncoding('utf-8');
    ps.stdout.on('data', (data) => {
        console.log(`('######', stdout: ${data}`, typeof data);
        if (data && typeof data === 'string' && data.match(/cwd=/)) {
            const newCwd = data.split('=');
            if (newCwd.length >= 2) {
                currentCwd = newCwd[1].replace(/[\s\n]/g, '');
            }
            const md = data.substring(0, data.lastIndexOf('cwd='));
            callback && callback(`${md}`);
        } else {
            callback && callback(`${data}`);
        }
    });
    ps.stderr.on('data', (data) => {
        console.error(`#####stderr: ${data}`);
        callback && callback(`${data}`);
    });
    ps.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        close && close();
    });
    ps.on('error', (err) => {
        console.log('!!!!!!!!!!', err);
    });
    ps.on('exit', () => {});
}

/**
 * 执行shell命令
 * @param {String} command 命令
 * @param {(err, stdout, over)} cb 回调
 */
function execute(command, cb, cwd = null) {
    exec(command, { cwd: cwd || currentCwd }, function (error, stdout) {
        console.log('stdout', stdout);
        cb(error, stdout, true);
    });
}

/**
 * @param {string} command 同步命令
 */
async function executeSync(command, cwd = null) {
    return new Promise((resolve, reject) => {
        execute(
            command,
            (err, stdout, over) => {
                if (err) {
                    reject();
                    return;
                }
                if (over) {
                    resolve(stdout);
                }
            },
            cwd,
        );
    });
}

module.exports = {
    commandline,
    executeSync,
    execute,
};
