/**
 * 将多个框组成的空间信息整合成一个
 * @param {{left: number, top: number, width: number, height: number}[]} rects 框组合
 */
export function getGroupElementVisualRect(rects) {
    if (!(rects || rects.length)) return { width: 0, height: 0, left: 0, top: 0 };
    let leftTop = [+Infinity, +Infinity];
    let rightBottom = [-Infinity, -Infinity];

    rects.map((item) => {
        const { left, top, width, height } = item;
        /* 左上角坐标 */
        const [lx, ly] = [left, top];
        /* 右下角坐标 */
        const [rx, ry] = [left + width, top + height];
        leftTop = [Math.min(leftTop[0], lx), Math.min(leftTop[1], ly)];
        rightBottom = [Math.max(rightBottom[0], rx), Math.max(rightBottom[1], ry)];
        return [
            [lx, ly],
            [rx, ry],
        ];
    });

    return {
        width: rightBottom[0] - leftTop[0],
        height: rightBottom[1] - leftTop[1],
        left: leftTop[0],
        top: leftTop[1],
    };
}

/**
 * 获取文字元素可视框
 */
export function getTextElementVisualRect(editor, element) {
    const comp = editor.getComponentById(element.$id);
    if (!comp) return { width: 0, height: 0, left: 0, top: 0 };
    const rect = _calcTextElementContentRect(comp.$el, editor);
    return rect;
}

/**
 * 计算文本元素内容框
 */
function _calcTextElementContentRect(textElementDOM, editor) {
    const mainDOM = textElementDOM.querySelector('.element-main');
    /*
        避免出现因空间挤压而导致的视觉换行的情况导致的测量不准确问题。
        在处理宽度时，我们需要进一步获取 span 元素，获取它们的 offsetWidth。
        如果所有 span 的宽度之和等于容器宽度，则认为是「单行」情况，此时宽度为 `sumWidth`
        否则为「多行」，取它们的最大值
     */
    const spanDOMs = textElementDOM.querySelectorAll('.element-main span');
    const offsetWidthList = [...spanDOMs].map((span) => span.offsetWidth); // 所有 span 的 offsetWidth
    const sumWidth = offsetWidthList.reduce((pre, acc) => acc + pre, 0);

    const _width = mainDOM.style.width;
    const _height = mainDOM.style.height;
    mainDOM.style.width = 'auto';
    mainDOM.style.height = 'auto';
    const _transform = textElementDOM.style.transform;
    textElementDOM.style.transform = '';

    /* 正常处理 */
    const rect = {
        width: mainDOM.offsetWidth,
        height: mainDOM.offsetHeight,
        /* offsetTop && offsetLeft relative to offsetParent */
        top: mainDOM.offsetTop,
        left: mainDOM.offsetLeft,
    };

    if (sumWidth > mainDOM.offsetWidth) {
        /* sumWidth 大于 mainDom 的宽度，说明有换行，使用 DOM 测量不靠谱 */
        /* improve me: 由于兼容性问题，尽量仅使用 left, top, right, 和 bottom.属性是最安全的。 */
        const rects = [...spanDOMs].map((element) => element.getBoundingClientRect());
        const { width, height } = getGroupElementVisualRect(rects);
        rect.width = width / editor.global.zoom;
        rect.height = height / editor.global.zoom;
    }

    mainDOM.style.width = _width;
    mainDOM.style.height = _height;
    textElementDOM.style.transform = _transform;
    return rect;
}
