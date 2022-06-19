import { defaults, omit, get } from 'lodash';
import { fitText, fitArrow, fitBrush, fitArrowTrunk, fitEffects } from './fit-elements';
import Promise from 'bluebird';
import utils from './utils';
import { getSvgBounds } from '@gaoding/editor-utils/svg-path';
import { isGroup } from '@gaoding/editor-utils/element';
import { parseTransform } from '@gaoding/editor-utils/transform';
import { resizeChart } from './resize-chart';

const createArrMap = (arr) => {
    return arr.reduce((obj, k) => {
        obj[k] = true;
        return obj;
    }, {});
};
const UNEQUAL_RESIZE_TYPES_MAP = createArrMap(['rect', 'ellipse', 'mosaicRect', 'mosaicEllipse']);
const IMAGE_RESIZE_TYPES_MAP = createArrMap(['mask', 'image', 'video']);

function resizeElement(element, ratio, options) {
    const { cache, deep, sync, chartDisabled } = defaults(Object.assign({}, options), {
        cache: element,
        sync: false,
        deep: true,
        chartDisabled: true,
    });

    const fn = () => {
        element.left = cache.left * ratio;
        element.top = cache.top * ratio;
        element.width = cache.width * ratio;
        element.height = cache.height * ratio;

        // padding
        if (cache.padding) {
            element.padding = cache.padding.map((val) => val * ratio);
        }

        if (cache.border && cache.border.enable) {
            element.border.width = Math.max(1, cache.border.width * ratio);
        }

        if (['text', 'effectText', 'threeText'].includes(element.type)) {
            fitText(element, cache, ratio);
            fitEffects(element, cache, ratio);

            if (!sync) {
                element.fontSize = Math.floor(cache.fontSize);
                element.contents &&
                    cache.contents.forEach((item) => {
                        item.fontSize = Math.floor(item.fontSize);
                    });
            }
            // 变形文字使用的排版宽高
            if (element.$typoWidth && element.$typoHeight) {
                element.$typoWidth = cache.$typoWidth * ratio;
                element.$typoHeight = cache.$typoHeight * ratio;
            }
        }

        if (cache.backgroundEffect && cache.backgroundEffect.enable) {
            if (element.backgroundEffect.image) {
                const cacheTransform = cache.backgroundEffect.image.transform;
                const transform = element.backgroundEffect.image.transform;

                transform.position.x = cacheTransform.position.x * ratio;
                transform.position.y = cacheTransform.position.y * ratio;
                transform.scale.x = cacheTransform.scale.x * ratio;
                transform.scale.y = cacheTransform.scale.y * ratio;
            }

            const ninePatch = element.backgroundEffect.ninePatch;
            const cacheNinePatch = cache.backgroundEffect.ninePatch;
            if (ninePatch) {
                const effectScale = cacheNinePatch.effectScale || 1;
                ninePatch.effectScale = effectScale * ratio;
            }
        }

        // imageTransform 变换调整
        if (['mask', 'image', 'video'].includes(element.type)) {
            if (element.imageTransform.localTransform) {
                element.imageTransform.position.x = cache.imageTransform.position.x * ratio;
                element.imageTransform.position.y = cache.imageTransform.position.y * ratio;
                element.imageTransform.scale.x = cache.imageTransform.scale.x * ratio;
                element.imageTransform.scale.y = cache.imageTransform.scale.y * ratio;
                fitEffects(element, cache, ratio);
            }

            if (cache.effectedResult) {
                element.effectedResult.width = cache.effectedResult.width * ratio;
                element.effectedResult.height = cache.effectedResult.height * ratio;
                element.effectedResult.left = cache.effectedResult.left * ratio;
                element.effectedResult.top = cache.effectedResult.top * ratio;
            }
        }

        // 普通水印
        if (element.type === 'watermark') {
            if (element.waterType === 1 && cache.fullScreenInfo) {
                const fullScreenInfo = element.fullScreenInfo;

                fullScreenInfo.left = cache.fullScreenInfo.left * ratio;
                fullScreenInfo.top = cache.fullScreenInfo.top * ratio;
                fullScreenInfo.colGap = cache.fullScreenInfo.colGap * ratio;
                fullScreenInfo.rowGap = cache.fullScreenInfo.rowGap * ratio;
                fullScreenInfo.leftIndent = cache.fullScreenInfo.leftIndent * ratio;

                element.left = 0;
                element.top = 0;
            }

            element.cellLeft = cache.cellLeft * ratio;
            element.cellTop = cache.cellTop * ratio;
            element.cellWidth = cache.cellWidth * ratio;
            element.cellHeight = cache.cellHeight * ratio;
            return resizeElement(element.template, ratio, omit(options, ['cache']));
        }

        if (['rect', 'ellipse', 'line'].includes(element.type)) {
            element.strokeWidth = Math.ceil(cache.strokeWidth * ratio);
            if (element.radius && cache.radius) {
                element.radius = Math.round(cache.radius * ratio);
            }
        }

        if (element.type === 'arrow') {
            fitArrow(element, cache, ratio);
        }

        if (element.type === 'brush' || element.type.includes('mosaic')) {
            if (cache.strokeWidth) {
                element.strokeWidth = cache.strokeWidth * ratio;
            }

            fitBrush(element, cache, ratio, ratio, true);
        }

        if (element.type === 'ninePatch') {
            element.effectScale = cache.effectScale * ratio;
        }

        if (element.flex && cache.flex) {
            element.flex.flexBasis = cache.flex.flexBasis * ratio;
            if (element.flex.margin) {
                element.flex.margin = cache.flex.margin.map((margin) => margin * ratio);
            }
        }

        if (isGroup(element) && deep) {
            return resizeElements(element.elements, ratio, omit(options, ['cache']));
        }

        // 水印子元素特性
        if (get(element, 'flex.margin') && get(cache, 'flex.margin')) {
            element.flex.margin = cache.flex.margin.map((v) => v * ratio);
        }

        if (get(element, 'relation.offset') && get(cache, 'relation.offset')) {
            element.relation.offset.left = cache.relation.offset.left * ratio;
            element.relation.offset.top = cache.relation.offset.top * ratio;
            element.relation.offset.width = cache.relation.offset.width * ratio;
            element.relation.offset.height = cache.relation.offset.height * ratio;
        }

        if (get(element, 'relation.defaultOffset') && get(cache, 'relation.defaultOffset')) {
            element.relation.defaultOffset.left = cache.relation.defaultOffset.left * ratio;
            element.relation.defaultOffset.top = cache.relation.defaultOffset.top * ratio;
            element.relation.defaultOffset.width = cache.relation.defaultOffset.width * ratio;
            element.relation.defaultOffset.height = cache.relation.defaultOffset.height * ratio;
        }
        if (element.type === 'table') {
            element.resizeTable(ratio);
            element.syncTableData();
        }
        if (element.type === 'chart' && !chartDisabled) {
            resizeChart(element, ratio);
        }
        if (element.type === 'path') {
            element.scaleElement(ratio);
        }
    };

    if (sync) {
        fn();
        return element;
    }

    // 比例为 1 时不进行处理
    if (ratio === 1) {
        return Promise.resolve(element);
    }

    // 例如 text fontSize 修改时内部 watch 会影响其他值的计算
    // 需要有个状态防止这种情况
    element.$resizeApi = true;

    fn();
    // 模拟 $nextTick, watch 后将数据还原
    return Promise.delay(0).then(() => {
        delete element.$resizeApi;
        return element;
    });
}

