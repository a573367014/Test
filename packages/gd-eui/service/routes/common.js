const router = require('koa-router')();
const rpu = require('../utils/rpu');
const { jscpd } = require('jscpd');
const path = require('path');
const { executeSync } = require('../pip');

router.post('/jscpd', async (ctx) => {
    const data = await jscpd(['', '', path.resolve(__dirname, '../../src')]);
    ctx.body = rpu.success(data);
});

router.post('/publish/beta', async (ctx) => {
    try {
        const res = await executeSync(
            'yarn build && yarn publish-beta',
            path.resolve(__dirname, '../../'),
        );
        ctx.body = rpu.success(res);
    } catch (error) {
        ctx.body = rpu.error();
    }
});

module.exports = router;
