const { merge } = require('lodash');
const defaultConfig = require('./default');

const env = process.env.NODE_ENV;

module.exports = merge({}, defaultConfig, {
    env,
});
