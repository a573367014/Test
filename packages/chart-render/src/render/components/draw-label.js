import { merge } from '@antv/g2/lib/util';

const defaultConfig = {
    enable: true, // 暂时没用到
    // 偏移
    offsetX: 0,
    offsetY: 0,
    // 坐标
    x: 0,
    y: 0,
    // 文字内容
    text: '',
    // 文本格式
    formatter: (i) => i,
    // style
    textStyle: {
        textAlign: 'center',
        textBaseline: 'middle',
        color: '#000000', // 颜色
        fontWeight: 400, // 加粗
        fontSize: 16, // 字体大小
    },
};

/**
 * 绘制label
 * @param {*} group
 * @param {*} points
 */
export default function drawLabel(group, config) {
    if (!config) return;
    config = merge({}, defaultConfig, config);
    const { offsetX = 0, offsetY = 0, text } = config;
    // add text
    return group.addShape('text', {
        _id: config.id,
        coord: config.coord,
        animateCfg: config.animateCfg || {},
        attrs: {
            // 偏移量
            x: Number(config.x) - Number(offsetX),
            y: Number(config.y) - Number(offsetY),
            text: String(text),
            ...config.textStyle,
        },
    });
}

export function drawLabelWithLabelController($labelController, group, shapeLabelConfig, callback) {
    if ($labelController && $labelController.enable && !$labelController.$geom) {
        const { origin, coord, id, x, y } = shapeLabelConfig;

        const config = $labelController.getG2Config();
        let text = origin[$labelController.field];
        if (typeof config.formatter === 'function') {
            text = config.formatter(text, origin);
        }
        const _id = `${id}-labels`;
        let cfg = {
            ...config,
            text: text, // label字段
            x,
            y,
            textStyle: {
                ...config.textStyle,
            },
            coord,
        };
        if (typeof callback === 'function') {
            cfg = callback(cfg);
        }
        if (cfg.offset !== undefined && cfg.offsetY === undefined) {
            cfg.offsetY = cfg.offset;
        }
        const shape = drawLabel(group, cfg);
        shape._id = _id;
        shape.name = 'label';

        return shape;
    }
}

// class GeomLabel {
//     /**
//      * 获取默认配置
//      * 针对model
//      */
//     defaultCfg() {
//         return {
//             // text: '默认标题',
//             enbale: true, // 开关

//             // 上下
//             // 左边，居中，居右
//             position: 'top-center', // 方向，位置, 宽度

//             // 垂直方向的offset偏移量
//             offset: 0.78,

//             // style
//             fontSize: 36,
//             color: '#000000',
//             fontWeight: 600,
//             lineHeight: 1.38,
//             fontStyle: 'normal',
//             fontVariant: 'normal',
//             textAlign: 'left',
//             textBaseline: 'middle',
//             fontFamily: FONT_FAMILY,
//         };
//     }

//     /**
//      * 获取是否开启
//      */
//     get enable() {
//         return this.config.enable && String(this.config.text).length > 0;
//     }

//     /**
//      * @param {Object} cfg
//      * @param {Objetc} options
//      */
//     constructor(cfg, options) {
//         this.config = combine(cfg, this.defaultCfg());
//         merge(this, options);

//         this.shape = null;
//         this.style = textStyleAdapter(this.config);
//         this._init();
//     }

//     _init() {
//         if(!config) return;
//         config = merge({}, defaultConfig, config);
//         let { offsetX = 0, offsetY = 0, text } = config;

//         // add text
//         return group.addShape('text', {
//             attrs: {
//                 // 偏移量
//                 x: Number(config.x) - Number(offsetX),
//                 y: Number(config.y) - Number(offsetY),
//                 text: String(text),
//                 ...config.textStyle,
//             }
//         });
//     }
// }

// // 创建
// function createLabelDraw() {
//     /**
//      * 生成创建对象
//      */
//     return function() {

//     };
// }
