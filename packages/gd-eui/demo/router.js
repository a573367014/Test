import DemoGeSlider from './components/demo-slider';
import DemoGeSliderList from './components/demo-slider-list';
import DemoGeStylePreview from './components/demo-style-preview';
import DemoGeStyleBackground from './components/demo-style-background';
import DemoLoadMore from './components/demo-load-more';
import DemoStyleSelectItemList from './components/demo-style-select-item-list';
import DemoGeTagSelect from './components/demo-tag-select.vue';
import DemoToggleTabsBar from './components/demo-toggle-tabs-bar';
import DemoLayoutRatioPopover from './components/demo-layout-ratio-popover';
import DemoDropdownFontSize from './components/demo-dropdown-font-size';
import DemoImage from './components/demo-image';
import DemoPopoverInput from './components/demo-popover-input';
import DemoAsideButton from './components/demo-aside-button.vue';
import DemoColorPicker1 from './components/demo-color-picker-1.vue';
import DemoColorPicker2 from './components/demo-color-picker-2.vue';
import DemoColorPicker3 from './components/demo-color-picker-3.vue';
// >>> insert component

const routes = [
    {
        path: '/base/slider',
        name: 'GeSlider',
        meta: {
            component: 'slider',
        },
        component: DemoGeSlider,
    },
    {
        path: '/modules/load-more',
        name: 'GeLoadMore',
        meta: {
            component: 'load-more',
        },
        component: DemoLoadMore,
    },
    {
        path: '/modules/aside-button',
        name: 'GeAsideButton',
        meta: {
            component: 'aside-button',
        },
        component: DemoAsideButton,
    },
    {
        path: '/modules/style-preview',
        name: 'GeStylePreview',
        meta: {
            component: 'style-preview',
        },
        component: DemoGeStylePreview,
    },
    {
        path: '/modules/slider-list',
        name: 'GeSliderList',
        meta: {
            component: 'slider-list',
        },
        component: DemoGeSliderList,
    },
    {
        path: '/modules/color-picker-1',
        name: 'GeColorPicker 单色',
        meta: {
            component: 'color-picker',
        },
        component: DemoColorPicker1,
    },
    {
        path: '/modules/color-picker-2',
        name: 'GeColorPicker 渐变色',
        meta: {
            component: 'color-picker',
        },
        component: DemoColorPicker2,
    },
    {
        path: '/modules/color-picker-3',
        name: 'GeColorPicker 单色 & 渐变色',
        meta: {
            component: 'color-picker',
        },
        component: DemoColorPicker3,
    },
    {
        path: '/modules/popover-input',
        name: '/modules/popover-input',
        meta: {
            component: 'popover-input',
        },
        component: DemoPopoverInput,
    },
    {
        path: '/modules/image',
        name: '/modules/image',
        meta: {
            component: 'image',
        },
        component: DemoImage,
    },
    {
        path: '/modules/style-background',
        name: '/modules/style-background',
        meta: {
            component: 'style-background',
        },
        component: DemoGeStyleBackground,
    },
    {
        path: '/modules/style-select-item-list',
        name: '/modules/style-select-item-list',
        meta: {
            component: 'style-select-item-list',
        },
        component: DemoStyleSelectItemList,
    },
    {
        path: '/modules/tag-select',
        name: '/modules/tag-select',
        meta: {
            component: 'tag-select',
        },
        component: DemoGeTagSelect,
    },
    {
        path: '/modules/toggle-tabs-bar',
        name: '/modules/toggle-tabs-bar',
        meta: {
            component: 'toggle-tabs-bar',
        },
        component: DemoToggleTabsBar,
    },
    {
        path: '/modules/layout-ratio-popover',
        name: '/modules/layout-ratio-popover',
        meta: {
            component: 'layout-ratio-popover',
        },
        component: DemoLayoutRatioPopover,
    },
    {
        path: '/modules/dropdown-font-size',
        name: '/modules/dropdown-font-size',
        meta: {
            component: 'dropdown-font-size',
        },
        component: DemoDropdownFontSize,
    },
    // >>> insert component router
    {
        path: '*',
        component: DemoGeSlider,
    },
];

export default routes;
