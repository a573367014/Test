import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeCompositionSearch from './composition-search.vue';

// @ts-ignore 'install' does not exist
GeCompositionSearch.install = (Vue: VueConstructor) => {
    Vue.component(GeCompositionSearch.name, GeCompositionSearch);
};

export default GeCompositionSearch;
