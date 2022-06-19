/**
 * 边框属性
 * @memberof module:editorDefaults
 * @enum
 */
const border = {
    /**
     * 开启边框
     * @type { Boolean }
     */
    enable: false,

    /**
     * 边框类型, image: 图片, color: 纯色
     * @type { String }
     */
    type: 'color',

    /**
     * 边框透明度
     * @type { Number }
     */
    opacity: 1,

    /**
     * 边框宽度
     * 如果为图片边框，约定该宽度表示 imageSlice 中最大边的显示大小
     * @type { Number }
     */
    width: 10,
    /**
     * 填充方向,0否，1是，上右下左
     * 目前纯色时有用
     * @type { Array<Number> }
     */
    direction: [1, 1, 1, 1],

    /**
     * 缩小的九宫格图片
     * @type { String }
     */
    image: '',

    /**
     * 四个边平铺方式 'repeat'、'round'
     * @type { String }
     */
    imageRepeat: 'round',

    /**
     * 将图片分割为9个区域：四个角，四个边（edges）以及中心区域
     * left 与 right 水平可重复区域的位置
     * top 与 bottom 为垂直可重复区域的位置
     * @type { Object }
     */
    imageSlice: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },

    /**
     * 边框颜色
     * @type { String }
     */
    color: '#000000ff',

    $loaded: false,
};

export default border;
