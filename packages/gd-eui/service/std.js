// const fs = require('fs');
// const path = require('path');
// const escomplex = require('typhonjs-escomplex');

// const { openSync, createWriteStream } = require('fs');

// const content = fs.readFileSync(
//     path.resolve(__dirname, '../src/components/base/slider/index.ts'),
//     'utf8',
// );
// const report = escomplex.analyzeModule(content);
// console.dir(report, { depth: null });

// const { spawn } = require('child_process');
// const path = require('path');
// const spawnArgs = require('spawn-args');
// console.log(spawnArgs('cd .. && ls'));
// const parserCommand = require('./utils/parser-commond');
// const { parseArgsStringToArgv } = require('string-argv');
// // parseArgsStringToArgv('cd ../ && ls');
// console.log('parseArgsStringToArgv', parseArgsStringToArgv('cd ../ && ls'))
// // const args = parserCommand('cd .. && yarn build');
// // console.log('args', args);
// const args = spawnArgs('cd .. && ls');
// console.log('args', args);

// const ls = spawn('yarn', ['build'], {
//     stdio: 'pipe',
//     cwd: path.resolve(__dirname, '../'),
// });

// ls.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
// });

// ls.stderr.on('error', (data) => {
//     console.log(`error: ${data}`);
// });

// ls.on('error', (data) => {
//     console.log(`error: ${data}`);
// });

// ls.on('exit', (data) => {
//     console.log(`exit: ${data}`);
// });
// console.log = (function (oriLogFunc) {
//     return function () {
//       //判断配置文件是否开启日志调试
//       try{
//         oriLogFunc.call(console, ['#######', ...arguments]);
//       }catch(e){
//         console.error('console.log error', e);
//       }
//     }
//   })(console.log);
// "inherit"
// const pp = require("child_process").spawn('');
// const file = openSync('./test.text', 'w');

// const controller = new AbortController();
// const { signal } = controller;

// ps.stdin.end();
// ps.on('close', (code) => {
//     console.log(`child process exited with code ${code}`);
//     close && close();
// });

function run() {
    // console.log(process.stdout)
    // process.stdout.on('data', (data) => {
    //     console.log('lll', data);
    // });
    // process.on('data', (data) => {
    //     console.log(data);
    // });
    // const access = createWriteStream('./test.text');
    // const fn = process.stdout.write;
    // function write() {
    //     fn.apply(process.stdout, arguments);
    //     console.log('######', arguments)
    //     const st = arguments.reduce((pre, value) => {
    //         return pre + '' + value;
    //     }, '');
    //     access.write(st);
    // }
    // process.stdout.write = write;
    const ps = require('child_process').spawn('cd .. && yarn build && echo cwd=$PWD', [], {
        cwd: process.cwd(),
        env: process.env,
        // detached: true,
        shell: true,
        // stdio: 'inherit'
        // stdio: ['inherit', 'pipe', 'pipe'],
        // stdio: ['pipe', process.stdout, process.stderr],
        // stdio: ['pipe', 'pipe', 'pipe'],
    });
    // ps.stdout.pipe(process.stdout);
    ps.stdout.setEncoding('utf-8');
    ps.stdout.on('data', (data) => {
        console.log('#####', data);
        if (data.match(/cwd=/)) {
            console.log(data.split('='));
        }
    });
    ps.stderr.setEncoding('utf-8');
    ps.stderr.on('data', (stderr) => {
        console.log('stderr', stderr);
    });
    // process.on('message', (message) => {
    //     console.log('message', message);
    // })
    // process.on('exit', () => {
    //     console.log('process exit');
    // })
    // process.on('close', () => {
    //     console.log('close');
    // });

    // const access = createWriteStream('./test.text');

    // commnd
    // console.log('ps', process);
    // process.stdout.on('data', (data) => {
    //     console.log('lll', data);
    // });
    // process.stdout.on('close', () => {
    //     console.log('lll close');
    // });
    // ps.stdout.setEncoding('utf-8');
    // ps.stdout.addListener('data', (data) => {
    //     console.log('####', data);
    // });
    ps.on('message', (data) => {
        console.log('########', data);
    });
    ps.on('data', (data) => {
        console.log('########', data);
    });
    ps.on('close', () => {
        console.log('close', ps.process);
    });
    ps.on('exit', () => {
        console.log('exit');
    });

    // console.log('ps', process.stdout);
    // ps.stdout.setEncoding('utf-8');
    // ps.stdout.addListener('data', (data) => {
    //     console.log('####', data);
    // });

    // ps.stdout.addListener('end', (data) => {
    //     console.log('#### end');
    // });

    // ps.stdout.addListener('close', (data) => {
    //     console.log('#### close');
    // });
    // ps.on('data', (data) => {
    //     console.log('ps data', data);
    // });
    // ps.on('close', () => {
    //     console.log('ps close');
    // });

    // ps.on('disconnect', () => {
    //     console.log('ps disconnect');
    // });

    // ps.once('exit', (code) => {
    //     console.log('exit', code);
    //     // ps.kill(1);
    //     // controller.abort();
    // });
}

run();
