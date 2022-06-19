import '../../../init-setting';
import type { VueConstructor } from 'vue';
import Waterfall from './waterfall.vue';
import WaterfallItem from './waterfall-item.vue';

// @ts-ignore 'Item' does not exist
Waterfall.Item = WaterfallItem;

// @ts-ignore 'install' does not exist
Waterfall.install = function (Vue: VueConstructor) {
    Vue.component(Waterfall.name, Waterfall);
    Vue.component(WaterfallItem.name, WaterfallItem);
};

export { WaterfallItem };

export default Waterfall;
