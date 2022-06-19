import { cloneDeep } from 'lodash';
import transformMathUtils from './transform-math';
import rectUtils from './rect';
import { getCropIntersection } from './get-crop-intersection';

function _setImageToFitRect(model) {
    const { width, height, $imageWidth, $imageHeight, $imageLeft, $imageTop, imageTransform } =
        model;

    const { max, min, abs, round } = Math;
    const { rotation } = imageTransform;
    const rotate = transformMathUtils.radToDeg(rotation);
    const isLimit = abs(rotate) % 90 < 1;

    if (!isLimit) return;

    const imageRect = {
        rotate,
        width: $imageWidth,
        height: $imageHeight,
        left: $imageLeft,
        top: $imageTop,
    };

    const bbox = rectUtils.getBBoxByElement(imageRect);
    if (bbox.width < width || bbox.height < height) {
        const rect = rectUtils.getRectCover(bbox, { width, height });
        const ratio = rect.width / bbox.width;

        model.$imageWidth *= ratio;
        model.$imageHeight *= ratio;

        if (bbox.width < width) {
            model.$imageLeft = 0;
            model.$imageTop -= (model.$imageHeight - $imageHeight) / 2;
        }
        if (bbox.height < height) {
            model.$imageTop = 0;
            model.$imageLeft -= (model.$imageWidth - $imageWidth) / 2;
        }
        return;
    }

    const dx = Math.round(imageRect.left) - round(bbox.left);
    const dy = round(imageRect.top) - round(bbox.top);

    let left = min(dx, round($imageLeft));
    left = left === dx ? dx : max(left, round(width) - round(bbox.width) + dx);

    let top = min(dy, round($imageTop));
    top = top === dy ? dy : max(top, round(height) - round(bbox.height) + dy);

    model.$imageLeft = left;
    model.$imageTop = top;

    return model;
}

export function checkFullInclude(model) {
    const { imageTransform, $imageWidth, $imageHeight } = model;

    const imageRect = {
        left: model.$imageLeft - 0.4,
        top: model.$imageTop - 0.4,
        width: $imageWidth + 0.8,
        height: $imageHeight + 0.8,
        rotate: transformMathUtils.radToDeg(imageTransform.rotation),
    };
    const cropRect = {
        left: 0,
        top: 0,
        width: model.width,
        height: model.height,
        rotate: 0,
        skewX: 0,
        skewY: 0,
    };

    const newPoint = rectUtils.getRectPoints(cropRect);

    const isLTInRect = rectUtils.pointInRect(newPoint.nw.x, newPoint.nw.y, imageRect);
    const isLBInRect = rectUtils.pointInRect(newPoint.sw.x, newPoint.sw.y, imageRect);
    const isRTInRect = rectUtils.pointInRect(newPoint.ne.x, newPoint.ne.y, imageRect);
    const isRBInRect = rectUtils.pointInRect(newPoint.se.x, newPoint.se.y, imageRect);
    const result = isLTInRect && isLBInRect && isRTInRect && isRBInRect;
    // console.log(isLTInRect, isLBInRect, isRTInRect, isRBInRect);

    return result;
}

// 适应图框
export function setImageToFitRect(model, drag, operation, baseNum = 5000) {
    if (operation !== 'rotate' && _setImageToFitRect(model)) return;

    // 已适应图框，退出递归;
    if (checkFullInclude(model)) return;

    if (operation === 'scale' || operation === 'rotate') {
        // 小数点计算异常
        baseNum = parseFloat(baseNum.toFixed(1));

        const cacheModel = {
            finalScale: drag.finalScale,
            width: model.width,
            height: model.height,
            $imageWidth: model.$imageWidth,
            $imageHeight: model.$imageHeight,
            $imageLeft: model.$imageLeft,
            $imageTop: model.$imageTop,
            imageTransform: cloneDeep(model.imageTransform),
        };

        const onePixScale = baseNum / Math.max(model.$imageWidth, model.$imageHeight);
        drag.finalScale += onePixScale;

        const _tempImageWidth = drag.width * drag.finalScale;
        const _tempImageHeight = drag.height * drag.finalScale;

        model.$imageWidth = _tempImageWidth;
        model.$imageHeight = _tempImageHeight;
        model.$imageLeft = drag.left - (_tempImageWidth - drag.width) / 2;
        model.$imageTop = drag.top - (_tempImageHeight - drag.height) / 2;

        const checkIncludeValid = checkFullInclude(model);

        if (checkIncludeValid && baseNum <= 1) {
            return;
        }

        if (!checkIncludeValid) {
            setImageToFitRect(model, drag, operation, baseNum);
        } else {
            drag.finalScale = cacheModel.finalScale;
            Object.assign(model, cacheModel);
            setImageToFitRect(model, drag, operation, baseNum / 2);
        }
    } else if (operation === 'draging') {
        const intersection = getCropIntersection(model);

        model.$imageLeft = intersection.x;
        model.$imageTop = intersection.y;
    } else {
        // 小数点计算异常
        baseNum = parseFloat(baseNum.toFixed(1));

        const cacheModel = {
            width: model.width,
            height: model.height,
            $imageWidth: model.$imageWidth,
            $imageHeight: model.$imageHeight,
            $imageLeft: model.$imageLeft,
            $imageTop: model.$imageTop,
            imageTransform: cloneDeep(model.imageTransform),
        };

        const c1 = {
            x: Math.round(model.width / 2),
            y: Math.round(model.height / 2),
        };

        const c2 = {
            x: Math.round(model.$imageLeft + model.$imageWidth / 2),
            y: Math.round(model.$imageTop + model.$imageHeight / 2),
        };

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;

        const absDx = Math.abs(c2.x - c1.x);
        const absDy = Math.abs(c2.y - c1.y);

        const xBaseNum = Math.min(absDx, baseNum);
        const yBaseNum = Math.min(absDy, baseNum);

        const xDir = dx > 0 ? -xBaseNum : xBaseNum;
        const yDir = dy > 0 ? -yBaseNum : yBaseNum;

        model.$imageLeft = model.$imageLeft + xDir;
        model.$imageTop = model.$imageTop + yDir;

        const checkIncludeValid = checkFullInclude(model);
        if (checkIncludeValid && baseNum <= 1) {
            return;
        }

        if (checkIncludeValid) {
            Object.assign(model, cacheModel);
            setImageToFitRect(model, drag, operation, Math.max(1, xBaseNum / 2, yBaseNum / 2));
        } else if (baseNum <= 1) {
            drag.left = model.$imageLeft;
            drag.top = model.$imageTop;
            setImageToFitRect(model, drag, 'scale');
            return;
        }

        setImageToFitRect(model, drag, operation, Math.max(xBaseNum, yBaseNum));
    }
}
