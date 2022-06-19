import Vue from 'vue';
import GdEui from '../../src/index';
import './styles/index.less';
import { generate } from 'preprocess-to-css-variable/es/';

generate();

if (!Vue.prototype.$isServer) {
    // TODO: jszip umd 打包异常
    window.global = window;
} else {
    global.navigator = {
        userAgent: 'node',
    };

    // window.navigator = {
    //     userAgent: 'node',
    // };
    global.window = {
        navigator: {
            userAgent: 'node',
        },
    };
}

export default ({
    Vue, // VuePress 正在使用的 Vue 构造函数
    options, // 附加到根实例的一些选项
    router, // 当前应用的路由实例
    siteData, // 站点元数据
}) => {
    Vue.use(GdEui);
    // Vue.use(VueCompositionAPI);
};