function resizeElements(elements, ratio, options) {
    if (options && options.sync) {
        return elements.map((element) => {
            return resizeElement(element, ratio, options);
        });
    }

    return Promise.all(
        elements.map((element) => {
            return resizeElement(element, ratio, options);
        }),
    );
}

function transformResize(element, drag, options) {
    const { event, dir, width: preWidth, height: preHeight, left: preLeft, top: preTop } = drag;
    let { dx = 0, dy = 0 } = drag;

    // dir
    if (dir.indexOf('w') > -1) {
        dx *= -1;
    }
    if (dir.indexOf('n') > -1) {
        dy *= -1;
    }

    let width = Number(preWidth) + dx;
    let height = Number(preHeight) + dy;

    // cache
    const widthTo = width;
    const heightTo = height;

    // limit
    let limit;
    if (element.$getResizeLimit) {
        limit = element.$getResizeLimit(drag);
        const { zoom } = this.global;
        width = Math.max(limit.minWidth / zoom, width);
        height = Math.max(limit.minHeight / zoom, height);

        width = Math.min(limit.maxWidth, width);
        height = Math.min(limit.maxHeight, height);
    }

    let minWidth = 0;
    let minHeight = 0;

    if (['line', 'arrow'].includes(element.type)) {
        if (dir.length > 1) return;
        resizeLine.call(this, element, drag);
        return;
    }

    const pathService = this.services.cache.get('path');
    if (element.type === 'path' && pathService.canEditPath(element)) {
        pathService.resize(element, drag);
        return;
    }

    if (element.type === 'effectText' || (element.type === 'text' && element.autoScale)) {
        if (dir.length === 1) {
            minWidth = element.fontSize;
            minHeight = element.fontSize * element.lineHeight;
        } else {
            minWidth = minHeight = 10;
        }
    }

    {
        // 对于元素为长方形尺寸，缩放后，对应长宽成比例
        const isCommonMinSize = minWidth <= 1 || minHeight <= 1;
        const isGroupMinSize = isGroup(element) && isCommonMinSize;
        if (isGroupMinSize || isCommonMinSize) {
            if (drag.width < drag.height) {
                minHeight = drag.height / drag.width;
            } else {
                minWidth = drag.width / drag.height;
            }
        }
    }

    const { currentLayout } = this;
    let maxWidth = options.elementMaxWidth || currentLayout.width * 2;
    let maxHeight = options.elementMaxHeight || currentLayout.height * 2;

    if (element.rotate !== 0) {
        maxWidth = Math.max(maxWidth, maxHeight);
        maxHeight = Math.max(maxWidth, maxHeight);
    }

    // 同比例缩放最大宽高的限制
    if (dir.length > 1 && !drag.noSyncRatio) {
        const maxRatio = Math.min(maxWidth / widthTo, maxHeight / heightTo);
        maxWidth = widthTo * maxRatio;
        maxHeight = heightTo * maxRatio;
    }

    width = Math.min(Math.max(1, minWidth, width), maxWidth);
    height = Math.min(Math.max(1, minHeight, height), maxHeight);

    // 超出限制后保持等比
    if (limit && dir.length > 1 && !drag.noSyncRatio) {
        if (width !== widthTo) {
            height = Math.max(limit.minHeight, (heightTo * width) / widthTo);
        }

        if (height !== heightTo) {
            width = (widthTo * height) / heightTo;
        }
    }

    // 矩形、圆形等比缩放
    // shift 按下时显示等比大小
    // shift 松开时不显示等比大小
    if (
        dir.length > 1 &&
        UNEQUAL_RESIZE_TYPES_MAP[element.type] &&
        ((event.shiftKey && !drag.shiftKeyUp) || drag.shiftKeyDown)
    ) {
        const maxSize = Math.max(width, height);
        width = maxSize;
        height = maxSize;
    }

    if (dir.includes('w') || dir.includes('e')) {
        element.width = width;
    }
    if (dir.includes('n') || dir.includes('s')) {
        element.height = height;
    }

    // Calculate Left and Top value through current Width and height
    {
        if (drag.points) {
            const points = utils.getRectPoints({
                left: preLeft,
                top: preTop,
                width: width,
                height: height,
                rotate: element.rotate,
                skewX: element.skewX,
                skewY: element.skewY,
            });

            const diagonal = {
                nw: 'se',
                ne: 'sw',
                n: 'sw',
                w: 'se',
                sw: 'ne',
                se: 'nw',
                s: 'ne',
                e: 'nw',
            }[dir];

            const newPoint = points[diagonal];
            const prePoint = drag.points[diagonal];

            element.left = preLeft - (newPoint.x - prePoint.x);
            element.top = preTop - (newPoint.y - prePoint.y);
        }

        // TODO: 待放到 transformEnd 处理
        // 可能出现断崖式的宽高修改, 导致元素不可见,
        // 不可见时将对应的 x, y 设置 0
        const maybeHidden =
            parseInt(preWidth) > currentLayout.width * 2 ||
            parseInt(preHeight) > currentLayout.height * 2;
        const xAxisVisible = element.width + element.left > 0 && element.left < currentLayout.width;
        const yAxisVisible = element.height + element.top > 0 && element.top < currentLayout.height;

        if (maybeHidden && !xAxisVisible) {
            element.left = 0;
        }

        if (maybeHidden && !yAxisVisible) {
            element.top = 0;
        }
    }

    const widthRatio = element.width / drag.width;
    const heightRatio = element.height / drag.height;

    if (element.border && dir.length > 1) {
        element.border.width = Math.max(1, drag.border.width * widthRatio);
    }

    if (dir.length > 1) {
        element.padding = drag.padding.map((padding, index) => {
            if (index === 0 || index === 2) {
                return padding * heightRatio;
            } else {
                return padding * widthRatio;
            }
        });
    }

    if (element.backgroundEffect && dir.length > 1) {
        if (element.backgroundEffect.image) {
            const transform = element.backgroundEffect.image.transform;
            const cacheTransform = drag.backgroundEffect.image.transform;

            transform.position.x = cacheTransform.position.x * widthRatio;
            transform.position.y = cacheTransform.position.y * widthRatio;
            transform.scale.x = cacheTransform.scale.x * widthRatio;
            transform.scale.y = cacheTransform.scale.y * widthRatio;
        }

        const ninePatch = element.backgroundEffect.ninePatch;
        const cacheNinePatch = drag.backgroundEffect.ninePatch;
        if (ninePatch) {
            const effectScale = cacheNinePatch.effectScale || 1;
            ninePatch.effectScale = effectScale * widthRatio;
        }
    }

    if (element.type === 'ninePatch' && dir.length > 1) {
        element.effectScale = drag.effectScale * widthRatio;
    }

    // 画笔宽高适应
    if (element.type === 'brush' || element.type.includes('mosaic')) {
        const strokeWidth = element.strokeWidth || 0;
        const preStrokeWidth = drag.strokeWidth || 0;
        fitBrush(
            element,
            drag,
            (element.width - strokeWidth) / (drag.width - preStrokeWidth),
            (element.height - strokeWidth) / (drag.height - preStrokeWidth),
        );
    }

    // 图片裁剪
    const imageTransform = drag.imageTransform;
    if (imageTransform && IMAGE_RESIZE_TYPES_MAP[element.type]) {
        if (
            dir.length === 1 &&
            options.supportAdaptiveElements.includes(element.type) &&
            element.$clipCache
        ) {
            const { $clipCache } = element;
            const ratio = Math.max(
                element.width / $clipCache.width,
                element.height / $clipCache.height,
            );

            element.imageTransform.scale.x = $clipCache.scaleX * ratio;
            element.imageTransform.scale.y = $clipCache.scaleY * ratio;
        } else {
            // 支持旋转变形后拖拉拽保持视图比例
            element.imageTransform.setFromMatrix(
                imageTransform.localTransform.clone().prepend({
                    a: widthRatio,
                    b: 0,
                    c: 0,
                    d: heightRatio,
                    tx: 0,
                    ty: 0,
                }),
            );
        }

        if (dir.length > 1) {
            fitEffects(element, drag, widthRatio);
        }
    }

    if (drag.effectedResult) {
        element.effectedResult.width = drag.effectedResult.width * widthRatio;
        element.effectedResult.left = drag.effectedResult.left * widthRatio;
        element.effectedResult.height = drag.effectedResult.height * heightRatio;
        element.effectedResult.top = drag.effectedResult.top * heightRatio;
    }

    // 裁剪框 resize 时让图片保持原位置
    if (element.imageTransform && element.type.includes('$')) {
        _keepCropInnerImagePosition(element, drag);
    }
}

