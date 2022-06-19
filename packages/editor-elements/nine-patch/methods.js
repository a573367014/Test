/**
 * @class EditorNinePatchElementMixin
 * @description 元素的专属方法
 */

import { pick } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import convertSvgElementToImg from '@gaoding/editor-framework/src/utils/convert-svg';
import autoStretchImage from '@gaoding/editor-utils/auto-stretch-image';
import autoPatchImage from '@gaoding/editor-framework/src/utils/auto-patch-image';

export default {
    /**
     * 点9元素转换为图片元素
     * @memberof EditorNinePatchElementMixin
     * @param  {element} element 被转换点9元素
     * @param  {layout} layout 元素所在的布局
     * @return {Promise} element 创建的图片元素
     */
    async convertNinePatchToImage(element, layout) {
        element = this.getElement(element);
        if (!element) return;

        const defaultElement = editorDefaults.element;
        const defaultImageElement = editorDefaults.imageElement;
        const props = []
            .concat(Object.keys(defaultImageElement))
            .concat(Object.keys(defaultElement));
        const data = pick(element, props);

        // image props
        data.type = 'image';
        data.url = await autoStretchImage(element.url, {
            targetWidth: Math.round(element.width),
            targetHeight: Math.round(element.height),
            imageSlice: element.imageSlice,
            targetImageSlice: {
                left: element.imageSlice.left * element.effectScale,
                top: element.imageSlice.top * element.effectScale,
                right: element.imageSlice.right * element.effectScale,
                bottom: element.imageSlice.bottom * element.effectScale,
            },
        }).then((canvas) => {
            if (this.options.resource.blobUrlEnable) {
                return new Promise((resolve) => {
                    canvas.toBlob(
                        (blob) => {
                            resolve(URL.createObjectURL(blob));
                        },
                        'image/png',
                        1,
                    );
                });
            }

            return canvas.toDataURL('image/png', 1);
        });

        data.version = editorDefaults.version;
        const newElement = this.replaceElement(element, data, layout);
        this.focusElement(newElement);
        return newElement;
    },

    /**
     * 点svg、image、mask换为点9元素
     * @memberof EditorNinePatchElementMixin
     * @param  {element} element - 被转换的元素
     * @param  {layout} layout  - 元素所在的布局
     * @return {Promise} element 创建的图片元素
     */
    async convertElementToNinePatch(element, layout) {
        element = this.getElement(element);
        if (!element) return;

        const defaultElement = editorDefaults.element;
        const defaultImageElement = editorDefaults.ninePatchElement;
        const props = []
            .concat(Object.keys(defaultImageElement))
            .concat(Object.keys(defaultElement));
        const data = pick(element, props);
        let urlOrImg;

        if (element.type === 'svg') {
            const vm = this.getComponentById(element.$id);
            const svgElement = vm && vm.$el.querySelector('svg');
            if (svgElement) {
                const titleNode = svgElement.querySelector('title');
                titleNode && svgElement.removeChild(titleNode);
                urlOrImg = await convertSvgElementToImg(svgElement);
            }
        } else {
            urlOrImg = element.url;
        }

        // image props
        data.type = 'ninePatch';
        const ret = await autoPatchImage(urlOrImg, {
            blobUrlEnable: this.options.resource.blobUrlEnable,
        });
        const { left, top, right, bottom } = ret.offset;

        data.url = ret.image;
        data.version = editorDefaults.version;
        data.imageSlice = {
            left: left,
            top: top,
            right: Math.max(0, ret.width - right - 1),
            bottom: Math.max(0, ret.height - bottom - 1),
        };

        const newElement = this.replaceElement(element, data, layout);
        this.focusElement(newElement);
        return newElement;
    },
};
