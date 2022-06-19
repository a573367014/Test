import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeMusicItem from './music-item.vue';

// @ts-ignore 'install' does not exist
GeMusicItem.install = (Vue: VueConstructor) => {
    Vue.component(GeMusicItem.name, GeMusicItem);
};

export default GeMusicItem;
