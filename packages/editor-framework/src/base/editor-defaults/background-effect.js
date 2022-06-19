/**
 * 元素通用背景属性
 * @memberof module:editorDefaults
 * @enum
 */
const backgroundEffect = {
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
            bottom: 0,
        },
        originWidth: 0,
        originHeight: 0,
        /**
         * 记录 imageSlice、originWidth、originHeight 的缩放比例
         * @type {Number}
         */
        effectScale: 1,
    },
};

export default backgroundEffect;
