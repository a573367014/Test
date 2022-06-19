/**
 * utils/alignment
 */

const Alignment = {
    /* alignment */

    // 顶对齐
    alignmentTop(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.top += selectsRect.top - item.rect.top;
        });
    },

    // 垂直居中对齐
    alignmentMiddle(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.top += selectsRect.middle - item.rect.middle;
        });
    },

    // 底对齐
    alignmentBottom(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.top += selectsRect.bottom - item.rect.bottom;
        });
    },

    // 左对齐
    alignmentLeft(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.left += selectsRect.left - item.rect.left;
        });
    },

    // 水平居中对齐
    alignmentCenter(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.left += selectsRect.center - item.rect.center;
        });
    },

    // 右对齐
    alignmentRight(elementsRect, selectsRect) {
        elementsRect.forEach((item) => {
            item.element.left += selectsRect.right - item.rect.right;
        });
    },

    /* distribution */

    // 顶分布
    distributionTop(elementsRect, selectsRect) {
        elementsRect.sort((first, second) => first.rect.top - second.rect.top);

        const step = elementsRect.length - 1;
        const perHeight = (elementsRect[step].rect.top - elementsRect[0].rect.top) / step;

        elementsRect.forEach((item, index) => {
            item.element.top += selectsRect.top + index * perHeight - item.rect.top;
        });
    },

    // 垂直居中分布
    distributionMiddle(elementsRect) {
        const length = elementsRect.length;
        if (length < 3) return;

        let top = Infinity;
        let bottom = -Infinity;
        let topItem;
        let bottomItem;
        elementsRect.forEach((item) => {
            if (item.rect.top < top) {
                top = item.rect.top;
                topItem = item;
            }

            if (item.rect.bottom > bottom) {
                bottom = item.rect.bottom;
                bottomItem = item;
            }
        });

        elementsRect = elementsRect
            .filter((item) => item !== topItem && item !== bottomItem)
            .sort((a, b) => a.rect.top + a.rect.height / 2 - (b.rect.top + b.rect.height / 2));

        const minRight = topItem.rect.bottom;
        const maxLeft = bottomItem.rect.top;
        const isEq = topItem === bottomItem;

        const maxDistance = isEq ? Math.abs(maxLeft - minRight) : maxLeft - minRight;
        const height = elementsRect.reduce((w, item) => w + item.rect.height, 0);
        const isFull = isEq && maxDistance - height < 0;

        const margin = (maxDistance - height) / (elementsRect.length + 1);

        elementsRect.reduce(
            (top, item) => {
                item.element.top += top - item.rect.top;

                return top + item.rect.height + margin;
            },
            isFull
                ? topItem.rect.top
                : isEq
                ? topItem.rect.top + margin
                : topItem.rect.top + topItem.rect.height + margin,
        );
    },

    // 底分布
    distributionBottom(elementsRect) {
        elementsRect.sort((first, second) => first.rect.bottom - second.rect.bottom);

        const step = elementsRect.length - 1;
        const perHeight = (elementsRect[step].rect.bottom - elementsRect[0].rect.bottom) / step;

        elementsRect.forEach((item, index) => {
            item.element.top += elementsRect[0].rect.bottom + index * perHeight - item.rect.bottom;
        });
    },

    // 左分布
    distributionLeft(elementsRect, selectsRect) {
        elementsRect.sort((first, second) => first.rect.left - second.rect.left);

        const step = elementsRect.length - 1;
        const perWidth = (elementsRect[step].rect.left - elementsRect[0].rect.left) / step;

        elementsRect.forEach((item, index) => {
            item.element.left += selectsRect.left + index * perWidth - item.rect.left;
        });
    },

    // 水平居中分布
    distributionCenter(elementsRect) {
        const length = elementsRect.length;
        if (length < 3) return;

        let left = Infinity;
        let right = -Infinity;
        let leftItem;
        let rightItem;
        elementsRect.forEach((item) => {
            if (item.rect.left < left) {
                left = item.rect.left;
                leftItem = item;
            }

            if (item.rect.right > right) {
                right = item.rect.right;
                rightItem = item;
            }
        });

        elementsRect = elementsRect
            .filter((item) => item !== leftItem && item !== rightItem)
            .sort((a, b) => a.rect.left + a.rect.width / 2 - (b.rect.left + b.rect.width / 2));

        const minRight = leftItem.rect.right;
        const maxLeft = rightItem.rect.left;
        const isEq = leftItem === rightItem;

        const maxDistance = isEq ? Math.abs(maxLeft - minRight) : maxLeft - minRight;
        const width = elementsRect.reduce((w, item) => w + item.rect.width, 0);
        const isFull = isEq && maxDistance - width < 0;

        const margin = (maxDistance - width) / (elementsRect.length + (isFull ? -1 : 1));

        elementsRect.reduce(
            (left, item) => {
                item.element.left += left - item.rect.left;

                return left + item.rect.width + margin;
            },
            isFull
                ? leftItem.rect.left
                : isEq
                ? leftItem.rect.left + margin
                : leftItem.rect.left + leftItem.rect.width + margin,
        );
    },

    // 右分布
    distributionRight(elementsRect) {
        elementsRect.sort((first, second) => first.rect.right - second.rect.right);

        const step = elementsRect.length - 1;
        const perWidth = (elementsRect[step].rect.right - elementsRect[0].rect.right) / step;

        elementsRect.forEach((item, index) => {
            item.element.left += elementsRect[0].rect.right + index * perWidth - item.rect.right;
        });
    },
};

export default {
    alignment(direction, elements) {
        const elementsRect = elements.map((element) => {
            return {
                element: element,
                rect: this.getBBoxByElement(element),
            };
        });

        const selectsRect = elementsRect.reduce((preRect, current) => {
            const { rect } = current;

            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;
            rect.center = rect.left + rect.width / 2;
            rect.middle = rect.top + rect.height / 2;

            const top = Math.min(preRect.top, rect.top);
            const left = Math.min(preRect.left, rect.left);
            const right = Math.max(preRect.left + preRect.width, rect.right);
            const bottom = Math.max(preRect.top + preRect.height, rect.bottom);

            return {
                top: top,
                left: left,
                right: right,
                bottom: bottom,
                width: right - left,
                height: bottom - top,
                center: (left + right) / 2,
                middle: (top + bottom) / 2,
            };
        }, elementsRect[0].rect);

        // Execute alignment
        const doAlign = Alignment[direction];
        if (doAlign) {
            doAlign(elementsRect, selectsRect);
        }
    },
};
