import tinycolor from 'tinycolor2';
import { IColor } from '../types/color-picker';
import { throttle } from 'lodash';

/**
 * 避免产生精度差异
 * 参考：https://www.cnblogs.com/daysme/p/6547492.html
 * @param f 计算值结果值
 * @param digit  保留的小数位
 */
export function fixedFloat(f: number, digit: number) {
    const m = Math.pow(10, digit);
    const convertNum = m * f;
    return Math.floor(convertNum) / m;
}

/**
 * ms 转成 分:秒的字符串格式
 * @param time 时间，默认单位 ms
 * @param unit 指定单位，默认单位 ms
 */
export function formatTime(time: number, unit: 'ms' | 's' = 'ms'): string {
    const duration = unit === 'ms' ? ~~(time / 1000) : ~~time;
    const minutes = Math.floor(duration / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (duration % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
}

/**
 * 将hvs颜色转为rgba
 * @param hsv
 */
export function hsv2RgbHex(hsv: IColor) {
    const color = tinycolor.fromRatio({
        h: hsv.h,
        s: hsv.s,
        v: hsv.v,
        a: hsv.a,
    });
    return color.toHexString().toUpperCase();
}

interface IThrottleOptions {
    /**
     * 缓冲时间
     */
    wait: number;
    /**
     * 在缓冲过后再触发事件
     */
    trailing?: boolean;
    /**
     * 在缓冲前触发事件
     */
    leading?: boolean;
}

const throttleMap = new WeakMap();

/**
 * 绑定事件
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 * @param throttleOptions 截流选项。开启时默认 trailing 模式；boolean 类型表示开启，超时 400 ms；number 类型表示设定超时事件；IThrottleOptions 可以详细设定截流配置
 */
export function on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
    throttleOptions?: IThrottleOptions | number | boolean,
): () => void;

/**
 * 绑定事件
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 * @param throttleOptions 截流选项。开启时默认 trailing 模式；boolean 类型表示开启，超时 400 ms；number 类型表示设定超时事件；IThrottleOptions 可以详细设定截流配置
 */
export function on(
    el: HTMLElement | Document | Window,
    event: string,
    callback: (e: any) => void,
    options?: boolean | AddEventListenerOptions,
    throttleOptions?: IThrottleOptions | number | boolean,
): () => void;

export function on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K] | Event | CustomEvent) => any,
    options: boolean | AddEventListenerOptions = false,
    throttleOptions?: IThrottleOptions | number | boolean,
): () => void {
    const removeListener = () => {
        off(el, event, callback, options);
    };

    if (typeof throttleOptions === 'undefined' || throttleOptions === false) {
        el.addEventListener(event, callback, options);

        return removeListener;
    }

    if (throttleOptions === true) {
        throttleOptions = {
            wait: 400,
            trailing: true,
        };
    }

    if (typeof throttleOptions === 'number') {
        throttleOptions = {
            wait: throttleOptions,
            trailing: true,
        };
    }

    const throttleFunc = throttle(callback, throttleOptions.wait, {
        trailing: throttleOptions.trailing,
        leading: throttleOptions.leading,
    });

    throttleMap.set(callback, throttleFunc);

    el.addEventListener(event, throttleFunc, options);

    return removeListener;
}

/**
 * 解绑事件
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 */
export function off<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
): void;

/**
 * 解绑事件
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 */
export function off(
    el: HTMLElement | Document | Window,
    event: string,
    callback: (e: Event | CustomEvent) => void,
    options?: boolean | AddEventListenerOptions,
): void;

export function off<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: string | K,
    callback: (e: Event | CustomEvent | HTMLElementEventMap[K]) => any,
    options: boolean | AddEventListenerOptions = false,
): void {
    if (throttleMap.has(callback)) {
        const func = throttleMap.get(callback);
        throttleMap.delete(callback);
        callback = func;
    }

    el.removeEventListener(event, callback, options);
}

/**
 * 绑定事件，只执行一次
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 */
export function once<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
): () => void;

/**
 * 绑定事件，只执行一次
 * @param el 绑定元素
 * @param event 事件名
 * @param callback 回调
 * @param options 事件监听配置选项，对应于 addEventListener 第三个参数，默认 false
 */
export function once(
    el: HTMLElement | Document | Window,
    event: string,
    callback: (e: any) => void,
    options?: boolean | AddEventListenerOptions,
): () => void;

export function once<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    callback: (
        this: HTMLElement | Document | Window,
        ev: HTMLElementEventMap[K] | Event | CustomEvent,
    ) => any,
    options?: boolean | AddEventListenerOptions,
) {
    const once = function once(e: HTMLElementEventMap[K] | CustomEvent | Event) {
        callback.call(el, e);
        el.removeEventListener(event, once, options);
    };
    el.addEventListener(event, once, options);

    return () => {
        el.removeEventListener(event, once, options);
    };
}

export function clamp(value: number, min: number, max: number) {
    return min < max
        ? value < min
            ? min
            : value > max
            ? max
            : value
        : value < max
        ? max
        : value > min
        ? min
        : value;
}
