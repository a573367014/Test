import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeStyleSelectItemList from './style-select-item-list.vue';

// @ts-ignore 'install' does not exist
GeStyleSelectItemList.install = (Vue: VueConstructor) => {
    Vue.component(GeStyleSelectItemList.name, GeStyleSelectItemList);
};

export default GeStyleSelectItemList;
