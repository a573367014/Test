import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeCategorySearch from './category-search.vue';

// @ts-ignore 'install' does not exist
GeCategorySearch.install = (Vue: VueConstructor) => {
    Vue.component(GeCategorySearch.name, GeCategorySearch);
};

export default GeCategorySearch;
