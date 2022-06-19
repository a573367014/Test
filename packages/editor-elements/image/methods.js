/**
 * @class EditorImageElementMixin
 * @description 元素的专属方法
 */

import assign from 'lodash/assign';
import pickBy from 'lodash/pickBy';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import { filterRendererService } from '@gaoding/editor-framework/src/utils/filter-renderer/service';

export default {
    /**
     * 添加图片元素
     * @memberof EditorImageElementMixin
     * @param {String} url - 图片路径
     * @param {Object} options - 图片其他参数，查看{@link module:editorDefaults.element|element}
     */
    addImage(url, options) {
        const data = assign(
            {
                type: 'image',
            },
            options,
        );

        data.url = url || this.options.placeImage;

        return this.addElement(data);
    },

    /**
     * 替换 `imageElement` 与 `maskElement` 图片
     * @memberof EditorImageElementMixin
     * @param {String} url - 新图片地址
     * @param {Object} options - 替换参数
     * @param {Boolean} [options.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
     * @param {Number} [options.width] - 新图片的尺寸宽度
     * @param {Number} [options.height] - 新图片的尺寸高度
     * @param {element} element - 被替换的元素
     * @param {Boolean} makeSnapshot - 是否创建快照
     */
    replaceImage(url, options, element, makeSnapshot = true) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const type = element.type;
        if (type !== 'image' && type !== 'mask') {
            return;
        }

        options = assign(
            {
                forwardEdit: true,
            },
            options,
        );

        const elementWidth = element.width;
        const elementHeight = element.height;
        const imgWidth = options.width || elementWidth;
        const imgHeight = options.height || elementHeight;

        // 短边放大，cover
        const ratio = Math.max(elementWidth / imgWidth, elementHeight / imgHeight);
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;

        this.changeElement(
            {
                url: url,
                naturalWidth: imgWidth,
                naturalHeight: imgHeight,
                imageTransform: element.parseTransform({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }),
                $imageWidth: width,
                $imageHeight: height,
            },
            element,
            makeSnapshot,
        );

        if (options.forwardEdit && element !== this.currentSubElement) {
            if (type === 'image') {
                this.showImageCroper(element);
            } else if (type === 'mask') {
                this.showMaskEditor(element);
            }
        }
    },

    /**
     * `imageElement` 图片元素进入剪裁状态
     * @memberof EditorImageElementMixin
     * @param {element} element - 图片元素应用
     */
    showImageCroper(element) {
        element = this.getElement(element);

        this.currentCropElement = element;
    },

    /**
     * 编辑器的当前处于剪裁状态的 `imageElement` 图片元素，退出剪裁状态
     * @memberof EditorImageElementMixin
     */
    hideImageCroper() {
        this.currentCropElement = null;
    },

    /**
     * 图片元素转换为蒙版元素
     * @memberof EditorImageElementMixin
     * @param  {element} element - 被转换图片元素
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的蒙版元素
     */
    convertImageToMask(element, layout) {
        element = this.getElement(element);
        if (!element || element.isVideo) {
            return;
        }

        const data = pickBy(element, (v, k) => {
            return k.charAt(0) !== '$';
        });

        // mask props
        data.type = 'mask';
        data.mask = data.url;

        data.imageUrl = null;
        data.version = editorDefaults.version;

        const newElement = this.replaceElement(element, data, layout);

        this.focusElement(newElement);

        return newElement;
    },

    /**
     * 切换裁切状态下的内外框
     * @memberof EditorImageElementMixin
     */
    toggleCropperFocus() {
        const { currentElement } = this;
        if (
            !currentElement ||
            (currentElement.type !== '$masker' && currentElement.type !== '$croper')
        ) {
            return;
        }

        const isInnerActive = currentElement.resize === 0b111;
        const name = isInnerActive ? 'imageCroper.activeOuter' : 'imageCroper.activeInner';

        this.$events.$emit(name);
    },

    createFilterTask(image, zipUrl, isCancel) {
        return filterRendererService.getRender().then(async (render) => {
            await render.loadMaterial(zipUrl);
            return render.engine.synchronize(async () => {
                if (typeof isCancel === 'function' && isCancel()) {
                    // throw new Error('cancel');
                    return;
                }
                return render.renderMaterial(image, zipUrl, 1);
            }).promise;
        });
    },
};
