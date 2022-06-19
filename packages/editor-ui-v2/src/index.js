import './styles/panel-form.less';

import GroupControl from './group-control';
import ImageControl from './image-control';
import PopBase from './pop-base';
import TextControl from './text-control';

import DropdownFontFamily from './components/dropdown-font-family';
import DropdownFontSize from './components/dropdown-font-size';
import DropdownEffects from './components/dropdown-effects';

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
import ImageList from './base/image-list';
import Select from './base/select';
import DropdownMenus from './base/dropdown-menus';
import DropdownMenu from './base/dropdown-menu';
import Input from './base/input';
import DegreeDisk from './base/degree-disk';
import DegreeInput from './base/degree-input';
import FilePicker from './base/file-picker';
import Scroll from './base/scroll';
import EditorColorPanel from './components/editor-color-panel';
import ColorPicker from './components/color-picker';
import ConfigProvider from './base/config-provider';
import ImageSelect from './components/image-select';
import ThreeColorPicker from './components/three-color-picker';
import RangePicker from './components/range-picker';
import OpacityRange from './components/opacity-range-picker';
import StyledRange from './components/styled-range-picker';
import ToggleTab from './components/toggle-tab';
import JustifiedMaterialList from './components/justified-material-list';

import EditorBackground from './editor/editor-background';
import EditorToolBar from './editor/editor-tool-bar';
import EditorElementBar from './editor/editor-element-bar';
import EditorTextControl from './editor/editor-text-control';
import EditorFontSize from './editor/editor-font-size';
import EditorColors from './editor/editor-colors';
import EditorEffects from './editor/editor-effects';
import EditorFontCopyRight from './editor/editor-font-copy-right';
import EditorFontFamily from './editor/editor-font-family';
import EditorGroupControl from './editor/editor-group-control';
import EditorVisualLayout from './editor/editor-visual-layout';
import EditorHint from './editor/editor-hint';
import EditorSlideBar from './editor/editor-slide-bar';
import EditorElementLoading from './editor/editor-element-loading';
import EditorAnglePicker from './editor/editor-angle-picker';
import EditorColorPicker from './editor/editor-color-picker';
import EditorColorOverlay from './editor/editor-color-overlay';
import { i18n } from './i18n';
import './styles/global.less';

import * as utils from './utils';

export { default as EUI2 } from './eui';

export {
    GroupControl,
    ImageControl,
    PopBase,
    RangePicker,
    OpacityRange,
    RangeSlider,
    TextControl,
    DegreeDisk,
    DropdownFontFamily,
    DropdownFontSize,
    DropdownEffects,
    BaseContainer,
    HeaderContainer,
    AsideContainer,
    AsideButton,
    CollapseContainer,
    CircleProgress,
    PanelContainer,
    MainContainer,
    Button,
    ImageButton,
    Icon,
    Popup,
    Loading,
    Tabs,
    Tab,
    Checkbox,
    ButtonsBar,
    Text,
    Collapse,
    Popover,
    Panel,
    SubPanel,
    DropdownButton,
    DropdownMenus,
    DropdownMenu,
    Input,
    DegreeInput,
    FilePicker,
    Scroll,
    Tooltip,
    JustifiedMaterialList,
    EditorColorPanel,
    ColorPicker,
    ConfigProvider,
    ImageSelect,
    ImageList,
    Select,
    ThreeColorPicker,
    ToggleTab,
    EditorBackground,
    EditorToolBar,
    EditorElementBar,
    EditorTextControl,
    EditorFontSize,
    EditorColors,
    EditorEffects,
    EditorFontCopyRight,
    EditorFontFamily,
    EditorGroupControl,
    EditorVisualLayout,
    EditorHint,
    EditorSlideBar,
    EditorElementLoading,
    EditorAnglePicker,
    EditorColorPicker,
    utils,
    EditorColorOverlay,
    StyledRange,
};

export function changeLanguage(lang) {
    i18n.changeLanguage(lang);
}
