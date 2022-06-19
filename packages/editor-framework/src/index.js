/**
 * Vue Poster Editor
 * @author xiaomi
 * Copyright (c) Gaoding Inc.
 * All rights reserved.
 */
import Promise from 'bluebird';
import { createEditor, createComponent } from './base/loader';
import createEditorLayout from './layout-polyfill';
// 用于扩展可编辑元素的基础组件
import _BaseElement from './base/base-element';

// 默认静态组件定义
import Common from './static/common';
import Contextmenu from './static/contextmenu';
import Guider from './static/guider';
import ResizeGuider from './static/resize-guider';
import CutGrid from './static/guider/cut-grid';
import Selector from './static/selector';
import Transform from './static/transform';
import ImageTransform from './static/transform/image-transform';
import Highlight from './static/highlight';
import Toolbar from './static/toolbar';
import Watermark from './static/watermark';
import Hover from './static/hover';
import Tips from './static/tips';
import Background from './static/background';
import GlobalBackground from './static/global-background';
import BackgroundEditor from './static/background-editor';
import BackgroundMask from './static/background-mask';
import BackgroundMosaic from './static/background-mosaic';
import BackgroundMosaicPathElement from './static/background-mosaic/path-element';
import BleedingLine from './static/bleeding-line';
import Border from './static/border';
import TempGroup from './static/temp-group';
import VideoController from './static/video-controller';
import MaskWrap from './static/mask-wrap';
import './styles/index.less';
import { i18n } from './i18n';

const elementDefinitions = [Common];
const staticComponents = [
    CutGrid,
    Guider,
    ResizeGuider,
    Selector,
    Transform,
    ImageTransform,
    Highlight,
    Contextmenu,
    Toolbar,
    Hover,
    Watermark,
    Background,
    GlobalBackground,
    BackgroundEditor,
    BackgroundMask,
    BackgroundMosaic,
    BackgroundMosaicPathElement,
    Tips,
    BleedingLine,
    Border,
    TempGroup,
    VideoController,
    MaskWrap,
];

// config
// 生产环境去掉警告
Promise.config({
    warnings: process.env.__DEV__,
});

export const BaseElement = _BaseElement;
export { BaseService } from './base/service';

export class Framework {
    // 编辑器实例
    editor = null;

    // 开箱即用的可编辑元素配置包
    elementDefinitions = elementDefinitions;

    // 开箱即用的静态组件配置包
    staticComponents = staticComponents;

    // 异步加载元素
    asyncElementsMap = {};

    /**
     * 编辑器所有 model 构造
     *
     * @memberof Framework
     */
    models = {};

    /**
     * 创建编辑器 vue 组件构造器
     *
     * @param {*} Vue
     * @returns
     * @memberof Framework
     */
    createEditor(Vue) {
        return createEditor(
            Vue,
            this.elementDefinitions,
            this.staticComponents,
            this.models,
            this.asyncElementsMap,
        );
    }

    /**
     * 添加异步包
     *
     * @param {*} type
     * @param {*} promise
     * @memberof Framework
     */
    addAsyncDefinition(type, promise) {
        this.asyncElementsMap[type] = promise;
    }

    /**
     * 添加元素包配置
     *
     * @param {*} elementDefinition
     * @memberof Framework
     */
    addDefinition(elementDefinition) {
        this.elementDefinitions.push(elementDefinition);
    }

    /**
     * 创建编辑器 layout 组件构造器
     *
     * @param {*} Vue
     * @returns
     * @memberof Framework
     */
    createLayout(Vue) {
        return createEditorLayout(Vue);
    }

    /**
     * 创建组件构造器
     *
     * @param {*} Vue
     * @param {*} definitions
     * @returns
     * @memberof Framework
     */
    createComponent(Vue, definitions) {
        return createComponent(Vue, definitions);
    }
}

export function changeLanguage(lang) {
    i18n.changeLanguage(lang);
}

export default Framework;
