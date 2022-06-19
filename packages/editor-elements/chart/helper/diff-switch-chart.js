import { isObject, get, set, has, mergeWith, isArray } from 'lodash';
import { differenceDeep, toPathsDeep } from './util';

// 图表切换可以保存的字段
import { SWITCH_PROP } from './constant';

/**
 * 采用了WeakMap方式来记录元素编辑字段
 */
const mustChangeKeyWeakMap = new WeakMap();
/**
 * 替换key
 * @param {Object} currentModel
 * @param {Object} subModel
 */
function substituteModelKey(currentModel, subModel) {
    if (!mustChangeKeyWeakMap.has(currentModel)) return;
    const mustChangeKeyMap = mustChangeKeyWeakMap.get(currentModel);
    mustChangeKeyWeakMap.delete(currentModel);
    mustChangeKeyWeakMap.set(subModel, mustChangeKeyMap);
}
/**
 * 确保兼容问题，防止内存泄露
 */
function deleteModelKey(modelKey) {
    mustChangeKeyWeakMap.delete(modelKey);
}

/**
 * 根据具体的path
 * @param {Object} model
 * @param {Array} keyList
 */
function pickByPropPath(model, keyList) {
    const obj = {};
    keyList.forEach((path) => {
        const value = get(model, path);
        if (value !== undefined) {
            set(obj, path, value);
        }
    });
    return obj;
}

export { mustChangeKeyWeakMap, deleteModelKey, substituteModelKey, pickByPropPath };

/**
 * 切换图表功能
 * @param {model} currentModel 当前图表类型model
 * @param {model} initialModel 当前图表类型最开始初始化的model
 * @param {model} changeModel 切换图表类型的初始化model
 */
export default function diffAndSwitchModel({ currentModel, initialModel, changeModel }) {
    let mustChangeKeyMap = mustChangeKeyWeakMap.get(currentModel);
    if (!mustChangeKeyMap) {
        mustChangeKeyMap = new Map();
        mustChangeKeyWeakMap.set(currentModel, mustChangeKeyMap);
    }

    /**
     * 1.
     * 获取已经改变的数据对象，只挑选有意义(图表核心字段)的字段进行对比
     *
     * 当前的图表类型的model(可能被用户修改了数据) 和 初始化(从服务器获取)的model 进行对比。
     * 获取对比之后对象，认为是该对象（simpleModel）的所有属性字段均为用户自定义（编辑过）的属性字段。
     */
    const simpleModel = differenceDeep(
        pickByPropPath(currentModel, SWITCH_PROP),
        pickByPropPath(initialModel, SWITCH_PROP),
    );

    /**
     *
     * @example
     * this.hasChangeKeyProp = ['chartTitle.enable', 'chartTitle.name', 'xAxis.label.enable', ...]
     */

    const mustChangeKeyProp = new Set(mustChangeKeyMap.keys());
    /**
     * 2.
     * mustChangeKeyProp 保存着之前所有切换操作，所有被用户编辑过的字段，
     * 因为可能存在部分编辑过的字段，对于切换后的类型无意义。导致下一次切换对比就缺失上上次的编辑字段
     * eg：
     * 操作：
     * 1. 当前普通柱状图。
     * 2. 修改坐标轴标题。
     * 3. 切换饼图。
     * 4. 再切换会普通柱状图。
     * 坐标轴标题，xAxis.title.text 字段不是用户编辑的那个标题。
     *
     * 原因：
     * 饼图没有坐标轴，导致当前类型（饼图）和饼图的原数据对比的时候 无法对比出坐标轴标题的不同。
     * 导致坐标题这个编辑字段的丢失。
     *
     * 引入 mustChangeKeyProp 对象，保存所有编辑过的字段。
     * 如果对比结果后，应该将所有的 mustChangeKeyProp 赋值给 simpleModel
     *
     */
    mustChangeKeyProp.forEach((keyPath) => {
        // 要注意这里可能是多级对象（xAxis.label.enable）
        if (!has(simpleModel, keyPath)) {
            /**
             * 当前对象不一定有，如果没有就去mustChangeKeyMap对象取
             */
            const value = has(currentModel, keyPath)
                ? get(currentModel, keyPath)
                : mustChangeKeyMap.get(keyPath);
            set(simpleModel, keyPath, value);
        }
    });

    // 注意：
    // 由于维度是跟数据挂钩的，所以数据有改变，维度也要进行同样改变
    if (simpleModel.chartData || mustChangeKeyProp.has('chartData')) {
        simpleModel.metrics = currentModel.metrics;
        simpleModel.scales = currentModel.scales;
    }

    //
    /**
     * 只有colorType一致，才能切换colors
     * 如何没有保持一直，需要删除remove colors
     */
    const COLOR_TYPE_KEY = 'colorType';
    const COLOR_TYPE_DEFAYLT = 0;
    const currentColorType = get(
        simpleModel,
        COLOR_TYPE_KEY,
        get(currentModel, COLOR_TYPE_KEY, COLOR_TYPE_DEFAYLT),
    );
    if (currentColorType !== get(changeModel, COLOR_TYPE_KEY, COLOR_TYPE_DEFAYLT)) {
        delete simpleModel.colorType;
        delete simpleModel.colors;
    }

    const simpleChangeKeyProp = toPathsDeep(simpleModel);
    // 3. 保存所有改变的字段
    simpleChangeKeyProp.forEach((keyPath) => {
        if (!keyPath) return;
        mustChangeKeyMap.set(keyPath, get(simpleModel, keyPath));
    });

    // TODO：
    // 是否允许多维切换单维度， 目前不支持
    // 多维度切换单维的
    // 就要判断merices的字段是否一样
    // 当数据有变化的时候，就要把merices 合并过去

    /**
     * 4. 合并出新model
     */
    return mergeWith({}, changeModel, simpleModel, function (objValue, srcValue, key) {
        // 数组不合并, 直接替换
        // colors， chartData
        if (isArray(srcValue)) {
            return srcValue;
        }

        /**
         * 维度直接替换
         */
        if (key === 'metrics') {
            return srcValue;
        }

        /**
         * 例如，折线图修改了坐标系的信息
         * 在饼图中，坐标轴xAxis, yAxis 为 null
         * 则坐标系的信息不会被合并
         * !!important: model属性对象不要用null值来代表隐藏
         */
        if (objValue === null && isObject(srcValue)) {
            return null;
        }
    });
}
