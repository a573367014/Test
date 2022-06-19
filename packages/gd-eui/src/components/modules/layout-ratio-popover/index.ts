import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeLayoutRatioPopover from './layout-ratio-popover.vue';

// @ts-ignore install not exist
GeLayoutRatioPopover.install = (Vue: VueConstructor) => {
    Vue.component(GeLayoutRatioPopover.name, GeLayoutRatioPopover);
};

export default GeLayoutRatioPopover;
