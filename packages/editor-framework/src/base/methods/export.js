/**
 * @class EditorExportMixin
 * @description 编辑器前端出图相关方法
 */
import Promise from 'bluebird';
import tinycolor from 'tinycolor2';

import { isFunction, cloneDeep, omit, findLastIndex, findIndex, flatten, get } from 'lodash';
import {
    resizeImageByCanvas,
    createCanvas,
    getRepeatPatternCanvas,
} from '@gaoding/editor-utils/canvas';
import VideoRenderer from '../../utils/renderer/video';
import ImageRenderer, { canUsePica } from '../../utils/renderer/image';

import utils from '../../utils/utils';
import convertSvgElementToImg from '../../utils/convert-svg';
import CanvasText from '../../utils/canvas-text';
import SvgText from '../../utils/svg-text';
import { getFrames, decodeGifOrApng, combineFrames, clipFrame } from '../../utils/gif-utils';
import { renderBackground, renderGlobalBackground } from '../../utils/background';
import BackgroundRender from '../../utils/renderer/background';

import { renderBorder } from '../../utils/border';
import { renderLayoutWatermark } from '../../utils/renderer/watermark';
import autoStretchImage from '@gaoding/editor-utils/auto-stretch-image';
import adaptBlendMode from '@gaoding/editor-utils/adapt-blend-mode';
import { isDynamicElement, isGroup } from '@gaoding/editor-utils/element';
import {
    getLayoutBackgroundImageModel,
    getLayoutBackgroundMaskModel,
} from '../../utils/layout-to-element';
import {
    getElementExpandRect,
    handlerImageEffectedResult,
} from '@gaoding/editor-utils/effect/browser/expand';
import { resetElementsByMaskInfo } from '../../static/mask-wrap/utils';

