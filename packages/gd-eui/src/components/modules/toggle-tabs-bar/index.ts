import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeToggleTabsBar from './toggle-tabs-bar.vue';

// @ts-ignore 'install' does not exist
GeToggleTabsBar.install = (Vue: VueConstructor) => {
    Vue.component(GeToggleTabsBar.name, GeToggleTabsBar);
};

export default GeToggleTabsBar;
