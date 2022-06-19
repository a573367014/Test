const { resolve } = require('path');
const { startDevServer } = require('@cypress/vite-dev-server');

module.exports = (on, config) => {
    on('dev-server:start', (options) => {
        return startDevServer({
            options,
            viteConfig: {
                configFile: resolve(__dirname, '../../vite.config.js'),
            },
        });
    });

    return config;
};
