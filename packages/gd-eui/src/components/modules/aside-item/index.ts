import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeAsideItem from './aside-item.vue';

// @ts-ignore 'install' does not exist
GeAsideItem.install = (Vue: VueConstructor) => {
    Vue.component(GeAsideItem.name, GeAsideItem);
};

export default GeAsideItem;
