export function getAnimations(element) {
    const res = Array.from(element.animations);

    // 组元素没有动画才递归获取动画
    if (!res.length && element.elements) {
        element.elements.forEach((element) => {
            res.push(...getAnimations(element));
        });
    }

    return res;
}
