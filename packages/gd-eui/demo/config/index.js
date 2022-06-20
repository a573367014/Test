const ENV = {
    env: 'beta',
};
export default {
    VERSION: '0.0.1',
    DEBUG: false,
    DOMAIN: ENV.env === 'beta' ? 'http://localhost:3000/' : window.location.origin + '/',
    DOWN_DOMAIN: 'http://www.xxx.com',
    H5DOMAIN: ENV.env === 'beta' ? '' : '',
    LXDOMAIN: '',
    MAPI_DOMAIN: ENV.env === 'beta' ? '' : '',
    APP_NAME: '',
    ENV: ENV.env,
    MOCK: false,
};
