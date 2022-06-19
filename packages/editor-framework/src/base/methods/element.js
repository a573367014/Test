/**
 * @class EditorElementMixin
 * @description 编辑器 element 操作相关API
 */

import {
    cloneDeep,
    isArray,
    isFunction,
    merge,
    mergeWith,
    isUndefined,
    forEachRight,
    defaults,
    omit,
} from 'lodash';
import Promise from 'bluebird';

import ElementBaseModel from '../element-base-model';
import editorDefaults from '../editor-defaults';
import { styleMap } from '../../utils/rich-text/config';
import { resizeElements } from '../../utils/resize-element';
import utils from '../../utils/utils';
import { createComponent } from '../loader';
import MosaicPathModel from '../../static/background-mosaic/path-model';
import { isGroup, isSupportEffectElement } from '@gaoding/editor-utils/element';
import { resetPathsBounding } from '../../utils/resize-element';
import deleteUUID from '../../utils/delete-uuid';

import { checkVersion } from '@gaoding/editor-utils/version';
import { setTimeRange, getTimeRange } from '@gaoding/editor-utils/adaptor/time-range';

import { MODIFY_MIN_FONTSIZE_VERSION } from '../../utils/consts';
import { getTextElementVisualRect, getGroupElementVisualRect } from '../../utils/measure';
import { adjustPasteElementPosition } from '../../utils/paste';
import { adaptationEffectShadows } from '../../utils/model-adaptation';
import { parseTransform } from '@gaoding/editor-utils/transform';

const changeElementBefore = (editor, element, props) => {
    const { type } = element;
    let otherProps = null;

    if (/text/i.test(type) && !props.contents) {
        const richTextProps = {};
        otherProps = {};

        // 匹配 contents 有关 props
        Object.keys(props).forEach((name) => {
            if (!styleMap[name] && name !== 'listStyle') {
                otherProps[name] = props[name];
            } else {
                richTextProps[name] = props[name];
            }
        });

        if (Object.keys(richTextProps).length > 0) {
            if (type === 'text' || type === 'effectText') {
                editor.changeTextContents(richTextProps, element, false);
            } else if (type === 'styledText') {
                editor.changeStyledTextContents(richTextProps, element, false);
            } else {
                editor.changeThreeTextContents(richTextProps, element, false);
            }
        }
    } else if (type === 'watermark') {
        editor.changeWatermark(props, element, false);
    }

    props = otherProps || props;

    if (props.transform && !props.transform.localTransform) {
        props.transform = parseTransform(props.transform);
    }

    if (props.imageTransform && !props.imageTransform.localTransform) {
        props.imageTransform = parseTransform(props.imageTransform);
    }

    if (
        props.backgroundEffect?.image?.transform &&
        !props.backgroundEffect.image.transform.localTransform
    ) {
        props.backgroundEffect.image.transform = parseTransform(
            props.backgroundEffect.image.transform,
        );
    }

    if (props.tableData && element.type === 'table') {
        props.$tableData = props.tableData;
        props = omit(props, 'tableData');
    }

    return props;
};

const changeElementAfter = (editor, element, props) => {
    const { type } = element;

    editor.$binding.beforeUpdateEditorModel(element);

    const isImage = type === 'image' || type === 'mask';
    if (isImage && props.url !== undefined) {
        // 修改图片地址，同步关联的其他图片
        if (element.linkId) {
            editor.$events.$emit('element.change', element, 'url');
        }
    }

    if (props.imageEffects || props.textEffects) {
        editor.resetAggregatedColors(element, false);
    }
};

