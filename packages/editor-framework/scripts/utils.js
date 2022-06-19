const childProcess = require('child_process');
const lodash = require('lodash');

const exec = (cmd, options = {}) => {
    return new Promise((resolve, reject) => {
        // Execute command
        const child = childProcess.exec(
            cmd,
            lodash.assign(
                {
                    cwd: process.cwd(),
                    env: process.env,
                },
                options,
            ),
        );

        // Pass stdout and stderr
        child.stdout.on('data', (data) => {
            process.stdout.write(data.toString());
        });
        child.stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });

        // Handle result
        child.on('exit', (code) => {
            if (code) {
                reject(code);

                return;
            }

            resolve();
        });

        child.on('error', reject);
    });
};

module.exports = {
    exec,
};
