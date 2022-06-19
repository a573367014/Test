import Vue from 'vue';
import GdIcons from './gd-icons';

const plugins = [GdIcons];

export default {
    install: () => {
        plugins.forEach((plugin) => {
            Vue.use(plugin);
        });
    },
};
