export default {
    TEXT_EFFECT: 'text_effect',
    IMAGE_EFFECT: 'image_effect',
    TEXT: 'text',
    THREE_TEXT: 'three_text',
    ANIMATION: 'animation',

    _clearElementMateInfo(element) {
        const metaInfo = Object.assign({}, element.metaInfo);
        const materials = metaInfo.materials || [];
        if (!materials.length) delete metaInfo.materials;
        if (!Object.keys(metaInfo).length) {
            element.metaInfo = null;
        } else {
            element.metaInfo = metaInfo;
        }
    },
    // 添加素材时做加工处理
    addElementMaterialMeta(element, material) {
        const metaInfo = Object.assign({}, element.metaInfo);
        const materials = metaInfo.materials || [];

        materials.push(material);
        metaInfo.materials = materials;
        element.metaInfo = metaInfo;

        return element;
    },
    clearElementMaterialMeta(element) {
        if (element.metaInfo && element.metaInfo.materials) {
            const metaInfo = Object.assign({}, element.metaInfo);
            metaInfo.materials = [];
            element.metaInfo = metaInfo;
        }
        this._clearElementMateInfo(element);
    },
    removeElementMaterialMeta(element, value, key = 'id') {
        if (element.metaInfo && element.metaInfo.materials) {
            const metaInfo = Object.assign({}, element.metaInfo);
            metaInfo.materials = metaInfo.materials.filter((item) => item[key] !== value);
            element.metaInfo = metaInfo;
        }
        this._clearElementMateInfo(element);
    },
    getElementMaterialMetas(element, value, key = 'id') {
        const result =
            element.metaInfo &&
            element.metaInfo.materials &&
            element.metaInfo.materials.filter((item) => item[key] === value);
        return result || [];
    },
};