export function resizeLine(element, drag) {
    const { event, dir } = drag;
    const { zoom } = this.global;

    // 基于对边的中心点做旋转
    let rotate = utils.getAngle(
        event.pageX,
        event.pageY,
        drag.rotateBaseDotX,
        drag.rotateBaseDotY,
        dir === 'w' ? 180 : 0,
    );

    // 按shift键时，旋转结果值以10度的倍数取整
    if (event.shiftKey) {
        rotate = Math.round(rotate / 10) * 10;
    }

    if (!event.ctrlKey) {
        [
            { angle: 30, edge: 2 },
            { angle: 45, edge: 3 },
        ].some((item) => {
            const angle = item.angle;
            const edge = item.edge;
            const closest = Math.round(rotate / angle) * angle;

            if (Math.abs(closest - rotate) < edge) {
                rotate = closest;
                return true;
            }

            return false;
        });
    }

    const width =
        Math.sqrt(
            Math.pow(event.pageX - drag.rotateBaseDotX, 2) +
                Math.pow(event.pageY - drag.rotateBaseDotY, 2),
        ) / zoom;

    // 基于对边的中心点做旋转偏移计算
    const newRotatePoint = drag.getLineRotationCenterPoint(
        {
            ...element,
            width,
            rotate,
            left: drag.left,
            top: drag.top,
        },
        dir,
    );

    element.width = width;
    element.rotate = rotate;
    element.left = drag.left - (newRotatePoint.x - drag.rotatePoint.x);
    element.top = drag.top - (newRotatePoint.y - drag.rotatePoint.y);

    if (element.type === 'arrow') {
        fitArrowTrunk(element);
    }
}

