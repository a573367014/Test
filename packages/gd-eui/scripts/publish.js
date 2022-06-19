const package = require('../package.json');
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const changelogPath = path.resolve(__dirname, '../CHANGELOG.md');
const MASTER_BRANCH = 'f_gd_eui_master';

function errLog(...params) {
    console.error('\x1b[91m', ...params);
}

/**
 * 执行shell命令
 * @param {String} command 命令
 * @param {Function} cb 回调
 */
function execute(command, cb) {
    exec(command, function (error, stdout) {
        cb(error, stdout);
    });
}

/**
 * 获取所有commits
 * @param {Function} callback 回调
 */
function fetchedCommits(afterTime, callback) {
    const _cmd = `git log --after='${afterTime}' --pretty=format:'{"commit":"[%h](https://git.gaoding.com/gaoding/editor/commit/%H)","author": "%aN <%aE>","date": "%ad","message": "%s"},'  -- ./ `;
    execute(_cmd, (err, stdout) => {
        callback(err, stdout);
    });
}

/**
 * 获取当前分支名称
 */
function fetchCurrentBranch() {
    return new Promise((resolve, reject) => {
        execute('git rev-parse --abbrev-ref HEAD', (err, stdout) => {
            if (err) {
                reject();
            }
            resolve(stdout.trim());
        });
    });
}

/**
 * 获取changelog
 */
function getChangelog() {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    const reg = /\d{4}-\d{1,2}-\d{1,2}\s\d{2}:\d{2}:\d{2}/g;
    const times = content.match(reg);
    return { content, lastTime: times ? times[0] : null };
}

/**
 * 日期格式化
 * @param {date} val
 */
function formatDate(date, fmt) {
    const o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length),
            );
        }
    }
    return fmt;
}

/**
 * 修改日志内容
 * @param {array} commitLogList commit日志
 */
function writeCommitsToChangelog(commitLogList, originContent = '') {
    let newContent = '';
    const title = `## ${MASTER_BRANCH} ${package.version} \n date: ${formatDate(
        new Date(),
        'yyyy-MM-dd HH:mm:ss',
    )}`;
    newContent = newContent + title + '\n';
    commitLogList.forEach((element) => {
        newContent = newContent + element + '\n';
    });
    writeChangelog(newContent + '\n\n' + originContent);
}

/**
 * 写入Changelog
 */
function writeChangelog(content) {
    fs.writeFileSync(changelogPath, content);
}

/**
 * 执行发布
 */
function execNpmPublish() {
    return new Promise((resolve, reject) => {
        console.log('running publish...');
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

/**
 * 发到远程分支
 */
function execGitPush() {
    console.log('running git push...');
    exec(
        `git add ./package.json ./CHANGELOG.md ./scripts/publish.js && git commit -m "feat: publish v${package.version}" && git push`,
        (err, out) => {
            if (err) {
                errLog('exec err, git push', err);
                return;
            }
            console.log(out);
        },
    );
}

async function main() {
    const changelog = getChangelog();
    const afterTime = changelog.lastTime ? changelog.lastTime : '2021.11.01';
    const currentBranch = await fetchCurrentBranch();
    if (currentBranch !== MASTER_BRANCH) {
        errLog(`ERROR!!, please publish in ${MASTER_BRANCH}.`);
        return;
    }
    fetchedCommits(afterTime, (_err, commands) => {
        if (_err) {
            errLog('exec err, fetch commits');
            return;
        }
        commands = JSON.parse(`[${commands.substring(0, commands.length - 1)}]`);
        const newLogList = [];
        if (commands.length > 0) {
            commands.forEach((item) => {
                // 过滤
                if (item.message.indexOf('feat: publish') !== -1) {
                    return;
                }
                newLogList.push(`+ ${item.message} [${item.commit}]`);
            });
        }
        if (newLogList.length > 0) {
            writeCommitsToChangelog(newLogList, changelog.content);
        }
        execNpmPublish()
            .then(() => {
                // 发布成功，执行git push
                execGitPush();
            })
            .catch(() => {
                // 发布失败
                writeChangelog(changelog.content);
            });
    });
}

main();
