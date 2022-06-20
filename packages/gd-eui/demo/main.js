import Vue from 'vue';
import App from './main.vue';
import VueRouter from 'vue-router';
import GdEUI from '../src';
import routes from './router';
import { loadScript } from './utils/utils';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import './mock';
// import { generate } from 'preprocess-to-css-variable/es';
// 开启测试主题，yarn precss
// import '../es/style/';
// generate();
loadScript('https://unpkg.com/vconsole@latest/dist/vconsole.min.js', () => {
    const vConsole = new window.VConsole();
    console.log(vConsole);
});

Vue.use(GdEUI);
Vue.use(VueRouter);


const requireComponent = import.meta.globEager('../src/components/*.vue');
console.log()
// require.context('../src/components', true, /[\w-]+\.vue$/);
Object.keys(requireComponent).forEach((fileName) => {
    const componentConfig = requireComponent(fileName);
    let componentName = upperFirst(
        camelCase(
            fileName
                .split('/')
                .pop()
                .replace(/\.\w+$/, ''),
        ),
    );
    if (componentName === 'MainColorPicker') {
        componentName = 'ColorPicker';
    }
    Vue.component('Ge' + componentName, componentConfig.default || componentConfig);
});
const router = new VueRouter({
    routes,
});

const main = new Vue({
    router,
    components: { App },
    template: '<App/>',
}).$mount('#app');

window.__Vue__ = main;
router.afterEach((to) => {
    main.$children[0].afterRouter && main.$children[0].afterRouter(to);
});
