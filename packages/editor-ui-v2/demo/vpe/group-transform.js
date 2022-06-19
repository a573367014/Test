const { cloneDeep, isEqual, pick, remove } = require('lodash');
const { walkTemplet } = require('@gaoding/editor-utils/templet');
const utils = require('@gaoding/editor-utils/rect');

const defaultBackgroundEffect = {
    /**
     * @type { Boolean } 开启背景
     */
    enable: false,

    /**
     * 背景类型, gradient 渐变、image 图片、ninePatch 智能拉伸
     * @type { String }
     */
    type: 'gradient',
    // 透明度

    /**
     * 透明度
     * @type { Number }
     */
    opacity: 1,

    /**
     * 渐变背景
     * @type { Object }
     */
    gradient: {
        angle: 0,
        stops: [
            // 渐进色，偏移值 0-1
            { color: '#ffffffff', offset: 0 },
            { color: '#000000ff', offset: 1 },
        ],
        type: 'linear',
    },

    /**
     * 图片背景
     * @type { Object }
     */
    image: {
        url: '',
        repeat: 'no-repeat',
        transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        naturalWidth: 0,
        naturalHeight: 0,
    },

    /**
     * 智能拉伸背景
     * @type { Object }
     */
    ninePatch: {
        url: '',
        imageSlice: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        },
        originWidth: 0,
        originHeight: 0,
        /**
         * 记录 imageSlice、originWidth、originHeight 的缩放比例
         * @type {Number}
         */
        effectScale: 1
    }
};
const defaultTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

function transformTextGroup(layouts) {
    walkTemplet((group, parent, index) => {
        if(group.type !== 'group') return;

        let ninePatchChild;
        let elements = group.elements.filter(el => {
            if(
                !ninePatchChild &&
                el.type === 'ninePatch' &&
                (el.width * el.height / (group.width * group.height) > 0.95)
            ) {
                ninePatchChild = el;
                return false;
            };

            return true;
        });
        
        if(!ninePatchChild) return;

        if(
            elements.length === 1 &&
            elements[0].type === 'text' &&
            // isEqual(elements[0].transform, editorDefaults.element.transform) &&
            isEqual(group.transform, defaultTransform)
        ) {
            const text = transformToText(group, ninePatchChild);
            parent.elements.splice(index, 1, text);
        }
        else {
            transformGroup(group, ninePatchChild);
        }
    }, true, layouts);
}

function transformToText(group, ninePatch) {
    const backgroundEffect = cloneDeep(defaultBackgroundEffect);
    const textElement = group.elements[0] === ninePatch ? group.elements[1] : group.elements[0];
    textElement.dragable = true;
    textElement.rotatable = true;

    backgroundEffect.enable = true;
    backgroundEffect.type = 'ninePatch';
    backgroundEffect.ninePatch = pick(ninePatch, Object.keys(backgroundEffect.ninePatch));

    const addPadding = [
        textElement.top,
        group.width - textElement.width - textElement.left,
        group.height - textElement.height - textElement.top,
        textElement.left,
    ];

    textElement.left = group.left;
    textElement.top = group.top;
    textElement.width = group.width;
    textElement.height = group.height;
    textElement.backgroundEffect = backgroundEffect;
    textElement.padding = textElement.padding ? textElement.padding.map((val, i) => {
        return val + addPadding[i];
    }) : addPadding;

    return textElement;
}

function transformGroup(group, ninePatch) {
    remove(group.elements, ninePatch);

    const backgroundEffect = cloneDeep(defaultBackgroundEffect);
    backgroundEffect.enable = true;
    backgroundEffect.type = 'ninePatch';
    backgroundEffect.ninePatch = pick(ninePatch, Object.keys(backgroundEffect.ninePatch));

    const childrenRect = utils.getBBoxByElements(group.elements.filter(el => el.type !== 'ninePatch'));
    
    const padding = {
        left: childrenRect.left,
        right: group.width - childrenRect.left - childrenRect.width,
        top: childrenRect.top,
        bottom: group.height - childrenRect.top - childrenRect.height,
    }

    group.backgroundEffect = backgroundEffect;
    group.padding = [padding.top, padding.right, padding.bottom, padding.left];
}


module.exports = {
    transformTextGroup,
    transformToText,
    transformGroup
}