function _keepCropInnerImagePosition(element, drag) {
    const scale = element.transform.scale;
    let { $imageLeft: x, $imageTop: y } = drag;

    // top 此时应取 bottom
    if (scale.y < 0) {
        y = drag.height - element.$imageHeight - y;
    }
    // left 此时应取 right
    if (scale.x < 0) {
        x = drag.width - element.$imageWidth - x;
    }

    const centerPoint = utils.getPointPosition(
        {
            x: x + drag.left + element.$imageWidth / 2,
            y: y + drag.top + element.$imageHeight / 2,
        },
        {
            x: drag.left + drag.width / 2,
            y: drag.top + drag.height / 2,
        },
        element.rotate,
    );

    const imagePoint = {
        x: centerPoint.x - element.$imageWidth / 2,
        y: centerPoint.y - element.$imageHeight / 2,
    };

    const newPoint = utils.getPointPosition(
        {
            x: imagePoint.x + element.$imageWidth / 2,
            y: imagePoint.y + element.$imageHeight / 2,
        },
        {
            x: element.left + element.width / 2,
            y: element.top + element.height / 2,
        },
        -element.rotate,
    );

    x = newPoint.x - element.$imageWidth / 2 - element.left;
    y = newPoint.y - element.$imageHeight / 2 - element.top;

    // left 此时应取 right
    if (scale.x < 0) {
        x = element.width - element.$imageWidth - x;
    }

    // top 此时应取 bottom
    if (scale.y < 0) {
        y = element.height - element.$imageHeight - y;
    }

    element.$imageLeft = x;
    element.$imageTop = y;
}

