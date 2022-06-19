module.exports = {
    port: 3000,
    client: {},
    proxy: {},
    cookie: {
        name: 'token',
        prefix: 'Bearer ',
        path: '/',
        timeout: 1000 * 3600 * 24 * 7, // seven day
        domain: '',
        httpOnly: true,
    },
};
