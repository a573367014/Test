import type { IFillingImageContentType } from '../../types/effect/filling-image-content';

interface ISize {
    width: number;
    height: number;
}
/** 计算fill缩放比 */
export function calFillRatio(sourceSize: ISize, targetSize: ISize) {
    const defaultSize = { width: 0, height: 0 };
    const { width: w1, height: h1 } = sourceSize ?? defaultSize;
    const { width: w2, height: h2 } = targetSize ?? defaultSize;
    let ratio = 1;
    if (w1 > w2 && h1 > h2) {
        ratio = Math.max(w2 / w1, h2 / h1);
    } else if (w1 < w2 && h1 < h2) {
        ratio = Math.max(w2 / w1, h2 / h1);
    } else if (w1 < w2) {
        ratio = w2 / w1;
    } else if (h1 < h2) {
        ratio = h2 / h1;
    }
    return ratio;
}
/** 计算fit缩放比 */
export function calFitRatio(sourceSize: ISize, targetSize: ISize) {
    const defaultSize = { width: 0, height: 0 };
    const { width: w1, height: h1 } = sourceSize ?? defaultSize;
    const { width: w2, height: h2 } = targetSize ?? defaultSize;
    let ratio = 1;
    if (w1 > h1) {
        ratio = w2 / w1;
    } else {
        ratio = h2 / h1;
    }
    return ratio;
}

// 获取填充矩阵
export function getFillTransform(
    type: IFillingImageContentType,
    sourceSize: ISize,
    targetSize: ISize,
    option: { scaleX: number; scaleY: number },
) {
    if (type === 'fill' || type === 'fit') {
        const r =
            type === 'fill'
                ? calFillRatio(sourceSize, targetSize)
                : calFitRatio(sourceSize, targetSize);
        const tx = (targetSize.width - sourceSize.width * r) / 2;
        const ty = (targetSize.height - sourceSize.height * r) / 2;
        return [r, 0, 0, r, tx, ty];
    }
    if (type === 'crop') {
        return [
            targetSize.width / sourceSize.width,
            0,
            0,
            targetSize.height / sourceSize.height,
            0,
            0,
        ];
    }
    return [option.scaleX || 1, 0, 0, option.scaleY || 1, 0, 0];
}