function resetPathsBounding(element, apply) {
    if (!element.$paths) return;
    let [left, top, right, bottom] = getSvgBounds(element.path);
    let { $paths, strokeWidth } = element;
    strokeWidth = strokeWidth || 0;

    left -= strokeWidth / 2;
    top -= strokeWidth / 2;
    right += strokeWidth / 2;
    bottom += strokeWidth / 2;

    const rect = {
        width: right - left,
        height: bottom - top,
        left: left,
        top: top,
    };

    if (apply) {
        Object.assign(element, rect);
        element.$paths = $paths.map((path) => {
            path[1] !== undefined && (path[1] -= rect.left);
            path[2] !== undefined && (path[2] -= rect.top);
            path[3] !== undefined && (path[3] -= rect.left);
            path[4] !== undefined && (path[4] -= rect.top);
            path[5] !== undefined && (path[5] -= rect.left);
            path[6] !== undefined && (path[6] -= rect.top);

            return path;
        });
        return rect;
    } else {
        return rect;
    }
}

function resizeElementFromBackgroundImage(layout, cacheLayout, elements) {
    const {
        backgroundSize: [imageWidth, imageHeight],
        backgroundImageInfo,
    } = layout;
    const { backgroundSize } = cacheLayout;

    const cacheImageTransform = cacheLayout.backgroundImageInfo.transform.localTransform
        ? cacheLayout.backgroundImageInfo.transform
        : parseTransform(cacheLayout.backgroundImageInfo.transform);
    const imageTransform = backgroundImageInfo.transform.localTransform
        ? backgroundImageInfo.transform
        : parseTransform(backgroundImageInfo.transform);

    const elementScale = imageWidth / backgroundSize[0];

    const isScaleX = Math.round(imageTransform.scale.x) !== Math.round(cacheImageTransform.scale.x);
    const isScaleY = Math.round(imageTransform.scale.y) !== Math.round(cacheImageTransform.scale.y);

    let diffRotate =
        utils.radToDeg(imageTransform.rotation) - utils.radToDeg(cacheImageTransform.rotation);

    if (isScaleY) {
        diffRotate =
            utils.radToDeg(imageTransform.rotation) -
            utils.radToDeg(cacheImageTransform.rotation * -1);
    }

    if (isScaleX) {
        diffRotate =
            utils.radToDeg(imageTransform.rotation) -
            utils.radToDeg(cacheImageTransform.rotation * -1);
    }

    const newBgCenter = {
        x: imageTransform.position.x + imageWidth / 2,
        y: imageTransform.position.y + imageHeight / 2,
    };

    // 元素跟随背景翻转
    elements.forEach((el) => {
        el._point = {
            x: (el.left + cacheImageTransform.position.x * -1) * elementScale,
            y: (el.top + cacheImageTransform.position.y * -1) * elementScale,
        };

        if (isScaleY) {
            el.transform.scale.y *= -1;
            el.rotate *= -1;
            el._point.y = imageHeight - el._point.y - el.height * elementScale;
        }

        if (isScaleX) {
            el.transform.scale.x *= -1;
            el.rotate *= -1;
            el._point.x = imageWidth - el._point.x - el.width * elementScale;
        }
    });

    // 元素跟随背景缩放
    return resizeElements(elements, elementScale).then(() => {
        let layoutRotation = cacheImageTransform.rotation;
        if (isScaleX) {
            layoutRotation *= -1;
        }

        if (isScaleY) {
            layoutRotation *= -1;
        }

        elements.forEach((el) => {
            el.left = el._point.x - imageTransform.position.x * -1;
            el.top = el._point.y - imageTransform.position.y * -1;
            delete el._point;

            const elCenter = {
                x: el.left + el.width / 2,
                y: el.top + el.height / 2,
            };

            const point = utils.getPointPosition(
                elCenter,
                newBgCenter,
                utils.radToDeg(imageTransform.rotation) - utils.radToDeg(layoutRotation),
            );

            el.left += point.x - elCenter.x;
            el.top += point.y - elCenter.y;
            el.rotate += diffRotate;

            if (el.type === 'watermark' && el.waterType === 1 && el.fullScreenInfo) {
                el.left = 0;
                el.top = 0;
            }
        });
    });
}

