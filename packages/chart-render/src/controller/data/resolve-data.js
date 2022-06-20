import ToAarryJson from './instructs/to-array-json';
import { merge, cloneDeep } from '@antv/g2/lib/util';

/**
 * 触发转换器
 * @param {Array[Function]} callBackList 函数队列
 * @param {Array[Array]} dataSource 数据
 * @param  {...any} callBackArgs 参数
 */
function reduceData(callBackList, dataSource, ...callBackArgs) {
    dataSource = cloneDeep(dataSource) || [];
    return callBackList.reduce((source, callback) => {
        let nextSource = callback(source, ...callBackArgs);
        if (!nextSource || !Array.isArray(nextSource)) {
            nextSource = source;
        }
        return nextSource;
    }, dataSource);
}

/**
 * @class ArrayToDataSource
 * 数据格式类
 */
export default class ArrayToDataSource {
    constructor(arrayData, options, scales) {
        if (!Array.isArray(arrayData)) {
            arrayData = [];
        }
        this.dataSource = arrayData;
        this._beforeTranformCallback = [];
        this._transformsCallback = [];
        // Todo, 寻找
        this.options = merge({}, options);
        this.scales = merge({}, scales);

        // 转换数据
        this._init();
    }

    /**
     * 绑定两个处理函数
     */
    _init() {
        this.registerTranform(this._callBeforeTranform.bind(this));
        this.registerTranform(new ToAarryJson());
    }

    /**
     * 注册转化为数组对象之前
     * @param {Function} fn
     */
    registerBeforeTranform(fn) {
        if (fn.isInstruct === true) {
            fn = fn.callback.bind(fn);
        }
        if (typeof fn === 'function') {
            this._beforeTranformCallback.push(fn);
        }
    }

    /**
     * 注册转化为数据对象之后的转化函数
     * @param {Function} fn
     */
    registerTranform(fn) {
        if (fn.isInstruct === true) {
            fn = fn.callback.bind(fn);
        }
        if (typeof fn === 'function') {
            this._transformsCallback.push(fn);
        }
    }

    // 装填数据
    source() {
        return this._callTranform(this.dataSource);
    }

    /**
     * 改变数据
     * @public
     * @param {Array} dataSource
     */
    changData(dataSource, scales) {
        this.scales = scales;
        this.dataSource = dataSource;
    }

    // 触发转换之前的数据
    _callBeforeTranform(dataSource) {
        dataSource = dataSource || [];
        return reduceData(this._beforeTranformCallback, dataSource, this.options, this.scales);
    }

    // 触发转换成对象之后的数据
    _callTranform(dataSource) {
        return reduceData(this._transformsCallback, dataSource, this.options, this.scales);
    }
}
