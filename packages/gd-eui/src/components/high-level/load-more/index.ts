import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeLoadMore from './load-more.vue';

// @ts-ignore 'install' does not exist
GeLoadMore.install = (Vue: VueConstructor) => {
    Vue.component(GeLoadMore.name, GeLoadMore);
};

export default GeLoadMore;
