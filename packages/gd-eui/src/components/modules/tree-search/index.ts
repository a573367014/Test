import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeTreeSearch from './tree-search.vue';

// @ts-ignore 'install' does not exist
GeTreeSearch.install = (Vue: VueConstructor) => {
    Vue.component(GeTreeSearch.name, GeTreeSearch);
};

export default GeTreeSearch;
