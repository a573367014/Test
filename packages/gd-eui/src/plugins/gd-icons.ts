import type { VueConstructor } from 'vue/types/umd';
import Icon from '@gaoding/gd-antd/es/icon';
import '@gaoding/gd-antd/es/icon/style/css.js';

export const COMPONENT_NAME = 'GeIcon';

export const GeIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1507054_c8wb1ea0nik.js',
});

export default {
    install: (Vue: VueConstructor) => {
        !Vue.component(COMPONENT_NAME) && Vue.component(COMPONENT_NAME, GeIcon);
    },
};
