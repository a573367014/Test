/**
 * 判断元素是否是一个循环元素（只判断是否循环，不判断循环次数）
 * @param {*} element
 */
export function isLoopElement(element) {
    const loop = element.loop;
    return typeof loop === 'number' ? loop !== 1 : !!loop;
}
