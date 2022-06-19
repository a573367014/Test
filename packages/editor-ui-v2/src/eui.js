import './styles/panel-form.less';

import BaseContainer from './base/base-container';
import HeaderContainer from './base/header-container';
import AsideContainer from './base/aside-container';
import AsideButton from './base/aside-button';
import CollapseContainer from './base/collapse-container';
import CircleProgress from './base/circle-progress';
import PanelContainer from './base/panel-container';
import MainContainer from './base/main-container';
import Button from './base/button';
import ImageButton from './base/image-button';
import Icon from './base/icon';
import Popup from './base/popup';
import Loading from './base/loading';
import Tabs from './base/tabs';
import Tab from './base/tab';
import Checkbox from './base/checkbox';
import ButtonsBar from './base/buttons-bar';
import Text from './base/text';
import Collapse from './base/collapse';
import Popover from './base/popover';
import Panel from './base/panel';
import SubPanel from './base/sub-panel';
import Tooltip from './base/tooltip';
import DropdownButton from './base/dropdown-button';
import RangeSlider from './base/range-slider';
import DropdownMenus from './base/dropdown-menus';
import DropdownMenu from './base/dropdown-menu';
import Input from './base/input';
import DegreeInput from './base/degree-input';
import DegreeDisk from './base/degree-disk';
import Scroll from './base/scroll';
import EditorColorPanel from './components/editor-color-panel';
import ColorPicker from './components/color-picker';
import ImageSelect from './components/image-select';
import DropdownEffects from './components/dropdown-effects';
import RangePicker from './components/range-picker';
import OpacityRange from './components/opacity-range-picker';
import ThreeColorPicker from './components/three-color-picker';
import DropdownFontFamily from './components/dropdown-font-family';
import ToggleTab from './components/toggle-tab';
import Transparent from './components/transparent';


import Cursor from './base/cursor';
import VLoading from './base/loading/v-loading';
import ImageList from './base/image-list';
import Select from './base/select';

import { $confirm } from './base/confirm-dialog/dialog-task';

const components = {
    'base-container': BaseContainer,
    'header-container': HeaderContainer,
    'aside-container': AsideContainer,
    'aside-button': AsideButton,
    'collapse-container': CollapseContainer,
    'circle-progress': CircleProgress,
    'main-container': MainContainer,
    'panel-container': PanelContainer,
    'button': Button,
    'icon': Icon,
    'buttons-bar': ButtonsBar,
    'checkbox': Checkbox,
    'tooltip': Tooltip,
    'text': Text,
    'collapse': Collapse,
    'popup': Popup,
    'loading': Loading,
    'tabs': Tabs,
    'tab': Tab,
    'popover': Popover,
    'image-button': ImageButton,
    'panel': Panel,
    'sub-panel': SubPanel,
    'dropdown-button': DropdownButton,
    'range-slider': RangeSlider,
    'editor-color-panel': EditorColorPanel,
    'image-select': ImageSelect,
    'color-picker': ColorPicker,
    'image-list': ImageList,
    'select': Select,
    'dropdown-menus': DropdownMenus,
    'dropdown-menu': DropdownMenu,
    'input': Input,
    'degree-input': DegreeInput,
    'degree-disk': DegreeDisk,
    'dropdown-effects': DropdownEffects,
    'range-picker': RangePicker,
    'opacity-range': OpacityRange,
    'three-color-picker': ThreeColorPicker,
    'dropdown-font-family': DropdownFontFamily,
    'scroll': Scroll,
    'toggle-btn': ToggleTab,
    'transparent': Transparent,
};

const directives = {
    'cursor': Cursor,
    'loading': VLoading
};

const command = {
    '$euiConfirm': $confirm
};

function createComponent(name, component, Vue) {
    Vue.component(`eui-v2-${name}`, component);
}

function createDirective(name, directive, Vue) {
    Vue.directive(name, directive);
}

function createCommand(name, fnc, Vue) {
    Vue.prototype[name] = fnc;
}

const EUI = {
    install: function(Vue) {
        Object.getOwnPropertyNames(components).forEach(name => {
            createComponent(name, components[name], Vue);
        });

        Object.getOwnPropertyNames(directives).forEach(name => {
            createDirective(name, directives[name], Vue);
        });

        Object.getOwnPropertyNames(command).forEach(name => {
            createCommand(name, command[name], Vue);
        });
    },
};

export default EUI;
