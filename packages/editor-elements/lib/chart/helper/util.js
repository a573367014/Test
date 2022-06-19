import _cloneDeep from "lodash/cloneDeep";
import _pick from "lodash/pick";
import _isPlainObject from "lodash/isPlainObject";
import _isEqual from "lodash/isEqual";
import _transform from "lodash/transform";
import { CHART_MODEL_MAIN_PROP } from "./constant";
/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */

export function differenceDeep(object, base) {
  return _transform(object, function (result, value, key) {
    if (!_isEqual(value, base[key])) {
      result[key] = _isPlainObject(value) && _isPlainObject(base[key]) ? differenceDeep(value, base[key]) : value;
    }
  }, {});
}
/**
 * 获取对象的所有key
 * @example
 * toPathsDeep({
 *   a: 1,
 *   b: {
 *     c: 2,
 *     d: 3
 *   }
 * })
 *
 * return
 * ['a', 'b.c', 'b.d']
 *
 *
 * @param {Object} object
 * @returns {Array}
 */

export function toPathsDeep(object) {
  return _transform(object, function (paths, source, key) {
    if (_isPlainObject(source)) {
      paths.push.apply(paths, toPathsDeep(source).map(function (i) {
        return key + '.' + i;
      }));
    } else {
      paths.push(key);
    }

    return paths;
  }, []);
}
/**
 * 创建双击事件
 * TODO：素材双击事件可用后移除
 * @param {string} type
 */

export function createDbClickEvent(type) {
  return {
    /**
     * @description 目前核心编辑器的自定元素的各种点击事件，暂时无法支持，这里监听全局的 click 事件模拟用户双击
     */
    'base.click': function click(event) {
      var _this = this;

      var editor = this.editor; // mirror 模式下禁用 click 事件

      if (!editor || !editor.pointFromEvent || !editor.getElementByPoint) {
        return;
      }

      if (this.elementClickQueue == null) {
        this.elementClickQueue = [];
      }

      var point = editor.pointFromEvent(event);
      var element = editor.getElementByPoint(point.x, point.y); // 非表格元素清空点击队列

      if (!element || element.type !== type) {
        this.elementClickQueue = [];
        return;
      }

      if (this.elementClickTimer) {
        clearTimeout(this.elementClickTimer);
        this.elementClickQueue.push(element);

        if (this.elementClickQueue.length > 1) {
          this.editor.$emit("editor." + type + ".dblclick", element);
          this.elementClickQueue = [];
        }
      } else {
        this.elementClickQueue.push(element);
      } // 双击延迟为 300 ms


      this.elementClickTimer = setTimeout(function () {
        _this.elementClickQueue = [];
      }, 300);
    }
  };
}
/**
 * 获取chartModel必要字段就好了
 * @param {Object} model
 */

export function initChartModel(model) {
  return _cloneDeep(_pick(model, CHART_MODEL_MAIN_PROP));
}