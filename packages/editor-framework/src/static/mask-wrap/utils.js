import debounce from 'lodash/debounce';
import utils from '../../utils/utils';
import Vue from 'vue';
import baseElement from '../../base/editor-defaults/element';
import cloneDeep from 'lodash/cloneDeep';
/**
 * 根据 element 上的 maskInfo 重新组合 elements
 * @param {Array} elements 元素 model
 * @param {*} parentFrame 父层节点的 width height left top
 * @param {*} extendParams 扩展字段
 * @returns {Array} 新的 elements 组合
 */
export function resetElementsByMaskInfo(elements, extendParams = {}) {
    const newElements = [];
    let currentElements = newElements;
    elements.forEach((item, i) => {
        if (item.maskInfo && item.maskInfo.enable) {
            currentElements = [];
            newElements.push(item, {
                $id: `mask-${item.id}`,
                elements: currentElements,
                $maskElement: item, // 被标记蒙版的元素
                $maskElementIndex: i, // 被标记蒙版的元素的索引
                $exportType: 'maskInfoGroup',
                ...extendParams,
            });
        } else {
            currentElements.push(item);
        }
    });
    return newElements.length ? newElements : elements;
}

export async function initMaskInfo(model, editor) {
    if (model?.maskInfo?.imageUrl) {
        if (
            model.maskInfo.effectedResult &&
            !model.maskInfo.effectedResult?.width &&
            !model.maskInfo.effectedResult?.height
        ) {
            const image = await utils.loadImage(model.maskInfo.imageUrl);
            model.maskInfo.effectedResult = {
                ...model.maskInfo.effectedResult,
                width: image.width,
                height: image.height,
            };
        }
        return;
    }
    await updateMaskInfo(model, editor);
}

async function canvas2ImageUrl(canvas, localType) {
    if (localType === 'dataUrl') {
        return canvas.toDataURL();
    }
    const url = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)));
    });
    return url;
}
/**
 * 简称出图
 * 更新 maskInfo 信息
 * 将元素转成 canvas
 * 记录对应的 effectedResult 信息
 * 记录 canvas base64
 */
export async function updateMaskInfo(model, editor) {
    if (!model.maskInfo?.enable) return;
    await Vue.nextTick();
    const { canvas, effectedResult } = await editor.elementFullStatusToCanvas(model);
    await Vue.nextTick();
    model.maskInfo.imageUrl = await canvas2ImageUrl(canvas, editor.options.resource.localType);

    model.maskInfo.effectedResult.width = effectedResult.width;
    model.maskInfo.effectedResult.height = effectedResult.height;
    model.maskInfo.effectedResult.left = effectedResult.left;
    model.maskInfo.effectedResult.top = effectedResult.top;
}

export const debounceUpdateMaskInfo = debounce(updateMaskInfo, 300);

/**
 * 重置所有元素的maskInfo
 * @param {Array} elements 元素 model
 */
export function resetElementsMaskInfo(elements) {
    if (!Array.isArray(elements)) {
        elements = [elements];
    }
    elements.forEach((ele) => {
        ele.maskInfo = cloneDeep(baseElement.maskInfo);
    });
}
