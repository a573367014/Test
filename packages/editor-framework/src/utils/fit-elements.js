const fitFontSize = (fontSize, ratio) => {
    fontSize = fontSize * ratio;
    if (fontSize % 1 !== 0) {
        fontSize = Math.floor(fontSize * 10) / 10;
    }

    return fontSize;
};

const fitText = (textElement, cache, ratio) => {
    textElement.letterSpacing = cache.letterSpacing * ratio;
    textElement.fontSize = fitFontSize(cache.fontSize, ratio);
    if (textElement.contents) {
        textElement.contents = textElement.contents.map((item, i) => {
            return {
                ...item,
                fontSize: fitFontSize(cache.contents[i].fontSize || cache.fontSize, ratio),
            };
        });
    }
};

const fitBrush = (element, cache, widthRatio = 1, heightRatio = 1, sync = false) => {
    const strokeWidth = element.strokeWidth || 0;
    let widthStrokeR = widthRatio !== 1 ? strokeWidth / 2 : 0;
    let heightStrokeR = heightRatio !== 1 ? strokeWidth / 2 : 0;

    // 完全等比缩放
    if (sync) {
        widthStrokeR = 0;
        heightStrokeR = 0;
    }

    if (widthRatio && heightRatio) {
        element.$paths = cache.$paths.map((path) => {
            const newPath = [path[0]];
            // 避免过多小数点，导致存储量增加
            path[1] !== undefined &&
                (newPath[1] = widthStrokeR + (path[1] - widthStrokeR) * widthRatio);
            path[2] !== undefined &&
                (newPath[2] = heightStrokeR + (path[2] - heightStrokeR) * heightRatio);
            path[3] !== undefined &&
                (newPath[3] = widthStrokeR + (path[3] - widthStrokeR) * widthRatio);
            path[4] !== undefined &&
                (newPath[4] = heightStrokeR + (path[4] - heightStrokeR) * heightRatio);
            path[5] !== undefined &&
                (newPath[5] = widthStrokeR + (path[5] - widthStrokeR) * widthRatio);
            path[6] !== undefined &&
                (newPath[6] = heightStrokeR + (path[6] - heightStrokeR) * heightRatio);
            return newPath;
        });
    }
};

// 缩放箭头元素整体比例
const fitArrow = (element, cache, ratio) => {
    element.$originalScale = parseFloat((cache.$originalScale * ratio).toFixed(2));
    fitArrowTrunk(element);
};

// 已知元素宽度，适配箭头三个部位的大小
const fitArrowTrunk = (element) => {
    const $originalScale = element.$originalScale || 1;

    const minWidth = element.minWidth;
    const modelWidth = element.width / $originalScale;

    element.$minScale = Math.min(1, modelWidth / minWidth);

    const height = Math.max(
        element.head.height + element.head.top,
        element.tail.height + element.tail.top,
        element.trunk.height + element.trunk.top,
    );
    element.height = height * element.$minScale * $originalScale;
};

// 等比缩放特效
const fitEffects = (element, cache, ratio) => {
    const effects = (/text/i.test(element.type) ? element.textEffects : element.imageEffects) || [];
    const cacheEffects = cache.textEffects || cache.imageEffects || [];
    const cacheShadows = cache.shadows || [];

    effects.forEach((effect, i) => {
        const { offset, stroke, insetShadow, filling, expand } = effect;
        const cacheEffect = cacheEffects[i];
        if (!cacheEffect) return;

        if (offset) {
            offset.x = cacheEffect.offset.x * ratio;
            offset.y = cacheEffect.offset.y * ratio;
        }

        if (stroke) {
            stroke.width = cacheEffect.stroke.width * ratio;
        }
        if (insetShadow) {
            insetShadow.offsetX = cacheEffect.insetShadow.offsetX * ratio;
            insetShadow.offsetY = cacheEffect.insetShadow.offsetY * ratio;
        }
        if (expand) {
            expand.offset.left = cacheEffect.expand.offset.left * ratio;
            expand.offset.right = cacheEffect.expand.offset.right * ratio;
            expand.offset.top = cacheEffect.expand.offset.top * ratio;
            expand.offset.bottom = cacheEffect.expand.offset.bottom * ratio;
        }
        if (filling && (filling.type === 1 || filling.type === 'image')) {
            const { scaleX, scaleY } = cacheEffect.filling.imageContent;
            filling.imageContent.scaleX = Math.max(1e-2, scaleX * ratio) || 1;
            filling.imageContent.scaleY = Math.max(1e-2, scaleY * ratio) || 1;
        }
    });

    (element.shadows || []).forEach((shadow, i) => {
        const cacheShadow = cacheShadows[i];

        shadow.offsetX = cacheShadow.offsetX * ratio;
        shadow.offsetY = cacheShadow.offsetY * ratio;

        if (!shadow.type || shadow.type === 'base') {
            shadow.blur = cacheShadow.blur * ratio;
        } else {
            (shadow.advancedBlur?.blurs || []).forEach((blur, i) => {
                blur.value = cacheShadow.advancedBlur.blurs[i].value * ratio;
            });
        }
    });
};

export { fitEffects, fitText, fitFontSize, fitBrush, fitArrow, fitArrowTrunk };
