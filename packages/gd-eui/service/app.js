const Koa = require('koa');
const app = new Koa();
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');
const koaBody = require('koa-body');
// 跨域处理
const cors = require('koa2-cors');
const commonRoute = require('./routes/common');
app.use(
    koaBody({
        multipart: true,
        formidable: {
            maxFileSize: 200 * 1024 * 1024, // 设置上传文件大小最大限制，默认2M
        },
    }),
);

// 系统错误处理
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error('server error', err);
    }
});

process.on('uncaughtException', function (err) {
    // 打印出错误
    console.log(err);
    // if (err) {
    // }
    // 打印出错误的调用栈方便调试
    console.log(err.stack);
});

app.use(cors());
app.use(
    bodyparser({
        enableTypes: ['json', 'form', 'text'],
    }),
);
app.use(json());

app.use(async function (ctx, next) {
    /**
     * @type {import('koa/lib/request')}
     */
    const request = ctx.request;
    const url = request.url;
    const method = request.method;

    /**
     * @type {import('koa/lib/response')}
     */
    const response = ctx.response;
    await next();
});
app.use(commonRoute.routes());

// logger
app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

module.exports = app;