// 通过拖拽信息获取元素新尺寸
function _getElementNewSizeByDragInfo(drag) {
    const { dir, width: preWidth, height: preHeight } = drag;
    let { dx = 0, dy = 0 } = drag;

    // dir
    if (dir.indexOf('w') > -1) {
        dx *= -1;
    }
    if (dir.indexOf('n') > -1) {
        dy *= -1;
    }

    const width = preWidth + dx;
    const height = preHeight + dy;
    return {
        width,
        height,
    };
}

// 在resize时更新element
export function updateElementRectAtResize(element, drag, minSize = 10) {
    const { dir, left: preLeft, top: preTop } = drag;
    const { width, height } = _getElementNewSizeByDragInfo(drag);

    if (dir.includes('w') || dir.includes('e')) {
        element.width = Math.max(width, minSize);
    }
    if (dir.includes('n') || dir.includes('s')) {
        element.height = Math.max(height, minSize);
    }

    // Calculate Left and Top value through current Width and height
    if (drag.points) {
        const points = utils.getRectPoints({
            left: preLeft,
            top: preTop,
            width: width,
            height: height,
            rotate: element.rotate,
            skewX: element.skewX,
            skewY: element.skewY,
        });

        const diagonal = {
            nw: 'se',
            ne: 'sw',
            n: 'sw',
            w: 'se',
            sw: 'ne',
            se: 'nw',
            s: 'ne',
            e: 'nw',
        }[dir];

        const newPoint = points[diagonal];
        const prePoint = drag.points[diagonal];

        element.left = preLeft - (newPoint.x - prePoint.x);
        element.top = preTop - (newPoint.y - prePoint.y);
    }

    return {
        left: element.left,
        top: element.top,
        width: element.width,
        height: element.height,
    };
}

export {
    resizeElementFromBackgroundImage,
    resetPathsBounding,
    resizeElement,
    resizeElements,
    transformResize,
};
