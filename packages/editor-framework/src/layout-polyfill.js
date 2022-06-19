// 对外部使用默认 EditorLayout 的兼容支持
import Common from './static/common';
import Watermark from './static/watermark';
import Background from './static/background';
import GlobalBackground from './static/global-background';
import BackgroundMask from './static/background-mask';
import BackgroundMosaic from './static/background-mosaic';
import BackgroundMosaicPathElement from './static/background-mosaic/path-element';
import Border from './static/border';
import EditorLayout from './containers/editor-layout';
import { createComponent } from './base/loader';
import MaskWrap from './static/mask-wrap';

const getComponentName = (definitions) =>
    Array.isArray(definitions) ? definitions[definitions.length - 1].name : definitions.name || '';

const elementDefinitions = [Common];

const createEditorLayout = (Vue) => {
    EditorLayout.components = elementDefinitions.reduce(
        (obj, def) => ({
            ...obj,
            [getComponentName(def.layoutComponent)]: createComponent(Vue, def.layoutComponent),
        }),
        {
            watermark: createComponent(Vue, Watermark),
            background: createComponent(Vue, Background),
            'global-background': createComponent(Vue, GlobalBackground),
            'background-mask': createComponent(Vue, BackgroundMask),
            'background-mosaic': createComponent(Vue, BackgroundMosaic),
            'background-mosaic-path-element': createComponent(Vue, BackgroundMosaicPathElement),
            border: createComponent(Vue, Border),
            'mask-wrap': createComponent(Vue, MaskWrap),
        },
    );
    return createComponent(Vue, EditorLayout);
};

export default createEditorLayout;