export default {
    _checkIsRenderWatermark(isRenderWatermark, layout) {
        return (
            this.options.watermarkImages.exportEnable &&
            (isRenderWatermark === undefined
                ? this.global.showWatermark ||
                  !!get(this.global, 'layout.watermarkEnable') ||
                  layout.watermarkEnable
                : isRenderWatermark)
        );
    },

    _isSupportSvgExport(elements, options) {
        options = Object.assign({ isCheckStroke: false }, options);

        let isSupport = true;
        const isWebkit = utils.isWebkit();
        const checkHasGifTemplet = (element) => {
            const layout = this.getLayoutByElement(element);
            let isGifTemplet = false;
            this.walkTemplet(
                (element) => {
                    if (element.isGif) {
                        isGifTemplet = true;
                        return false;
                    }
                },
                true,
                [layout],
            );

            return isGifTemplet;
        };

        this.walkTemplet(
            (element) => {
                // svg 元素包含 image 标签的不支持
                if (
                    element.type === 'svg' &&
                    element.$content &&
                    element.$content.indexOf('<image') > -1
                ) {
                    isSupport = false;
                }
                // text 元素，字号超出180，并且描边大于 10的不支持
                // TODO: chrome 出图的bug
                if (
                    isWebkit &&
                    options.isCheckStroke &&
                    element.type === 'text' &&
                    element.contents.find((item) => (item.fontSize || element.fontSize) > 180) &&
                    (element.textEffects || []).find(
                        (ef) => ef.stroke && ef.stroke.enable && ef.stroke.width > 5,
                    )
                ) {
                    const isGifTemplet = checkHasGifTemplet(element);
                    if (!isGifTemplet) {
                        isSupport = false;
                        return false;
                    }
                }
            },
            true,
            !elements ? this.layouts : [{ elements: elements }],
        );

        return isSupport;
    },

    _isSupportCanvasExport(elements) {
        // 是否支持前端出图
        // 不支持下划线、删除线、竖排、列表文字
        const checkTextListStyle = (element) => {
            return !(
                element.listStyle &&
                element.listStyle !== 'none' &&
                element.listStyle !== 'nomarl'
            );
        };

        const checkTextDecoration = (element) => {
            if (element.contents && element.contents.length) {
                return !element.contents.some(
                    (content) => content.textDecoration && content.textDecoration !== 'none',
                );
            }
            return !(element.textDecoration && element.textDecoration !== 'none');
        };

        const checkElement = (element) => {
            if (
                (element.writingMode && element.writingMode.includes('vertical')) ||
                !checkTextListStyle(element) ||
                !checkTextDecoration(element)
            ) {
                return false;
            }

            return true;
        };

        const checkFontMeta = () => {
            if (navigator.userAgent.includes('Mac OS')) return true;

            // 可能导致 window dom 跟 canvas 渲染差异
            const usedFontList = this.getUsedFontList([{ elements }]) || [];

            return !usedFontList.some((font) => {
                const { ascent, descent, winAscent, winDescent } = font.meta_data || {};
                return ascent !== winAscent || descent !== -winDescent;
            });
        };

        let isSupport = checkFontMeta();

        this.walkTemplet(
            (element) => {
                if (!checkElement(element)) {
                    isSupport = false;
                    return false;
                }
            },
            true,
            [{ elements: elements }],
        );

        return isSupport;
    },

    _setSvgTexts(elements) {
        // 绘制svg texts精灵图
        const intance = new SvgText(elements, this);

        return intance
            .drawTexts()
            .then((datas) => {
                if (!this.$svgTexts) {
                    this.$svgTexts = {};
                }

                datas.forEach((data) => {
                    this.$svgTexts[data.modelId] = data;
                });
            })
            .catch((err) => {
                throw new Error('_setSvgTexts -> ' + err);
            });
    },

    _needFlatten(layout) {
        let needFlatten = true;
        this.walkTemplet(
            (el) => {
                if (get(el, 'maskInfo.enable') || (isGroup(el) && el.opacity !== 1)) {
                    needFlatten = false;
                    return false;
                }
            },
            true,
            [layout],
        );

        return needFlatten;
    },

    _resetElements(layout) {
        let elements = this._restoreTempGroup(layout).filter((el) => !el.hidden);

        // 打平元素再出图会更清晰，优先打平
        if (this._needFlatten({ elements })) {
            elements = flatten(
                elements.map((elem) => {
                    if (isGroup(elem)) {
                        return this.collapseGroup(elem, true, true);
                    }
                    return elem;
                }),
            );
        } else {
            elements = resetElementsByMaskInfo(elements, {
                left: 0,
                top: 0,
                width: layout.width,
                height: layout.height,
                type: 'group',
            });
        }

        return elements.filter((el) => !el.hidden && el.width > 0.5 && el.height > 0.5);
    },

    /**
     * 根据 gif 模板渲染每一帧
     * @memberof EditorExportMixin
     * @param {layout} [layout=this.currentLayout]
     * @param {Object} [strategy={}] 自定义元素导出
     * @param {number} [timeout=10000]
     * @param {boolean} isRenderWatermark 是否添加水印
     * @param {boolean} lazy 惰性获取帧画布，节约内存(移动端)
     * @returns {Promise} Array
     */
    async renderGifLayouts(
        layout = this.currentLayout,
        strategy = {},
        timeout = 10000,
        isRenderWatermark,
        lazy = false,
    ) {
        isRenderWatermark = this._checkIsRenderWatermark(isRenderWatermark, layout);

        const isLayout = !isGroup(layout);
        const parseError = 'gif 解析失败, 图片可能存在问题';
        const props = omit(layout, 'elements');

        // 创建 layout
        const createLayout = (elements, removeBackground = false) => {
            if (removeBackground) {
                const tempLayout = { width: props.width, height: props.height };
                tempLayout.elements = elements;
                return tempLayout;
            }

            const tempLayout = cloneDeep(props);
            tempLayout.elements = elements;
            if ((props.isGif || props.isApng) && tempLayout.background) {
                tempLayout.background.image = null;
            }

            if (props.backgroundMask) {
                tempLayout.backgroundMask = null;
            }

            return tempLayout;
        };

        const exportImage = (layout, _isRenderWatermark, isRenderGlobalBg = true) => {
            const isUseSvg = !this._isSupportCanvasExport(layout.elements);
            return this.exportImage(
                layout,
                strategy,
                timeout,
                isLayout && _isRenderWatermark,
                isUseSvg,
                isLayout && isRenderGlobalBg,
            );
        };

        const getLayoutElements = async (layout) => {
            // 组元素解除组合
            const elements = this._resetElements(layout);

            // 支持背景 gif 导出，转成图片元素
            if (layout?.background?.image && (layout.isGif || layout.isApng)) {
                const imageModel = getLayoutBackgroundImageModel(layout);
                elements.unshift(imageModel);
            }

            const imageModel = await getLayoutBackgroundMaskModel(this, layout);
            imageModel && elements.unshift(imageModel);

            return elements;
        };

        const findGif = (element) => {
            let hasGif = false;

            if (!isGroup(element)) {
                hasGif = isDynamicElement(element);
            } else {
                this.walkTemplet(
                    (element) => {
                        if (isDynamicElement(element)) {
                            hasGif = true;
                            return false;
                        }
                    },
                    true,
                    [element],
                );
            }

            return hasGif;
        };

        // try {
        const layouts = [];
        const elements = await getLayoutElements(layout);

        // 走 svg 出图需预加载 svg 精灵图
        if (isLayout && !this._isSupportCanvasExport(elements)) {
            await this._setSvgTexts(elements);
        }

        // 遇到 gif 图单独出来
        // 找到 gif 图层和中间的图层合并
        const firstGifIndex = findIndex(elements, findGif);
        const lastGifIndex = findLastIndex(elements, findGif);

        // 存在 gif 图
        if (firstGifIndex !== -1 && lastGifIndex !== -1) {
            const firstLayout = createLayout(elements.slice(0, firstGifIndex));
            const gifLayout = createLayout(elements.slice(firstGifIndex, lastGifIndex + 1), true);
            const lastLayout = createLayout(
                elements.slice(lastGifIndex + 1, elements.length),
                true,
            );

            layouts.push(firstLayout, gifLayout, lastLayout);
        } else {
            layouts.push(layout);
        }

        if (layouts.length === 1) {
            return exportImage(layouts[0], isRenderWatermark).then((canvas) => {
                return [
                    {
                        delay: 100,
                        canvas,
                    },
                ];
            });
        }

        // 计算组元素实际包围盒，包含内部子元素扩展区域，如文字阴影、图片特效
        const layoutBBox = !isLayout
            ? await getElementExpandRect(layout)
            : { ...layout, left: 0, top: 0 };
        const layoutWidth = Math.round(layoutBBox.width);
        const layoutHeight = Math.round(layoutBBox.height);

        const [firstCanvas, lastCanvas] = await Promise.all([
            exportImage(layouts[0], false),
            exportImage(layouts[2], false, false),
        ]).then(([firstCanvas, lastCanvas]) => {
            // layout 若为组，出图会按真实的 BBox 出图
            // 所以 firstCanvas、lastCanvas 通常设置了 offsetX、offsetY 属性
            firstCanvas.offsetX = firstCanvas.offsetX || 0;
            firstCanvas.offsetY = firstCanvas.offsetY || 0;

            lastCanvas.offsetX = lastCanvas.offsetX || 0;
            lastCanvas.offsetY = lastCanvas.offsetY || 0;

            return [firstCanvas, lastCanvas];
        });

        const gifLayout = layouts[1];
        const gifElements = gifLayout.elements;

        // 缓存动图解码结果
        let decodeCache = {};
        const elementCanvasList = await Promise.mapSeries(gifElements, (element) => {
            if (get(element, 'maskInfo.enable') && !get(element, 'maskInfo.showSelf')) {
                return null;
            }

            if (isDynamicElement(element)) {
                return getFrames(element, {
                    canvasWidth: layoutWidth,
                    canvasHeight: layoutHeight,
                    decode: async () => {
                        if (decodeCache[element.url]) return decodeCache[element.url];
                        return decodeGifOrApng(element, { needBuffer: true }).then((frames) => {
                            decodeCache[element.url] = frames;
                            return frames;
                        });
                    },
                    lazy,
                }).catch(() => {
                    throw new Error(parseError);
                });
            } else if (isGroup(element)) {
                return this.renderGifLayouts(element, strategy, timeout, isRenderWatermark, lazy);
            }

            return this.elementToCanvas(element);
        });
        decodeCache = null;

        // [[1, 2, 3], [1, 3, 5]] => [[1, 1], [2, 3], [3, 5]]
        const framesList = combineFrames(elementCanvasList, {
            canvasWidth: layoutWidth,
            canvasHeight: layoutHeight,
        }).map((item) => {
            if (Array.isArray(item)) return item;
            return [{ canvas: item, delay: 30 }];
        });

        const watermarkImage = await utils.loadImage(this.options.watermarkImages.element);
        let maskInfoElement;
        let maskInfoImage;

        if (layout.$exportType === 'maskInfoGroup') {
            maskInfoElement = layout.$maskElement;
            maskInfoImage = await this.elementToCanvas(maskInfoElement, strategy);
        }

        return Promise.mapSeries(framesList, async (frames) => {
            let lazyFn = async () => {
                const frameCanvas = createCanvas(layoutWidth, layoutHeight);
                const frameCtx = frameCanvas.getContext('2d');

                frameCtx.translate(-layoutBBox.left, -layoutBBox.top);
                frameCtx.drawImage(firstCanvas, -firstCanvas.offsetX, -firstCanvas.offsetY);

                await Promise.mapSeries(frames, (elementData, index) => {
                    const curElement = gifElements[index];

                    return this.applyElementPropsToCanvas(
                        curElement,
                        elementData,
                        frameCanvas,
                        watermarkImage,
                    );
                });
                frameCtx.drawImage(lastCanvas, -lastCanvas.offsetX, -lastCanvas.offsetY);

                // group 绘制完成后再按 destination-in 绘制 maskInfo
                if (maskInfoElement) {
                    const tempCanvas = createCanvas(frameCanvas.width, frameCanvas.height);
                    await this.applyElementPropsToCanvas(
                        maskInfoElement,
                        maskInfoImage,
                        tempCanvas,
                    );

                    frameCtx.globalCompositeOperation = 'destination-in';
                    frameCtx.drawImage(tempCanvas, 0, 0);
                    frameCtx.globalCompositeOperation = 'source-over';
                }

                if (isRenderWatermark && isLayout) {
                    return renderLayoutWatermark(layout, frameCtx, this.options).then(() => {
                        return frameCanvas;
                    });
                } else {
                    return frameCanvas;
                }
            };

            if (!lazy) {
                lazyFn = await lazyFn();
            }

            return {
                offsetX: -layoutBBox.left,
                offsetY: -layoutBBox.top,
                delay: frames[0].delay,
                canvas: lazyFn,
            };
        });
        // }
        // catch(err) {
        //     console.log('不支持前端 gif 出图', err);
        //     throw new Error('renderGifLayouts -> ' + err);
        // };
    },

    /**
     * 将元素 canvas 绘制到画布上
     * @memberof EditorExportMixin
     * @param {element} element 元素
     * @param {Object} elementData 元素数据 | HTMLCanvasElement
     * @param {Object} [elementData.canvas] - HTMLCanvasElement | Function
     * @param {Object} [elementData.pivot] - { x, y } transform 原点
     * @param {Number} [elementData.offsetX] - 额外的偏移
     * @param {Number} [elementData.offsetX] - 额外的偏移
     * @param {Number} [elementData.elementRealWidth] - 元素绘制真实宽度
     * @param {Number} [elementData.elementRealHeight] - 元素绘制真实高度
     * @param {Canvas} canvas 需要绘制的画布
     */
    async applyElementPropsToCanvas(element, elementData, canvas, watermarkImg) {
        const ctx = canvas.getContext('2d');
        let image = elementData.canvas || elementData;
        image = isFunction(image) ? await image() : image;

        if (!image.width || !image.height || image.width < 1 || image.height < 1) return;

        const {
            left,
            top,
            transform,
            width,
            height,
            opacity,
            border,
            backgroundColor,
            backgroundEffect,
            watermarkEnable,
            blendMode,
        } = element;

        const offsetX = Math.ceil(get(elementData, 'offsetX', 0));
        const offsetY = Math.ceil(get(elementData, 'offsetY', 0));

        const pivot = {
            x: Math.ceil(get(elementData, 'pivot.x', left + width / 2)),
            y: Math.ceil(get(elementData, 'pivot.y', top + height / 2)),
        };

        const drawByCanvas = (canvasImage) => {
            ctx.drawImage(
                canvasImage,
                Math.round(left),
                Math.round(top),
                Math.round(width),
                Math.round(height),
            );
        };

        ctx.save();
        ctx.globalAlpha = opacity;

        if (transform) {
            ctx.translate(pivot.x, pivot.y);
            ctx.transform(...transform.toArray().slice(0, 4), 0, 0);
            ctx.translate(-pivot.x, -pivot.y);
        }

        const elementWidth = get(elementData, 'elementRealWidth', image.width);
        const elementHeight = get(elementData, 'elementRealHeight', image.height);

        // 背景绘制
        if ((backgroundEffect && backgroundEffect.enable) || backgroundColor) {
            const bgCanvas = await new BackgroundRender({
                editor: this,
                element: element,
            }).render();
            drawByCanvas(bgCanvas);
        }

        // 边框绘制
        if (border && border.enable) {
            const bdCanvas = createCanvas(width, height);
            await renderBorder(element, bdCanvas.getContext('2d'));
            drawByCanvas(bdCanvas);
        }

        ctx.save();
        // 设置 globalCompositeOperation 还原元素的 blendMode 效果
        const compositeOperation = adaptBlendMode(blendMode);
        if (compositeOperation && compositeOperation !== 'normal' && this.options.blendModeEnable) {
            ctx.globalCompositeOperation = compositeOperation;
        }

        ctx.drawImage(
            image,
            Math.round(left - offsetX),
            Math.round(top - offsetY),
            Math.round(elementWidth),
            Math.round(elementHeight),
        );
        // 还原 ctx.globalCompositeOperation
        ctx.restore();

        // 水印绘制
        if (watermarkImg && watermarkEnable && this.options.watermarkImages.exportEnable) {
            const { width, height } = element;
            const patternCanvas = getRepeatPatternCanvas(watermarkImg, {
                width: element.width,
                height: element.height,
                ratio: 2,
            });
            ctx.drawImage(
                patternCanvas,
                Math.round(left),
                Math.round(top),
                Math.round(width),
                Math.round(height),
            );
        }
        ctx.restore();
    },

    /**
     * 将元素转 canvas 包含 transform、opacity 等
     * @param {*} element 元素 model
     * @param {*} strategy 渲染策略
     * @returns {Promise} Object
     */
    async elementFullStatusToCanvas(element, strategy = {}) {
        //  element = this.currentElement || this.currentLayout.elements[0];

        // 文字优先 canvas 出图
        if (!this._isSupportCanvasExport([element])) {
            await this._setSvgTexts([element]);
        }

        const imageStrategry = async (element) => {
            const renderer = new ImageRenderer({
                model: element,
                editor: this,
                emitEventEnable: false,
            });
            renderer.render();
            const canvas = await renderer.export();

            return handlerImageEffectedResult(element, canvas);
        };

        const canvasData = await this.elementToCanvas(element, {
            image: imageStrategry,
            mask: imageStrategry,
            ...strategy,
        });

        const image = canvasData.canvas || canvasData;
        const offsetX = get(canvasData, 'offsetX', 0);
        const offsetY = get(canvasData, 'offsetY', 0);
        const elementRealWidth = get(canvasData, 'elementRealWidth', image.width);
        const elementRealHeight = get(canvasData, 'elementRealHeight', image.height);

        const rect = {
            width: elementRealWidth,
            height: elementRealHeight,
            left: element.left - offsetX,
            top: element.top - offsetY,
        };

        const canvas = createCanvas(Math.round(rect.width), Math.round(rect.height));

        const ctx = canvas.getContext('2d');
        ctx.translate(-rect.left, -rect.top);

        await this.applyElementPropsToCanvas(
            {
                ...element,
                transform: null,
            },
            canvasData,
            canvas,
        );

        return {
            canvas,
            effectedResult: {
                width: canvas.width,
                height: canvas.height,
                left: rect.left - element.left,
                top: rect.top - element.top,
            },
        };
    },

    /**
     * 将元素转 canvas 没有平移斜切 transform 等
     * @param {*} element 元素 model
     * @param {*} strategy 渲染策略
     * @returns {Promise} HTMLCanvasElement|Object
     */
    elementToCanvas(element, strategy) {
        const self = this;
        const { type, $id, hidden, effectedResult } = element;

        if (hidden) {
            // 隐藏的元素渲染一个透明的 canvas;
            const canvas = createCanvas(element.width, element.height);
            return Promise.resolve(canvas);
        }

        // 解组出图，此时的子 model 为副本 $loaded 状态可能不会更新
        const originElement = this.getElement($id, { deep: true, layouts: this.layouts });
        const checkLoaded = async (element, component) => {
            if (originElement.$loaded || get(component, 'model.$loaded')) {
                // 需要渲染时间
                return this.$nextTick();
            }

            return Promise.delay(50).then(() => {
                return checkLoaded(element, component);
            });
        };
        const reloadImage = async (image) => {
            try {
                // 避免浏览器关闭缓存后，checkLoaded 不准确
                if (image instanceof HTMLImageElement) {
                    image = await utils.loadImage(image.src);
                }
                return image;
            } catch (e) {
                return image;
            }
        };
        const svgToCanvas = (element, component) => {
            return checkLoaded(element, component).then(() => {
                const el = component.$el;
                const svgElement = el.querySelector('svg');
                if (svgElement) {
                    if (svgElement.querySelector('title')) {
                        svgElement.removeChild(svgElement.querySelector('title'));
                    }

                    return convertSvgElementToImg(svgElement);
                }
            });
        };

        const renderStrategy = Object.assign(
            {},
            {
                group(element) {
                    return self.elementsToCanvas(element, strategy, element.watermarkEnable);
                },
                flex(element) {
                    return self.elementsToCanvas(element, strategy, element.watermarkEnable);
                },
                text(element, component) {
                    if (self.$svgTexts && self.$svgTexts[element.$id]) {
                        const data = self.$svgTexts[element.$id];
                        delete self.$svgTexts[element.$id];

                        return data;
                    } else {
                        return checkLoaded(element, component).then(() => {
                            const el = component.$el;
                            // 取没有特效的那一层
                            const node = el.querySelector('.element-main');
                            const instance = new CanvasText(element, self, node);
                            const data = instance.drawText(self.global.zoom);

                            return data;
                        });
                    }
                },
                image(element, component) {
                    const el = component.$el;
                    return checkLoaded(element, component)
                        .then(async () => {
                            let image = el.querySelector('img, canvas');

                            image = await reloadImage(image);
                            const { imageUrl, hasEffects, hasFilters } = element;

                            const isCanvas = image.nodeName.toLowerCase() === 'canvas';

                            if (imageUrl && (hasEffects || hasFilters)) {
                                return image;
                            }

                            return Promise.try(async () => {
                                if (!isCanvas) {
                                    // TODO: 图片元素在出图可能有 mask 内容导致出图失败，暂时在这移除图片元素的 mask
                                    element.mask = '';

                                    if (canUsePica(self.options, element)) {
                                        image = await resizeImageByCanvas(
                                            image,
                                            element.$imageWidth,
                                            element.$imageHeight,
                                            self.options.picaResizeOptions,
                                            true,
                                        );
                                    }

                                    return clipFrame(element, image);
                                }

                                return image;
                            });
                        })
                        .then((image) => {
                            return handlerImageEffectedResult(element, image);
                        });
                },
                mask(element, component) {
                    return checkLoaded(element, component)
                        .then(() => {
                            const el = component.$el;
                            const image = el.querySelector('img, canvas');
                            const isImageNode = image instanceof HTMLImageElement;

                            if (isImageNode && (element.isGif || element.isApng)) {
                                return utils
                                    .loadImage(element.url)
                                    .then((image) => clipFrame(element, image));
                            } else if (isImageNode) {
                                return utils.loadImage(element.imageUrl);
                            }
                            return image;
                        })
                        .then((image) => {
                            return handlerImageEffectedResult(element, image);
                        });
                },
                video(element) {
                    const renderer = new VideoRenderer({ model: element, editor: self });
                    renderer.render();
                    return renderer.export();
                },
                threeText(element, component) {
                    return checkLoaded(element, component).then(async () => {
                        let { img } = component.$refs;
                        if (img) {
                            img = await reloadImage(img);
                            return resizeImageByCanvas(
                                img,
                                element.width,
                                element.height,
                                self.options.picaResizeOptions,
                                false,
                            );
                        }
                        while (component.isRendering) {
                            await Promise.delay(10);
                        }
                        const canvas = await self.getThreeTextCanvas(element);
                        return canvas;
                    });
                },
                effectText(element, component) {
                    return checkLoaded(element, component).then(async () => {
                        const { img, canvas } = component.$refs;
                        // 如果当前为canvas状态，可能还没有渲染完成
                        while (component.isRendering) {
                            await Promise.delay(10);
                        }
                        let sourceData = img || canvas;
                        sourceData = await reloadImage(sourceData);
                        return resizeImageByCanvas(
                            sourceData,
                            element.width,
                            element.height,
                            self.options.picaResizeOptions,
                            false,
                        );
                    });
                },
                styledText(element, component) {
                    return checkLoaded(element, component)
                        .then(() => {
                            return new Promise((resolve) => {
                                const image = document.createElement('img');
                                image.setAttribute('crossorigin', 'anonymous');
                                image.onload = () => {
                                    resolve(image);
                                };
                                image.src = component.model.image.url;
                            });
                        })
                        .then((image) => {
                            const offScreenCanvas = document.createElement('canvas');
                            offScreenCanvas.width = element.width;
                            offScreenCanvas.height = element.height;
                            const offctx = offScreenCanvas.getContext('2d');
                            const sx = Math.abs(component.model.image.offset.x);
                            const sy = Math.abs(component.model.image.offset.y);
                            const sw = offScreenCanvas.width;
                            const sh = offScreenCanvas.height;
                            offctx.drawImage(
                                image,
                                sx,
                                sy,
                                sw,
                                sh,
                                0,
                                0,
                                offScreenCanvas.width,
                                offScreenCanvas.height,
                            );

                            return offScreenCanvas;
                        });
                },
                ninePatch(element, component) {
                    return checkLoaded(element, component).then(async () => {
                        return utils.loadImage(element.url).then((image) => {
                            const { width, height, imageSlice, effectScale } = element;
                            return autoStretchImage(image, {
                                targetWidth: Math.round(width),
                                targetHeight: Math.round(height),
                                imageSlice,
                                targetImageSlice: {
                                    left: imageSlice.left * effectScale,
                                    top: imageSlice.top * effectScale,
                                    right: imageSlice.right * effectScale,
                                    bottom: imageSlice.bottom * effectScale,
                                },
                            });
                        });
                    });
                },
                table(element) {
                    return element.renderImage(self);
                },
                chart(element, component) {
                    // chart 动画需要走 400毫秒
                    return Promise.delay(400).then(() =>
                        checkLoaded(element, component).then(() => {
                            // 获取图表的canvas
                            if (component && component.$chartRender) {
                                return component.getCanvas();
                            }
                            return null;
                        }),
                    );
                },
                watermark(element, component) {
                    return checkLoaded(element).then(() => {
                        if (element.waterType === 0) {
                            return self.elementToCanvas(element.template, strategy);
                        } else {
                            const { imageUrl } = element;
                            // 当 renderInCanvas 为 true 时说明当前的全屏水印已渲染在 canvas 上
                            if (component.renderInCanvas) {
                                return element.renderFullScreen(this);
                            } else {
                                return utils.loadImage(imageUrl);
                            }
                        }
                    });
                },
                arrow: async (element, component) => {
                    await checkLoaded(element);
                    const svgs = [
                        {
                            svg: component.$refs.trunk,
                            data: {
                                ...element.trunk,
                                width: element.$trunkWidth,
                            },
                        },
                        {
                            svg: component.$refs.tail,
                            data: element.tail,
                        },
                        {
                            svg: component.$refs.head,
                            data: {
                                ...element.head,
                                left: element.$headLeft,
                            },
                        },
                    ].filter((item) => item.svg);

                    const canvas = createCanvas(element.width, element.height);
                    const ctx = canvas.getContext('2d');
                    return Promise.map(svgs, ({ data, svg }) => {
                        return convertSvgElementToImg(svg).then((canvas) => {
                            const scale = element.$minScale * element.$originalScale;

                            ctx.drawImage(
                                canvas,
                                data.left * scale,
                                data.top * scale,
                                data.width * scale,
                                data.height * scale,
                            );
                        });
                    }).then(() => {
                        return canvas;
                    });
                },
                svg: svgToCanvas,
                line: svgToCanvas,
                rect: svgToCanvas,
                ellipse: svgToCanvas,
                brush: svgToCanvas,
                async path(element) {
                    const exportRes = await self.services.cache.get('path').export(element);
                    return exportRes || this.common(element);
                },
                common: (element) => {
                    return utils
                        .loadImage(element.imageUrl)
                        .then((image) => {
                            if (effectedResult && effectedResult.width && effectedResult.height) {
                                return {
                                    canvas: image,
                                    offsetX: -effectedResult.left,
                                    offsetY: -effectedResult.top,
                                    elementRealWidth: effectedResult.width,
                                    elementRealHeight: effectedResult.height,
                                };
                            }

                            return {
                                canvas: image,
                                offsetX: 0,
                                offsetY: 0,
                                elementRealWidth: element.width,
                                elementRealHeight: element.height,
                            };
                        })
                        .catch(() => null);
                },
            },
            strategy,
        );

        const isCommon = !this.supportTypesMap[element.type];
        const getComponentById = (id) => {
            // 编辑模式下获取 component
            let component = this.getComponentById(id);
            if (!component) {
                // 从preview layout获取元素
                const el = document.querySelector(`.editor-element[data-id="${id}"]`);
                component = el && el.__vue__;
            }
            return component;
        };
        return Promise.try(() =>
            renderStrategy[isCommon ? 'common' : type](element, getComponentById($id)),
        );
    },

    /**
     * elements 渲染到 canvas
     * @memberof EditorExportMixin
     * @param {*} element 元素，[layout, group]
     * @param {*} strategy 渲染策略
     * @param {boolean} isRenderWatermark 是否添加水印
     * @returns {Promise} HTMLCanvasElement
     */
    async elementsToCanvas(
        layout = this.currentLayout,
        strategy,
        isRenderWatermark,
        isRenderGlobalBg = false,
    ) {
        isRenderWatermark = this._checkIsRenderWatermark(isRenderWatermark, layout);
        const elements = this._resetElements(layout);
        const isLayout = !isGroup(layout);

        let {
            left: offsetX,
            top: offsetY,
            width: canvasWidth,
            height: canvasHeight,
        } = !isLayout ? getElementExpandRect(layout) : { ...layout, left: 0, top: 0 };

        offsetX *= -1;
        offsetY *= -1;

        if (!Array.isArray(elements)) throw Error('elements must be array');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.round(canvasWidth);
        canvas.height = Math.round(canvasHeight);

        if (isLayout) {
            // 全局背景图片
            if (isRenderGlobalBg) {
                await renderGlobalBackground({
                    editor: this,
                    layout: layout,
                    ctx,
                    options: this.options,
                });
            }

            // 渲染画布背景
            await renderBackground({
                editor: this,
                [!isLayout ? 'element' : 'layout']: layout,
                ctx,
                options: this.options,
            });

            // 渲染边框
            await renderBorder(layout, ctx, this.options);
        }

        // 绘制子元素
        const watermarkImage = await utils.loadImage(this.options.watermarkImages.element);
        const imageList = await Promise.map(elements, (element) =>
            this.elementToCanvas(element, strategy),
        );

        !isLayout && canvas.getContext('2d').translate(offsetX, offsetY);
        await Promise.mapSeries(imageList, async (data, index) => {
            if (!data) return;
            const element = elements[index];

            // group 绘制完成后再按 destination-in 绘制 maskInfo
            if (element.$exportType === 'maskInfoGroup') {
                const maskInfoImage = imageList[element.$maskElementIndex];
                const maskInfoElement = elements[element.$maskElementIndex];

                const groupCanvas = data.canvas || data;
                const groupCtx = groupCanvas.getContext('2d');
                const tempGroupCanvas = createCanvas(groupCanvas.width, groupCanvas.height);

                await this.applyElementPropsToCanvas(
                    maskInfoElement,
                    maskInfoImage,
                    tempGroupCanvas,
                );

                groupCtx.globalCompositeOperation = 'destination-in';
                groupCtx.drawImage(tempGroupCanvas, 0, 0);
                groupCtx.globalCompositeOperation = 'source-over';
            }

            if (get(element, 'maskInfo.enable') && !get(element, 'maskInfo.showSelf')) {
                return null;
            }

            return this.applyElementPropsToCanvas(element, data, canvas, watermarkImage).catch(
                console.error,
            );
        });

        // 绘制水印
        if (isRenderWatermark && isLayout) {
            await renderLayoutWatermark(layout, ctx, this.options);
        }

        canvas.offsetX = offsetX;
        canvas.offsetY = offsetY;
        return canvas;
    },

    /**
     * 导出图片
     * @param {object} layout 默认当前 currentLayout
     * @param {object} strategy 扩展渲染策略
     * @param {number} timeout 超时限制
     * @param {boolean} isRenderWatermark 是否添加水印
     * @param {boolean} isUseSvgExport 使用SVG导出文本
     * @return {Promise} HTMLCanvasElement
     * @memberof EditorExportMixin
     */
    exportImage(
        layout = this.currentLayout,
        strategy = {},
        timeout = 10000,
        isRenderWatermark,
        isUseSvgExport,
        isRenderGlobalBg = true,
    ) {
        isRenderWatermark = this._checkIsRenderWatermark(isRenderWatermark, layout);

        if (!this.options.exportable) return Promise.resolve(null);
        if (!layout) throw new Error('需要传入 layout');

        const elements = layout.elements || [];

        return Promise.try(() => {
            if (isUseSvgExport) {
                if (!this._isSupportSvgExport(elements)) {
                    throw new Error('svg 非法含有图片');
                }
                return this._setSvgTexts(elements).then(() => {
                    return this.elementsToCanvas(
                        layout,
                        strategy,
                        isRenderWatermark,
                        isRenderGlobalBg,
                    );
                });
            }

            if (!this._isSupportCanvasExport(elements)) {
                throw new Error('不支持前端出图');
            }

            return this.elementsToCanvas(layout, strategy, isRenderWatermark, isRenderGlobalBg);
        }).timeout(timeout, '加载超时 ' + timeout);
    },

    /**
     * 导出 gif 图片
     *
     * @param {array} frames 帧集合
     * @param {object} opt { width, height, layout, quality, timeout, delay, ratio }
     * @memberof EditorExportMixin
     * @returns {Promise} Blob
     */
    async exportGif(frames = [], opt = {}) {
        const layout = opt.layout || this.currentLayout;
        const {
            width = layout.width,
            height = layout.height,
            quality = 1,
            timeout = 100000,
            ratio = 1,
            needCleanupCanvasMemory = false,
        } = opt;
        const rWidth = Math.round(ratio * width);
        const rHeight = Math.round(ratio * height);
        const { exportGif } = await import(
            /* webpackChunkName: "editor-utils-export" */ '@gaoding/editor-utils/export'
        );

        return Promise.try(() => {
            const disabledTransparent = tinycolor(layout.background.color).getAlpha() > 0.5;
            const delays = frames.map((item) => item.delay);
            frames = frames.map((item) => item.canvas);

            return exportGif({
                quality,
                frames,
                delays,
                width: rWidth,
                height: rHeight,
                disabledTransparent,
                needCleanupCanvasMemory,
            });
        })
            .timeout(timeout, '合成超时')
            .catch((err) => {
                console.log('导出 gif 图片失败', err);
                throw new Error('exportGif -> ' + err);
            });
    },
};
