import Vue from 'vue';
import PopupApp from './popup-app.vue';

const VuePopupApp = Vue.extend(PopupApp);
let app;
export function createPopup(options = {}) {
    if(!app) {
        app = new VuePopupApp({ ...PopupApp, ...options });
        app.$mount();
        document.body.appendChild(app.$el);
    }
    return app;
};
