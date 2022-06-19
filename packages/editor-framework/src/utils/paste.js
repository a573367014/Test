/**
 * 调整粘贴元素位置
 */
export function adjustPasteElementPosition(element, layout) {
    if (!element || !layout) return;
    while (
        layout.elements.find(
            (elm) =>
                elm.$id !== element.$id &&
                parseInt(elm.left) === parseInt(element.left) &&
                parseInt(elm.top) === parseInt(element.top),
        )
    ) {
        element.left += 20;
        element.top += 20;
    }
}
