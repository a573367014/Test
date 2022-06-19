import EditorCanvas from '../containers/editor-canvas';
import EditorMirror from '../containers/editor-mirror';
import EditorFlow from '../containers/editor-flow';
import EditorLayout from '../containers/editor-layout';
import { getEditor, getComponentName } from './editor';
import CommonElement from '../static/common/common-element';
import _createComponent from './create-component';

/* 未包含下列组件
'editor-toolbar-pop': EditorToolbarPop,
'editor-toolbar-more': EditorToolbarMore,
'editor-toolbar-selector': EditorToolbarSelector,
'editor-toolbar-group': EditorToolbarGroup,
'editor-toolbar-image': EditorToolbarImage,
'editor-toolbar-mask': EditorToolbarMask,
'editor-toolbar-text': EditorToolbarText,
'editor-toolbar-svg': EditorToolbarSvg,

'editor-color-picker': EditorColorPicker,
'editor-color-hue': EditorColorHue,
'editor-color-block': EditorColorBlock,
'editor-color-history': EditorColorHistory,
'editor-combo-picker': EditorComboPicker,
'editor-file-picker': EditorFilePicker,
'editor-file-reader': EditorFileReader,
'editor-image-picker': EditorImagePicker,
'editor-number-picker': EditorNumberPicker,
'editor-opacity-picker': EditorOpacityPicker,
'editor-range-picker': EditorRangePicker,
'editor-select-picker': EditorSelectPicker
*/

// 基于注入的 Vue 对象与组件定义，返回 Vue 实例化后的组件。
// definitions 既可能是单个 Vue 组件的 plain object 定义对象，
// 也可能是使用 inherit 方法继承得到的多个 plain object 定义数组。
export function createComponent(Vue, definitions) {
    if (!Array.isArray(definitions)) {
        definitions = [definitions];
    }

    let Component = _createComponent(Vue, definitions);
    if (definitions.some((item) => item.name === 'group-element' || item.name === 'flex-element')) {
        Component = Component.extend({
            components: {
                'common-element': createComponent(Vue, CommonElement),
            },
        });
    }

    return Component;
}

// 基于注入的 Vue 对象与各组件定义，实例化编辑器。
// components 各 value 既可以是单个 Vue 组件的 plain object 定义对象，
// 也可以是使用 inherit 方法继承得到的多个 plain object 定义数组。
// staticComponents 为存放各类 static 组件定义的数组
export const createEditor = (
    Vue,
    elementDefinitions,
    staticComponents,
    models,
    asyncElementsMap,
) => {
    // 维护 EditorLayout 子组件
    EditorLayout.components = elementDefinitions.reduce(
        (obj, def) => ({
            ...obj,
            [getComponentName(def.layoutComponent)]: createComponent(Vue, def.layoutComponent),
        }),
        {
            watermark: createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'watermark'),
            ),
            background: createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'background'),
            ),
            'global-background': createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'global-background'),
            ),
            'background-mask': createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'background-mask'),
            ),
            'background-mosaic': createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'background-mosaic'),
            ),
            'background-mosaic-path-element': createComponent(
                Vue,
                staticComponents.find(
                    (c) => getComponentName(c) === 'background-mosaic-path-element',
                ),
            ),
            border: createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'border'),
            ),
            'mask-wrap': createComponent(
                Vue,
                staticComponents.find((c) => getComponentName(c) === 'mask-wrap'),
            ),
        },
    );

    // FIXME
    // // 维护 EditorContextmenu 子组件
    // EditorContextmenu.components = {
    //     'editor-layer-list': createComponent(Vue, EditorLayerList)
    // };

    const layoutComponent = { 'editor-layout': createComponent(Vue, EditorLayout) };
    // 维护 EditorCanvas / EditorFlow / EditorMirror 子组件
    EditorCanvas.components = layoutComponent;
    EditorFlow.components = layoutComponent;
    EditorMirror.components = layoutComponent;

    // 维护 Editor 内部辅助子组件
    const containerComponents = {
        'editor-canvas': createComponent(Vue, EditorCanvas),
        'editor-mirror': createComponent(Vue, EditorMirror),
        'editor-flow': createComponent(Vue, EditorFlow),
    };

    const Editor = getEditor(Vue, elementDefinitions, models, asyncElementsMap);

    // 维护 Editor 子组件
    Editor.components = {
        ...containerComponents,
        ...staticComponents.reduce(
            (obj, component) => ({
                ...obj,
                [getComponentName(component)]: createComponent(Vue, component),
            }),
            {},
        ),
    };

    return createComponent(Vue, Editor);
};