export default (Vue, models, asyncElementsMap) => ({
    _getOperateModeElements(layout) {
        layout = layout || this.currentLayout;
        if (!layout) return [];
        const isMosaic = this.operateMode === 'mosaic';
        return isMosaic ? layout.mosaic.paths : layout.elements;
    },

    /**
     * 动态加载异步组件
     * @memberof EditorElementMixin
     * @param {Object} element 元素
     */
    async createAsyncComponent(data) {
        const { type } = data;
        const definition = await this.getAsyncPackage(type);

        if (!definition) return;
        const { methods, model, layoutComponent, editComponent, service } = definition;

        // 有编辑器态的组件
        if (editComponent) {
            if (['image', 'video', 'mask'].includes(type)) {
                Vue.component('mask-editor', createComponent(Vue, editComponent));
            } else {
                Vue.component(type + '-editor', createComponent(Vue, editComponent));
            }
        }

        models[type] = model;

        if (!this.supportTypesMap[type]) {
            this.supportTypes = this.supportTypes.concat(type);
        }

        if (service) {
            const ServiceCtor = service;
            if (!this.services.cache.has(type)) {
                this.services.cache.set(type, new ServiceCtor(this));
            }
        }

        Object.assign(this, methods);
        return Vue.component(type + '-element', createComponent(Vue, layoutComponent));
    },

    /**
     * 加载异步包
     * @memberof EditorElementMixin
     * @param {*} type 元素类型
     */
    getAsyncPackage(type) {
        if (!this.supportTypes.includes(type) && asyncElementsMap[type]) {
            const promise = isFunction(asyncElementsMap[type])
                ? asyncElementsMap[type]()
                : asyncElementsMap[type];
            return promise.then((bundle) => {
                return bundle.default;
            });
        }
        return null;
    },

    /**
     * 自动异步载入元素
     *
     * @memberof EditorElementMixin
     * @param {Object} templet 模板数据
     */
    autoImportElementByTemplet(templet) {
        return Promise.try(() => {
            const { layouts } = templet;
            // 拿到当前模板里面的所有元素类型
            const allTypes = {
                text: true,
                group: true,
                image: true,
                svg: true,
                flex: true,
                mask: true,
                ninePatch: true,
            };

            utils.walkTemplet(
                (element) => {
                    if (element.type) {
                        allTypes[element.type] = true;
                    }
                },
                true,
                layouts,
            );

            return Object.keys(allTypes);
        }).then((types) => {
            // 需要先加载所有的包，拿到 model 等配置
            return Promise.map(types, (type) => this.createAsyncComponent({ type }));
        });
    },

    /**
     * 新建元素
     * @memberof EditorElementMixin
     * @param {Object} data 元素数据
     * @param {layout} [layout=currentLayout] 添加到 layout 时参考位置参考 layout 大小
     * @return {element} 新建的 element 元素
     */
    createElement(data, layout) {
        let type = data && data.type;

        if (!type) {
            throw new Error('Missing element type, data: ' + JSON.stringify(data));
        }

        // 兼容来自客户端的标签元素
        if (type === 'tag' && data.elements && data.elements.length) {
            type = 'group';
            data.type = 'group';
        }

        // // TODO: PDF 截图暂不支持视频，先按mask元素绘制
        // if(this.mode === 'mirror' && type === 'video') {
        //     data.type = 'mask';
        // }

        if (
            data.type === 'image' &&
            data.url &&
            (data.url.includes('data:image/gif') || /\.gif/i.test(data.url))
        ) {
            data.resourceType = 'gif';
        }

        // if (!this.checkVersion(data.version || '0.0.0')) {
        //     console.warn('Element version not support:' + data.version);
        // }

        if (this.isGroup(data)) {
            // COMPAT 1.x 及之前版本
            data.elements = (data.elements || data.elems || [])
                .filter((item) => item && item.type)
                .map((elem) => {
                    elem = this.createElement(Object.assign({}, elem), layout);
                    elem.disableEditable();
                    return elem;
                });

            delete data.elems;
        }

        if (data.type === 'watermark') {
            // TODO: 为兼容旧版 app 版本
            data.template = data.templateV2 || data.template;
            delete data.templateV2;

            data.template = this.createElement(Object.assign({}, data.template));
        }

        // 特效投影数据兼容
        if (isSupportEffectElement(data)) {
            adaptationEffectShadows(data);
        }

        let ModelClass = models[data.type] || ElementBaseModel;
        if (data.type.includes('mosaic')) {
            ModelClass = MosaicPathModel;
        }

        const element = new ModelClass(data, this.options);

        // 文字最小字号改动需固定版本控制
        if (
            !element.version ||
            element.type !== 'text' ||
            checkVersion(element.version, MODIFY_MIN_FONTSIZE_VERSION)
        ) {
            element.version = editorDefaults.version;
        }

        if (!layout) {
            layout = this.currentLayout;
        }

        // center potision default
        const isMosaicType = data.type.includes('mosaic');
        if (!isMosaicType && layout && isUndefined(data.left)) {
            element.left = Math.max(0, (layout.width - element.width) / 2);
        }
        if (!isMosaicType && layout && isUndefined(data.top)) {
            element.top = Math.max(0, (layout.height - element.height) / 2);
        }

        // 文本
        if (
            (!this.options.collabOptions?.enable ||
                !this.options.collabOptions?.fontFallBackHook) &&
            (type === 'table' || /text/i.test(type))
        ) {
            const { fontsMap, fontList, defaultFont } = this.options;
            const setDefaultFont = (item) => {
                if (!fontsMap[item.fontFamily]) {
                    item.fontFamily = (fontsMap[defaultFont] || fontList[0]).name;
                }
            };

            setDefaultFont(element);
            element.contents && element.contents.forEach(setDefaultFont);
        }

        if (this.isGroup(element)) {
            element.elements.forEach((el) => {
                el.$parentId = element.uuid;
            });
        }

        if (type === 'watermark') {
            element.template.$parentId = element.uuid;
        }

        return element;
    },

    /**
     * 添加元素到画布
     * @memberof EditorElementMixin
     * @param {Object} data 元素数据
     * @param {layout} [layout=currentLayout] 添加到的 layout
     * @param {boolean} index 插入下标
     * @return {element} 新建的 element 元素
     */
    addElement(data, layout, index) {
        let element = data;
        this.$binding.beforeUpdateEditorModel(element);

        if (!data || !data.$id || !data.uuid) {
            try {
                element = this.createElement(data, layout);
            } catch (err) {
                // 对 type 缺失元素降级至空，可由 setTemplet 等调用方过滤后降级展示
                return null;
            }
        }

        if (!layout) {
            layout = this.currentLayout;
        }

        const layoutElements = !element.type.includes('mosaic')
            ? layout.elements
            : this._getOperateModeElements(layout);

        if (layout && layoutElements) {
            if (!Number.isInteger(index)) {
                index = layoutElements.length;
                layoutElements.push(element);
            } else {
                layoutElements.splice(index, 0, element);
            }

            // history
            const action = {
                tag: 'add_element',
                element,
                parent: layout,
            };

            this.makeSnapshot(action, layout);
        }

        element.$parentId = layout.uuid;
        if (this.isGroup(element)) {
            element.elements.forEach((el) => {
                el.$parentId = element.uuid;
            });
        }

        return element;
    },

    /**
     * 移除元素
     * @memberof EditorElementMixin
     * @param {element|Arrary.<element>} [elements=currentElement|selectedElements] 被移除元素或元素数组
     * @param {layout} [layout=currentLayout] 要被移除元素的 layout
     */
    removeElement(elements, layout) {
        if (!layout) {
            layout = this.currentLayout;
        }
        if (!layout) {
            return;
        }

        // current element
        const currElement = this.currentElement;

        if (!elements) {
            elements = this.getSelectedElements(true);
        } else if (!Array.isArray(elements)) {
            elements = [elements];
        }

        if (!elements.length) {
            return;
        }

        const layoutElements = this._getOperateModeElements(layout);
        elements = elements.filter((element) => {
            const index = layoutElements.indexOf(element);
            if (index > -1) {
                layoutElements.splice(index, 1);
            }

            this.removeDataBinding(element);

            if (element.linkId) {
                const linkedElements = this.getLinkedElements(element);
                if (linkedElements.length <= 1) {
                    linkedElements.forEach((element) => {
                        element.linkId = '';
                    });
                }
            }
            return index > -1;
        });

        this.lazyUpdatePicker();
        // focus
        if (elements.indexOf(currElement) > -1) {
            this.focusElement(null);
        }

        this.$events.$emit('element.remove', elements);

        const action = { tag: 'remove_element', elements };
        this.makeSnapshot(action);

        return elements;
    },

    /**
     * 替换元素
     * @memberof EditorElementMixin
     * @param {element} oldElement 被替换元素
     * @param {element} newElement 新元素
     * @param {layout} layout 元素所在的 layout
     * @return {element} 新元素
     */
    replaceElement(oldElement, newElement, layout) {
        oldElement = this.getElement(oldElement);

        delete newElement.uuid;
        delete newElement.$id;
        newElement = this.createElement(newElement);

        if (!layout) {
            layout =
                this.layouts.find((layout) => layout.uuid === oldElement.$parentId) ||
                this.currentLayout;
        }

        const elementParent = layout.elements.includes(oldElement)
            ? layout
            : this.getParentGroups(oldElement).pop();

        if (!elementParent) {
            return null;
        }

        const index = elementParent.elements.indexOf(oldElement);
        newElement.uuid = oldElement.uuid;
        newElement.$parentId = oldElement.$parentId;
        if (newElement.elements) {
            newElement.elements.forEach((subElement) => {
                subElement.$parentId = newElement.uuid;
            });
        }

        if (oldElement.$tempGroupId) {
            newElement.$cacheParentId = oldElement.$cacheParentId;
            newElement.$tempGroupId = oldElement.$tempGroupId;
        }

        const elements = this.getLinkedElements(oldElement);
        this.makeSnapshotTransact(() => {
            if (elements.length <= 1) {
                elements.forEach((element) => {
                    element.linkId = '';
                    this.makeSnapshotByElement(element);
                });
            }

            this.removeElement(oldElement, elementParent);
            this.addElement(newElement, elementParent, index);
        });

        return newElement;
    },

    /**
     * 修改元素 element 的属性
     * @memberof EditorElementMixin
     * @param {object} props 多个属性对象
     * @param {element | Arrary.<element>} elements 元素或元素数组
     */
    changeElement(props, elements) {
        elements = elements ? [].concat(elements) : [this.currentElement];

        if (elements[0] === null) {
            return;
        }

        elements.forEach((element) => {
            const _props = changeElementBefore(this, element, props);

            mergeWith(element, _props || props, (curValue, props) => {
                if (isArray(curValue)) {
                    const copy = curValue.slice();
                    return merge(copy, props);
                }
            });

            changeElementAfter(this, element, props);
        });

        this.options?.changeMetaInfoHook({
            elements,
            props,
            type: 'change',
        });

        // history
        const action = { tag: 'change_element', elements, props };
        this.makeSnapshot(action);
    },

    shallowChangeElement(props, elements) {
        elements = elements ? [].concat(elements) : [this.currentElement];

        if (elements[0] === null) {
            return;
        }

        elements.forEach((element) => {
            const _props = changeElementBefore(this, element, props);
            Object.assign(element, _props || props);
            changeElementAfter(this, element, props);
        });

        this.options?.changeMetaInfoHook({
            elements,
            props,
            type: 'change',
        });

        // history
        const action = { tag: 'change_element', elements, props };
        this.makeSnapshot(action);
    },

    /**
     * 拷贝元素
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>}  elements 被拷贝的元素
     * @param {Boolean} toClipboard 是否保存到编辑器剪贴板中，可用于编辑器粘贴
     * @return {element | Arrary.<element>} 新元素
     */
    copyElement(elements, toClipboard = true) {
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);

        elements = elements.filter((element) => {
            return element.type.indexOf('$') !== 0;
        });

        if (elements.length) {
            // elements = elements.map(this.createElement);
            elements = elements.map((elem) => {
                const _elem = { ...elem };
                return this.createElement(_elem);
            });
            this.options.clipboard.set(elements);

            if (toClipboard) {
                this.clipboard = elements;
            }
        }

        return elements;
    },

    /**
     * 剪切元素
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>} elements 被剪切的元素
     * @param {Boolean} toClipboard 是否保存到编辑器的剪贴板中，为 `false` 则相当于 removeElment
     * @return {element | Arrary.<element>} 被剪切的元素
     */
    cutElement(elements, toClipboard = true) {
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);

        if (elements.length) {
            this.removeElement(elements, null, true);

            elements = elements.filter((element) => {
                return element.type.indexOf('$') !== 0;
            });
            this.copyElement(elements, toClipboard);
        }
        return elements;
    },

    /**
     * 粘贴元素到 `layout`
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>} [elements=clipboard] 被粘贴的元素，默认为编辑器剪贴板中 element
     * @param {layout} [layout=currentLayout] 粘贴目标 layout
     * @return {Arrary.<element>} 粘贴创建的新元素
     */
    pasteElement(elements, layout, options) {
        elements = elements || this.clipboard;

        layout = layout || this.currentLayout;
        const { noOffset, getArguments = [] } = options || {};

        const hookClipboard = this.options.clipboard;
        const outerContent = hookClipboard.get(...getArguments);

        if (outerContent) {
            elements = outerContent.map(this.createElement);
        }

        deleteUUID(elements);

        // 非马赛克操作模式，禁止粘贴马赛克
        elements = elements.filter((el) => {
            if (!el || !el.type) return false;
            return !(this.operateMode !== 'mosaic' && el.type.includes('mosaic'));
        });

        if (elements.length) {
            this.clearSelectedElements();

            const linkMap = {};
            elements = elements.map((element) => {
                element.$selected = false; // reset $selected

                element = this.createElement(element.clone());

                if (!noOffset) {
                    adjustPasteElementPosition(element, layout);
                }

                // 元素默认不 lock
                element.lock = false;
                const newElement = this.addElement(element, layout);

                const linkId = newElement.linkId;
                if (linkId) {
                    if (!linkMap[linkId]) {
                        linkMap[linkId] = [];
                    }
                    linkMap[linkId].push(newElement);
                }
                return newElement;
            });

            // 在粘贴时检查当前 layout 是否有与粘贴元素相链接的元素，如果没有则将 linked ID 置空或产生新的 linked ID
            // 在复制时防止元素跨 layout 产生链接
            Object.keys(linkMap).forEach((linkId) => {
                const elements = linkMap[linkId];
                if (this.getLinkedElements(elements[0], layout).length <= elements.length) {
                    // 画布中不存在跟粘贴元素关联的元素
                    const newLinkId = elements.length > 1 ? utils.uuid() : '';
                    elements.forEach((element) => {
                        element.linkId = newLinkId;
                    });
                }
            });

            // focus
            this.focusElement(elements.length === 1 ? elements[0] : null);

            // event
            this.$events.$emit('base.paste', elements);

            // history
            this.makeSnapshot({ tag: 'change_element', elements });

            return elements;
        }
    },

    /**
     * 克隆元素，先发生 copyElement 再发生 pasteElement
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>} [elements=selectedElements] 要克隆的元素
     * @return {element | Arrary.<element>} 克隆出来的元素
     */
    cloneElement(elements) {
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);

        elements = elements.filter((element) => {
            return element.type.indexOf('$') !== 0;
        });

        elements = this.copyElement(elements, false);
        return this.pasteElement(elements);
    },

    /**
     * 锁定元素，内部使用{@link EditorElementMixin.changeElement|changeElement}
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>} elements 锁定的元素
     */
    lockElement(elements) {
        this.changeElement(
            {
                lock: true,
            },
            elements,
        );
    },

    /**
     * 解锁元素，内部使用{@link EditorElementMixin.changeElement|changeElement}
     * @memberof EditorElementMixin
     * @param {element | Arrary.<element>} elements 锁定的元素
     */
    unlockElement(elements) {
        this.changeElement(
            {
                lock: false,
            },
            elements,
        );
    },

    /**
     * 根据编辑器坐标 `Point(x, y)` 返回在该坐标下的所有元素
     * @memberof EditorElementMixin
     * @param {Number} x 编辑器内 x 轴坐标
     * @param {Number} y 编辑器内 y 轴坐标
     * @param {Layout} [layout=currentLayout] 点所在的 layout
     * @return {Arrary.<element>} 坐标下元素集合
     */
    getElementsByPoint(x = 0, y = 0, layout = this.currentLayout) {
        const retElems = [];
        const options = this.options;
        const allElems = this._getOperateModeElements(layout);

        // 忽略已锁定或者不可见的元素 和 frozon 冻结元素
        const elems = allElems.filter((elem) => {
            return !elem.hidden && !elem.frozen;
        });

        if (!elems || !elems.length) {
            return retElems;
        }

        // Fix layout offset
        x -= layout.left || 0;
        y -= layout.top || 0;

        // 忽略容器外的元素
        if (
            options.canvasOverflowHidden &&
            (x < 0 || y < 0 || x > layout.width || y > layout.height)
        ) {
            return retElems;
        }

        forEachRight(elems, (elem) => {
            const elementRect = null;

            const rect = utils.getElementRect(elementRect || elem, 1);

            // rect.width += rect.padding[1] + rect.padding[3];
            // rect.height += rect.padding[0] + rect.padding[2];

            if (utils.pointInRect(x, y, rect)) {
                retElems.push(elem);
            }
        });

        return retElems;
    },

    /**
     * 根据编辑器坐标 `Point(x, y)` 返回在该坐标下的第一个元素
     * @memberof EditorElementMixin
     * @param {Number} x 编辑器内 x 轴坐标
     * @param {Number} y 编辑器内 y 轴坐标
     * @param {Layout} [layout=currentLayout] 点所在的 layout
     * @return {Element | Null} 坐标下元素
     */
    getElementByPoint(x = 0, y = 0, layout = this.currentLayout) {
        const elems = this.getElementsByPoint(x, y, layout);
        return elems[0] || null;
    },

    /**
     * [Deprecated] 根据编辑器坐标 `Point(x, y)` 返回在该坐标下的所有元素
     * @memberof EditorElementMixin
     * @deprecated 采用 getElementsByPoint / elementFromPoint 代替
     * @param {Number} x 编辑器内 x 轴坐标
     * @param {Number} y 编辑器内 y 轴坐标
     * @param {Layout} [layout=currentLayout] 点所在的 layout
     * @param {Boolean} [returnAll=false] 是否返回所有元素，默认第一个
     * @return {Element | Arrary.<element>} 坐标下元素
     */
    elementFromPoint(x = 0, y = 0, layout = this.currentLayout, returnAll = false) {
        const elems = this.getElementsByPoint(x, y, layout);

        if (returnAll) {
            return elems;
        }

        return elems[0] || null;
    },

    /**
     * 设置元素当前时间
     * @memberof EditorElementMixin
     * @param {number} time
     * @param {element} element
     */
    seek(time, element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }
        if (typeof element.$currentTime === 'number') {
            element.$currentTime = time;
        }
    },

    /**
     * 设置元素的时间信息
     * @memberof EditorElementMixin
     * @param { number } delay
     * @param { number } duration
     * @param { element } element
     */
    setTimeRange(delay, duration, element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }
        setTimeRange(delay, duration, element);
    },

    /**
     * 获取元素的时间信息
     * @param { element } element
     */
    getTimeRange(element) {
        element = this.getElement(element);
        return getTimeRange(element);
    },

    /**
     * 设置{@link EditorElementMixin.currentLayout|currentLayout}
     * @memberof EditorElementMixin
     * @param {element} element
     */
    focusElement(element) {
        element = this.getElement(element, {
            queryCurrntElement: false,
        });

        if (element && element.type.includes('$')) {
            this.currentElement = element;
            return;
        }

        const elementParent = this.getParentGroups(element)[0];

        if (this.isGroup(elementParent)) {
            this.currentElement = elementParent;
            this.currentSubElement = element;
            return;
        }

        // 此处对 $selector 等元素无法找到其 elementParent，但仍需更新 currentElement
        if (element !== this.currentElement) {
            this.currentElement = element;
        }
    },

    /**
     * 根据给定编辑器内位置坐标设置 currentElement
     * @memberof EditorElementMixin
     * @param {Number} x 编辑器内 x 轴坐标
     * @param {Number} y 编辑器内 y 轴坐标
     * @param  {layout} [layout=currentLayout] 指定的 layout
     * @return {element} 返回 currentElement
     */
    focusElementByPoint(x, y, layout) {
        let element;

        this.$binding.config.acceptElementAction = false;

        // 点击测试回退
        if (!this.currentLayout) {
            this.$binding.config.acceptElementAction = true;
            return null;
        }

        if (!this.currentLayout.$loaded || this.mode !== 'design') {
            element = this.elementFromPoint(x, y, layout);
        } else {
            const layer = this.$picker.pick(x, y);
            if (!layer) {
                this.$binding.config.acceptElementAction = true;
                return;
            }
            element = layer.$element;
        }

        if (!element || element.frozen) {
            this.$binding.config.acceptElementAction = true;
            return null;
        }
        if (element !== this.currentElement) {
            this.currentElement = element;
        }

        if (this.isGroup(element)) {
            if (this.mode === 'flow') {
                layout = layout || this.currentLayout;
                x -= layout.left || 0;
                y -= layout.top || 0;
            }

            const newGroup = cloneDeep(element);
            const fns = [];
            this.walkTemplet(
                (elem, parent) => {
                    if (this.isGroup(elem)) {
                        fns.push(() => {
                            // 将组拷贝成一个伪元素
                            parent.elements.splice(parent.elements.indexOf(elem), 0, {
                                ...elem,
                                type: 'cloneGroup',
                            });
                        });
                    }
                },
                true,
                [newGroup],
            );
            fns.forEach((fn) => fn());

            const newElements = this.collapseGroup(newGroup, true);

            let subElement = this.getElementByPoint(x, y, {
                ...layout,
                left: 0,
                top: 0,
                elements: newElements,
            });

            subElement =
                subElement &&
                this.getElement(subElement.uuid, {
                    deep: true,
                });

            this.currentSubElement = subElement;
        }

        this.$binding.config.acceptElementAction = true;
        return element;
    },

    /**
     * 获取 element 元素
     * @param  {element | elementId} id 元素或元素 id
     * @memberof EditorElementMixin
     * @param {object} [options] 配置项
     * @param {boolean} options.deep 是否深度遍历查找
     * @param {boolean} options.queryCurrntElement=true 返回 currentLayout
     * @param {layout} options.layout 在指定的 layout 内查找元素
     * @param {Array<layout>} options.layouts 在指定的 layouts 内查找元素
     * @return {element} 返回 element
     */
    getElement(id, options) {
        options = defaults(options, {
            queryCurrntElement: true,
            deep: false,
        });

        if (id && options.deep && this.elementsMap && this.elementsMap.get(id)) {
            return this.elementsMap.get(id);
        }

        if (id === undefined && options.queryCurrntElement) {
            return this.currentElement;
        }
        if (!id) {
            return null;
        }

        // id is an element
        if (id && id.$id) {
            return id;
        }

        // by id
        let ret = null;
        const layouts = [].concat(options.layouts || options.layout || this.currentLayout);

        this.walkTemplet(
            (element) => {
                if (element.$id === id || element.uuid === id) {
                    ret = element;
                    return false;
                }
            },
            options.deep,
            layouts,
        );

        return ret;
    },

    /**
     * 返回所有被 selected 选中的元素
     * @memberof EditorElementMixin
     * @param {boolean} [withCurrentElement] 返回是否包括 currentElement
     * @return {Array.<element>} element 数组
     */
    getSelectedElements(withCurrentElement) {
        const layout = this.currentLayout;
        let elements = this._getOperateModeElements(layout);

        elements = elements.filter((element) => {
            return element.$selected;
        });

        // current element
        const currElement = this.currentElement;
        if (
            currElement &&
            withCurrentElement &&
            // currElement.type.charAt(0) !== '$' &&
            elements.indexOf(currElement) < 0
        ) {
            elements.push(currElement);
        }

        return elements;
    },

    /**
     * 清空被 selected 的元素
     * @memberof EditorElementMixin
     */
    clearSelectedElements() {
        const selectedElements = this.selectedElements;

        if (selectedElements.length) {
            selectedElements.forEach((element) => {
                element.$selected = false;
            });
        }
    },

    /**
     * 框选中元素
     * @memberof EditorElementMixin
     * @param {element} [element=currentElment] 被框选的元素
     */
    selectElement(element) {
        element = this.getElement(element);

        if (!element) {
            return;
        }

        this.selector.add(element);
        this.selector.showSelector();
    },

    /**
     * 批量框选中元素
     * @memberof EditorElementMixin
     * @param {elements} elements 被框选的元素集合
     */
    selectElements(elements = []) {
        elements = [].concat(elements);

        if (!elements) {
            return;
        }

        elements.forEach((element) => {
            this.selector.add(element);
        });
        this.selector.showSelector();
    },

    /**
     * 取消指定元素框选
     * @memberof EditorElementMixin
     * @param {element} [element=currentElment] 要取消框选的元素
     */
    unselectElement(element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        this.selector.remove(element);
        this.selector.showSelector();
    },

    /**
     * 对齐元素
     * @memberof EditorElementMixin
     * @param  {String} direction 对齐方式
     * <br/> 顶对齐: alignmentTop
     * <br/> 垂直居中对齐: alignmentMiddle
     * <br/> 底对齐: alignmentBottom
     * <br/> 左对齐: alignmentLeft
     * <br/> 水平居中对齐: alignmentCenter
     * <br/> 右对齐: alignmentRight
     * <br/> 顶分布: distributionTop
     * <br/> 垂直居中分布: distributionMiddle
     * <br/> 底分布: distributionBottom
     * <br/> 左分布: distributionLeft
     * <br/> 水平居中分布: distributionCenter
     * <br/> 右分布: distributionRight
     * @param  {Arrary.<element>} [elements=selectedElements] 要对齐的元素
     */
    alignmentElements(direction, elements = this.selectedElements) {
        // Execute alignment
        utils.alignment(direction, elements);

        // Reset selector rect
        this.selector.showSelector();
        this.makeSnapshot({ tag: 'change_element', elements });
    },

    /**
     * 修改元素层级
     * @memberof EditorElementMixin
     * @param  {element | Array} elements 元素或元素数组
     * @param  {Number} step 层级变化
     */
    goElementIndex(elements, step) {
        const layout = this.currentLayout;
        if (!layout) {
            return;
        }

        const allElements = (layout && layout.elements) || [];
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);

        let inx = null;

        elements = elements.filter((element) => {
            if (element && element.type.indexOf('$') < 0) {
                inx = allElements.indexOf(element);
                if (inx >= 0 && inx <= allElements.length - 1) {
                    allElements.splice(inx, 1);
                    inx += step;
                    inx = Math.max(0, inx);
                    inx = Math.min(inx, allElements.length);
                    return true;
                }
            }

            return false;
        });

        allElements.splice(inx, 0, ...elements);
        this.makeSnapshot({
            tag: 'reorder_element',
            index: inx,
            elements,
            parent: layout,
        });
    },

    /**
     * 元素置顶
     * @memberof EditorElementMixin
     * @param {elements | Array} elements 元素
     */
    setElementToTop(elements) {
        this.goElementIndex(elements, this.currentLayout.elements.length);
    },

    /**
     * 元素置底
     * @memberof EditorElementMixin
     * @param {elements | Array} elements 元素
     */
    setElementToBottom(elements) {
        this.goElementIndex(elements, -this.currentLayout.elements.length);
    },

    /**
     * 前置一层
     * @memberof EditorElementMixin
     * @param {elements | Array} elements 元素
     */
    forwardElement(elements) {
        this.goElementIndex(elements, 1);
    },

    /**
     * 后置一层
     * @memberof EditorElementMixin
     * @param {elements | Array} elements 元素
     */
    backwardElement(elements) {
        this.goElementIndex(elements, -1);
    },

    getPointsByElement(element, zoom = 0) {
        element = element || this.currentElement;

        return utils.getPointsByElement(element, zoom || this.zoom);
    },

    /**
     * 翻转元素
     * @memberof EditorElementMixin
     * @param {String} dir 翻转方向，'x' 为水平翻转、'y' 为垂直翻转
     * @param {element} element 被翻转的元素
     */
    flipElement(dir, element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const props = {};
        const name = dir === 'x' ? 'scaleX' : 'scaleY';

        props[name] = -element[name];

        this.changeElement(props, element);
    },

    /**
     * 获取与某元素重叠的元素列表
     * @memberof EditorElementMixin
     * @param {element} element 待检测的元素
     * @returns {elements} 与该元素重叠的元素
     */
    getOverlapElements(element) {
        if (!element) {
            element = this.currentElement;
        }

        const resultElements = [];
        this.currentLayout.elements.forEach((layoutElement) => {
            if (utils.getRectIntersection(element, layoutElement)) {
                resultElements.push(layoutElement);
            }
        });
        return resultElements;
    },

    /**
     * 开启元素闪烁提示
     * @memberof EditorElementMixin
     * @param {element} element - 要修改的元素
     */
    showElementBlink(element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }
        element.$blinking = true;
    },

    /**
     * 关闭元素闪烁提示
     * @memberof EditorElementMixin
     * @param {element} element 要修改的元素
     */
    hideElementBlink(element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }
        element.$blinking = false;
    },

    /**
     * 进入元素编辑状态，元素类型为
     * {@link module:EditorDefaults.textElement|textElement}
     * {@link module:EditorDefaults.imageElement|imageElement}
     * {@link module:EditorDefaults.maskElement|maskElement}
     * @memberof EditorElementMixin
     * @param {element} element 要进入编辑状态的元素
     */
    showElementEditor(element) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const type = element.type;
        if (
            ['text', 'styledText', 'threeText', 'effectText'].includes(type) &&
            element.editable &&
            !element.lock
        ) {
            this.showTextEditor(element);
        } else if (type === 'image') {
            this.showImageCroper(element);
        } else if (type === 'video') {
            this.showVideoCroper(element);
        } else if (type === 'mask') {
            this.showMaskEditor(element);
        }
    },

    /**
     * 同比缩放元素
     * @memberof EditorElementMixin
     * @param {elements | Array} elements 元素
     * @param {number} ratio 缩放比例
     */
    resizeElements(elements, ratio, options) {
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);
        return resizeElements(elements, ratio, options);
    },

    /**
     * 获取模板中使用的字体数据
     * @memberof EditorElementMixin
     * @param {Array.<layout>} layouts - 多个layout
     * @return {Array} fontsList字体对象
     */
    getUsedFontList(layouts) {
        layouts = layouts || this.layouts;
        const fontsMap = {};
        const fontElements = [];

        this.walkTemplet(
            (element) => {
                if (element.getFontFamilies || element.fontFamily) {
                    fontElements.push(element);
                }
            },
            true,
            layouts,
        );

        fontElements.forEach((element) => {
            let { contents, fontFamily } = element;
            if (element.getFontFamilies) {
                const families = element.getFontFamilies();
                contents = families.map((fontFamily) => ({ fontFamily, content: '1' }));
            }
            const defaultContets = [{ fontFamily, content: '1' }];

            (contents || defaultContets).forEach((item) => {
                const font =
                    this.options.fontsMap[item.fontFamily] ||
                    this.options.fontsMap[fontFamily] ||
                    this.options.defaultFont;
                const rBreakLine = /<br>|\r|\n/g;

                if (!font || (item.content && !item.content.replace(rBreakLine, ''))) return;
                const family = font.name || font.family;

                if (!fontsMap[family]) {
                    fontsMap[family] = font;
                }
            });
        });

        return Object.keys(fontsMap).map((k) => fontsMap[k]);
    },

    /**
     * 判断多个元素的链接类型
     * @memberof EditorElementMixin
     * @param { Array<element> } elements 多个 elements
     * @returns { { types: Array<string>, propName: string } } 链接类型，无法组成链接则返回 []
     */
    getLinkElementsType(elements) {
        elements = elements ? [].concat(elements) : this.getSelectedElements();
        if (elements.length < 2) {
            return null;
        }

        const standardElement = elements[0];
        const linkType = this.options.supportLinkElements.find((supportType) => {
            return supportType.types.includes(standardElement.type);
        });

        if (!linkType || elements.some((element) => !linkType.types.includes(element.type))) {
            return null;
        }

        return linkType;
    },

    /**
     * 链接元素
     * @memberof EditorElementMixin
     * @param { Array<element> } [elements] 多个 element
     */
    linkElements(elements) {
        elements = elements ? [].concat(elements) : this.getSelectedElements();

        const linkType = this.getLinkElementsType(elements);
        if (!linkType) {
            return;
        }
        const sortedElements = elements.sort((a, b) => a.$weight - b.$weight);
        const standardElement = sortedElements[0];
        const linkId = standardElement.linkId || utils.uuid();
        standardElement.linkId = linkId;
        sortedElements.forEach((element) => {
            if (element !== standardElement) {
                this.getLinkedElements(element).forEach((element) => {
                    element.linkId = linkId;
                });
                element.linkId = linkId;
            }
        });
        this.$events.$emit('element.change', standardElement, linkType.propName);

        const action = { tag: 'change_element', elements };
        this.makeSnapshot(action);
    },

    /**
     * 解除元素链接
     * @memberof EditorElementMixin
     * @param { Array<element> } [elements] 多个 element
     */
    unlinkElements(elements) {
        elements = elements ? [].concat(elements) : this.getSelectedElements(true);
        const linkIds = {};
        elements.forEach((element) => {
            const { linkId } = element;
            element.linkId = '';
            if (linkId && !linkIds[linkId]) {
                linkIds[linkId] = {
                    selected: false,
                    list: [],
                };
            }
        });

        // 解除链接之后需要检查画布中与其链接的元素是否还可以维持链接状态与链接选中状态
        this.walkTemplet((element) => {
            const map = linkIds[element.linkId];
            if (map) {
                map.selected = map.selected || element.$selected;
                map.list.push(element);
            }
        }, true);

        Object.keys(linkIds).forEach((linkId) => {
            const map = linkIds[linkId];
            if (map.list.length <= 1) {
                map.list.forEach((element) => {
                    element.linkId = '';
                });
            }
        });

        const action = { tag: 'change_element', elements };
        this.makeSnapshot(action);
    },

    /**
     * 获取与元素链接的元素（包括其自身）
     * @memberof EditorElementMixin
     * @param { element } element
     * @param { Array<layout> } layouts 多个 layout
     * @returns { Array<element> } 链接的其他元素
     */
    getLinkedElements(element, layouts) {
        layouts = layouts ? [].concat(layouts) : this.layouts;
        element = element || this.currentSubElement || this.currentElement;

        const linkId = element.linkId;
        if (!linkId) {
            return [];
        }

        const elements = [];
        this.walkTemplet(
            (element) => {
                if (element.linkId === linkId) {
                    elements.push(element);
                }
            },
            true,
            layouts,
        );
        return elements;
    },

    /**
     * 获取上层嵌套组的集合
     * @memberof EditorElementMixin
     * @param {element} elements - 任意元素
     * @param {layout} [layout=currentLayout] 限制在 layout 里查找
     */
    getParentGroups(element, layout) {
        const groups = [];
        element = this.getElement(element, {
            deep: true,
            layout,
        });

        while (element && element.$parentId) {
            element = this.getElement(element.$parentId, {
                deep: true,
                layout,
            });

            element && groups.push(element);
        }

        return groups.reverse();
    },

    /**
     * 获取元素的父级 layout
     * @memberof EditorElementMixin
     * @param {element} elements - 任意元素
     */
    getParentLayout(element) {
        for (const layout of this.layouts) {
            if (layout.uuid === element.$parentId) {
                return layout;
            }
        }
        return null;
    },

    /**
     * 判断元素是否是一个组合元素
     * @memberof EditorElementMixin
     * @param { element } element - 元素
     */
    isGroup(element) {
        return isGroup(element);
    },

    /**
     * 在中心位置不动、路径不被裁切的前提下，使画笔元素边界重置
     * @memberof EditorElementMixin
     * @param {element} brushElement - 画笔元素
     */
    resetBrushBounding(brushElement) {
        const element = this.getElement(brushElement);
        if (!['brush', 'mosaicBrush'].includes(element.type)) return;

        resetPathsBounding(element, true);
    },

    /**
     * 获取元素视觉框
     * @memberof EditorElementMixin
     * @param {element} element - 元素
     */
    getVisualRect(element) {
        let rect = { width: 0, height: 0, left: 0, top: 0 };
        if (!element) return rect;

        if (isGroup(element)) {
            const rects = [];
            /* 深度遍历组元素下的组成 */
            this.walkTemplet(
                (_element) => {
                    const rect = this.getVisualRect(_element);
                    rects.push(rect);
                },
                false,
                [element],
            );
            rect = getGroupElementVisualRect(rects);
            /* 相较于父容器的offset，所以需要加上父容器的 offset，得到相对画布原点的 offset */
            rect.left = rect.left + element.left;
            rect.top = rect.top + element.top;
            return rect;
        }

        if (element.type === 'text') {
            rect = getTextElementVisualRect(this, element);
            /* 相较于父容器的offset，所以需要加上父容器的 offset，得到相对画布原点的 offset */
            rect.left = rect.left + element.left;
            rect.top = rect.top + element.top;
            return rect;
        }

        /* 默认没有做任何处理，返回框信息 */
        rect.width = element.width;
        rect.height = element.height;
        rect.left = element.left;
        rect.top = element.top;
        return rect;
    },
});
