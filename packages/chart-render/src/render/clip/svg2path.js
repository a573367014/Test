/**
 * TODO:还需要完善
 * 指令对应的转换位置关系
 */
const ORDER_MAP = {
    M: ['x', 'y'],
    L: ['x', 'y'],
    A: ['xr', 'yr', '', '', '', 'x', 'y'],
    C: ['x', 'y', 'x', 'y', 'x', 'y'],
    V: ['y'],
    H: ['x'],
    S: ['x', 'y', 'x', 'y'],
    T: ['x', 'y'],
    Q: ['x', 'y', 'x', 'y'],
};

/**
 * 转换path
 * @param {Array} path 路径数组
 * @param {Function} param.resetX 转换x方法
 * @param {Function} param.resetY 转换y方法
 * @param {Function} param.resetR 转换r方法
 */
function formatPathDeep(path, { resetX, resetY, resetXR, resetYR }) {
    return path.map((orderItem) => {
        const cmd = orderItem[0];
        const orderKey = ORDER_MAP[cmd];
        if (!cmd || !orderKey) return orderItem;

        // 转换函数
        return orderItem.map((v, i) => {
            if (i === 0 || typeof v !== 'number' || isNaN(v)) return v;
            switch (orderKey[i - 1]) {
                case 'x':
                    return resetX(v);
                case 'y':
                    return resetY(v);
                case 'xr':
                    return resetXR(v);
                case 'yr':
                    return resetYR(v);
                default:
                    return v;
            }
        });
    });
}

/**
 * 字符串转换为方法
 * @param {Srting} expr
 */
const EXPR_ARG = 'v';
/* eslint-disable no-new-func */
function stringExpression(expr) {
    return new Function([EXPR_ARG], `return ${expr}`);
}

/**
 * 根据指令生成转换x方法
 * @param {Array} order
 */
function createResetXByOrder(order) {
    const expr = order.reduce((expr, item) => {
        const type = item.type;
        switch (type) {
            case 'scale':
            case 'scalex':
                return `(${expr} * ${item.value})`;
            case 'translate':
                return `(${expr} - ${item.value[0]})`;
            case 'draw':
                return `(${expr} + ${item.value[0]})`;
            default:
                return expr;
        }
    }, EXPR_ARG);

    return stringExpression(expr);
}

/**
 * 根据指令生成转换y方法
 * @param {Array} order
 */
function createResetYByOrder(order) {
    const expr = order.reduce((expr, item) => {
        const type = item.type;
        switch (type) {
            case 'scale':
            case 'scaley':
                return `(${expr} * ${item.value})`;
            case 'translate':
                return `(${expr} - ${item.value[1]})`;
            case 'draw':
                return `(${expr} + ${item.value[1]})`;
            default:
                return expr;
        }
    }, EXPR_ARG);
    return stringExpression(expr);
}

/**
 * 根据指令生成转换r方法
 * @param {Array} order
 */
function createResetXRByOrder(order) {
    const expr = order.reduce((expr, item) => {
        const type = item.type;
        switch (type) {
            case 'scale':
            case 'scalex':
                return `(${expr} * ${item.value})`;
            default:
                return expr;
        }
    }, EXPR_ARG);

    return stringExpression(expr);
}

/**
 * 根据指令生成转换r方法
 * @param {Array} order
 */
function createResetYRByOrder(order) {
    const expr = order.reduce((expr, item) => {
        const type = item.type;
        switch (type) {
            case 'scale':
            case 'scaley':
                return `(${expr} * ${item.value})`;
            default:
                return expr;
        }
    }, EXPR_ARG);

    return stringExpression(expr);
}

/**
 * @class
 * svg,path转 g2可识别的path
 */
export default class Svg2Path {
    constructor({ viewBox, path }) {
        const [minX, minY, boxWidth, boxHeight] = viewBox;
        this.path = path;
        this.minX = minY;
        this.minX = minX;
        this.boxWidth = boxWidth;
        this.boxHeight = boxHeight;
        this.order = [];
    }

    /**
     * 缩放
     * @param {Number} ratio
     */
    scale(ratio) {
        this.order.push({
            type: 'scale',
            value: ratio,
        });
    }

    /**
     * 缩放X
     * @param {Number} ratio
     */
    scaleX(ratio) {
        this.order.push({
            type: 'scalex',
            value: ratio,
        });
    }

    /**
     * 缩放X
     * @param {Number} ratio
     */
    scaleY(ratio) {
        this.order.push({
            type: 'scaley',
            value: ratio,
        });
    }

    /**
     * TODO: 是否可以有方位，
     * 8个方位，
     * tl(top-left), tc(top-cenrer), tr(top-right),
     * lc(left-cenrer), rc(right-cenrer),
     * bl(bottom-left), bc(bottom-cenrer), br(bottom-right)
     *
     * 移动点位
     * @param {Number} x
     * @param {Number} y
     */
    translate(x, y) {
        this.order.push({
            type: 'translate',
            value: [x, y],
        });
    }

    /**
     * 绘制点
     * @param {Number} x
     * @param {Number} y
     */
    draw(x, y) {
        this.order.push({
            type: 'draw',
            value: [x, y],
        });
    }

    /**
     * 根据所有指令生成path对象
     */
    build() {
        const order = this.order;
        const resetX = createResetXByOrder(order);
        const resetY = createResetYByOrder(order);
        const resetXR = createResetXRByOrder(order);
        const resetYR = createResetYRByOrder(order);

        // 要重新设置path了吗
        return formatPathDeep(this.path, {
            resetX,
            resetY,
            resetXR,
            resetYR,
        });
    }
}
