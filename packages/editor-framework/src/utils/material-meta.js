export default {
    FILTER: ['design_filter', 'filter'],
    ANIMATION: 'animation',
    TEXT_EFFECT: 'text_effect',
    IMAGE_EFFECT: 'image_effect',
    THREE_TEXT: 'three_text',
    POSTER: 'poster',
    MOSAIC: 'mosaic',
    BORDER: 'border',
    POSTERS: ['poster', 'web_page', 'gif', 'odyssey', 'h5_bargraph', 'ppt', 'list'],

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
    clearElementMaterialMeta(element) {
        if (element.metaInfo && element.metaInfo.materials) {
            const metaInfo = Object.assign({}, element.metaInfo);
            metaInfo.materials = [];
            element.metaInfo = metaInfo;
        }
        this._clearElementMateInfo(element);
    },
    removeElementMaterialMeta(element, values, key = 'type') {
        values = [].concat(values);
        if (element.metaInfo && element.metaInfo.materials) {
            const metaInfo = Object.assign({}, element.metaInfo);
            metaInfo.materials = metaInfo.materials.filter((item) => !values.includes(item[key]));
            element.metaInfo = metaInfo;
        }
        this._clearElementMateInfo(element);
    },
    keepElementMaterialMeta(element, values, key = 'type') {
        values = [].concat(values);
        if (element.metaInfo) {
            const metaInfo = Object.assign({}, element.metaInfo);
            if (metaInfo.materials) {
                metaInfo.materials = metaInfo.materials.filter((item) => {
                    const types = values.flat();
                    return types.includes(item[key]);
                });
            }
            if (metaInfo.teamMaterials) {
                metaInfo.teamMaterials = metaInfo.teamMaterials.filter((item) =>
                    values.includes(item[key]),
                );
            }
            element.metaInfo = metaInfo;
        }
        this._clearElementMateInfo(element);
    },
    replaceImageMaterialMeta(imageElement, maskElement) {
        const keepTypes = [this.IMAGE_EFFECT, ...this.FILTER];
        this.keepElementMaterialMeta(maskElement, keepTypes);

        const newMetaInfo = Object.assign({}, maskElement.metaInfo);
        newMetaInfo.materials = newMetaInfo.materials || [];
        newMetaInfo.teamMaterials = newMetaInfo.teamMaterials || [];

        imageElement.metaInfo &&
            imageElement.metaInfo.materials &&
            imageElement.metaInfo.materials.forEach((item) => {
                !keepTypes.includes(item.type) && newMetaInfo.materials.push(item);
            });

        imageElement.metaInfo &&
            imageElement.metaInfo.teamMaterials &&
            imageElement.metaInfo.teamMaterials.forEach((item) => {
                !keepTypes.includes(item.type) && newMetaInfo.teamMaterials.push(item);
            });

        maskElement.metaInfo = newMetaInfo;
        this._clearElementMateInfo(maskElement);
    },
};
