/**
 * TextElement
 */

import { uniq, split } from 'lodash';
import loader from '@gaoding/editor-utils/loader';
import Matrix from '@gaoding/editor-utils/matrix';
import Transform from '@gaoding/editor-utils/transform';
import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';

import TextBase from '../text/text-base';
import template from './styled-text-element.html';
import { isGroup } from '@gaoding/editor-utils/element';

// 暂时不考虑限制 cache 数量
const renderCache = new Map();
const RENDER_DELAY = 200;

export default inherit(TextBase, {
    template,
    name: 'styledText-element',
    props: ['global', 'model', 'options', 'editor'],
    data() {
        return {
            resizing: false,
            isLockRatioResize: false,
            resizeStartRatio: 0,
            resizeStartImgWidth: 0,
            resizeStartImgHeight: 0,
            changing: false,
            rendering: false,
            renderError: null,
            lastRenderTimeStamp: -1,
            renderingTimeStamp: -1,
            lastRenderedTextsData: null, // 已经渲染过的文本信息数据
            canvas: null,
            ctx2D: null,
        };
    },
    methods: {
        load() {
            return Promise.all([this.loadFonts(), this.loadImage()]);
        },
        loadImage(url) {
            url = url || this.model.image.url;

            if (!url) {
                return Promise.resolve();
            }

            return utils
                .loadImage(url, this.options.fitCrossOrigin)
                .then((img) => {
                    this.model.$naturalWidth = img.naturalWidth;
                    this.model.$naturalHeight = img.naturalHeight;

                    return img;
                })
                .catch(() => {
                    this.usePlaceholder = true;
                });
        },
        loadFonts() {
            const options = this.options;
            const { contents, fontFamily } = this.model;

            let names = contents
                .filter((item) => item && item.fontFamily)
                .map((item) => item.fontFamily);

            names.push(fontFamily);

            names = uniq(names);

            const fontLoads = names.map((name) => {
                const font = this.getCloseFont(name);
                if (!font) {
                    return Promise.resolve();
                }

                return loader.loadFont(
                    {
                        ...font,
                        display: 'auto',
                    },
                    options.fontLoadTimeout,
                );
            });

            return Promise.all(fontLoads);
        },
        getTextsData() {
            const textsData = {
                writingMode: this.model.writingMode,
                fontSize: Math.round(this.model.fontSize),
                maxWidth: Math.round(this.model.width),
                maxHeight: Math.round(this.model.height),
                ...this.model.effectStyle,
            };
            const zoom = this.global.zoom;

            const node = this.$el.querySelector('.element-main-unrotated span');
            if (!node) return null;

            let contents = [];
            const parentRect = node.parentElement.getBoundingClientRect();
            let hasEmoji = false;
            // 一些字体 span 的宽度会超出外围容器的宽度
            // 对内部的文本 rect 需要考虑这个 diff 来纠正位置
            let minTop = Infinity;
            let maxBottom = -Infinity;
            let minLeft = Infinity;
            let maxRight = -Infinity;
            node.childNodes.forEach((child) => {
                if (child.nodeType === 3) {
                    // text node
                    const lines = {};
                    const chars = [];
                    split(child.textContent, '').forEach((char) => {
                        // filter emojis
                        if (char.length === 1) {
                            chars.push(char);
                        } else {
                            hasEmoji = true;
                            chars.push('?');
                            chars.push(' ');
                        }
                    });
                    chars.forEach((char, index) => {
                        // 过滤空白符：空格与 tab
                        if (char === ' ' || char.charCodeAt(0) === 9) return;

                        const range = document.createRange();

                        range.setStart(child, index);
                        range.setEnd(child, index + 1);

                        const rect = range.getBoundingClientRect();
                        const info = {
                            char,
                            x: Math.round((rect.x - parentRect.x) / zoom),
                            y: Math.round((rect.y - parentRect.y) / zoom),
                            width: Math.round(rect.width / zoom),
                            height: Math.round(rect.height / zoom),
                        };
                        minTop = Math.min(minTop, info.y);
                        maxBottom = Math.max(maxBottom, info.y + info.height);
                        minLeft = Math.min(minLeft, info.x);
                        maxRight = Math.max(maxRight, info.x + info.width);
                        if (lines[rect.y]) {
                            lines[rect.y].push(info);
                        } else {
                            lines[rect.y] = [info];
                        }
                    });
                    const childContents = Object.keys(lines)
                        .map((key) => parseFloat(key))
                        .sort((k1, k2) => k1 - k2)
                        .map((key) => lines[key]);

                    contents = contents.concat(childContents);
                }
            });

            // 行高小的时候，不止会在上面溢出，下面也可能会
            // 导致容器的高度和实际的文本高度不一致
            textsData.maxHeight = Math.max(textsData.maxHeight, maxBottom - minTop);
            // textsData.maxWidth = Math.max(textsData.maxWidth, maxRight - minLeft);
            textsData.contents = contents;
            textsData.hasEmoji = hasEmoji;

            return textsData;
        },
        renderStyledText(timestamp, textsData, doneCb, force = false) {
            // 如果有缩略图，会导致触发两次事件，导致同时发起两个请求，
            // 因此过滤掉非编辑器的事件发出
            if (!this.isDesignMode) return;

            this.rendering = true;
            this.model.image.url = null;

            this.$events.$emit('element.styledTextUpdate', textsData, (err, image) => {
                // callback when outer renderer done its updating, and return image url as arg
                if (
                    force ||
                    (timestamp === this.renderingTimeStamp && !err && image && image.url)
                ) {
                    this.lastRenderedTextsData = textsData;

                    this.loadImage(image.url).then((img) => {
                        if (force || !this.checkTextsDataDiff(this.getTextsData(), textsData)) {
                            this.model.image = image;
                            this.renderToCanvas(img);
                            this.changeImgColor();
                            this.updateCache(textsData);
                        }
                        doneCb && doneCb();

                        this.rendering = false;
                        this.renderError = null;
                    });
                } else {
                    this.rendering = this.renderingTimeStamp > timestamp;
                    this.renderError = err;
                }
            });
        },
        /**
         * scheduleRender
         * 风格化渲染调度，在一定时间内限制渲染请求频率
         *
         */
        scheduleRender(doneCb, force = false) {
            if (!this.hasSupportedEffect || this.isFontSizeTooSmall) return;

            this.rendering = false;
            const timestamp = Date.now();

            this.$nextTick(() => {
                const textsData = this.getTextsData();
                if (!textsData) {
                    this.renderError = new Error('无文本内容');
                    return;
                }

                let hasDifference = !this.lastRenderedTextsData || force;
                // 单纯改变文本框大小，没有影响文本排版时，不需要重新渲染
                if (!hasDifference) {
                    hasDifference = this.checkTextsDataDiff(textsData, this.lastRenderedTextsData);
                }
                if (!hasDifference) return;

                const cache = this.getCache(textsData);
                if (cache) {
                    this.restoreCacheData(textsData, cache);
                    this.rendering = false;
                    return;
                }

                this.changing = !force;
                this.renderingTimeStamp = timestamp;

                setTimeout(
                    function renderTimer(timestamp, textsData, doneCb, force) {
                        if (
                            force ||
                            (timestamp === this.renderingTimeStamp &&
                                timestamp - this.lastRenderTimeStamp > RENDER_DELAY)
                        ) {
                            this.changing = false;
                            this.lastRenderTimeStamp = this.renderingTimeStamp;
                            this.renderStyledText(timestamp, textsData, doneCb, force);
                        }
                    }.bind(this, timestamp, textsData, doneCb, force),
                    force ? 0 : RENDER_DELAY,
                );
            });
        },
        checkTextsDataDiff(textsData, textsData2) {
            const lastContents = textsData2.contents;
            let hasDifference =
                textsData.contents.length !== lastContents.length ||
                textsData.fontSize !== textsData2.fontSize ||
                textsData.writingMode !== textsData2.writingMode ||
                textsData.id !== textsData2.id ||
                textsData.effectFontId !== textsData2.effectFontId;

            if (!hasDifference) {
                hasDifference = textsData.contents.some((content, index) => {
                    const oldContent = lastContents[index];
                    if (content.length !== oldContent.length) return true;
                    return content.some((info, innerIndex) => {
                        const oldInfo = oldContent[innerIndex];
                        return Math.abs(info.x - oldInfo.x) > 1 || Math.abs(info.y - oldInfo.y) > 1;
                    });
                });
            }

            return hasDifference;
        },
        changeImgColor() {
            this.ctx2D.globalCompositeOperation = 'source-in';
            this.ctx2D.fillStyle = this.model.color;
            this.ctx2D.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },
        renderToCanvas(img) {
            this.canvas.width = img.naturalWidth || img.width;
            this.canvas.height = img.naturalHeight || img.height;
            this.canvas.style.width = `${this.canvas.width}px`;
            this.canvas.style.height = `${this.canvas.height}px`;
            this.ctx2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx2D.drawImage(img, 0, 0);
        },
        getCache(textsData) {
            return renderCache.get(JSON.stringify(textsData));
        },
        updateCache(textsData) {
            const cachedCanvas = document.createElement('canvas');
            cachedCanvas.width = this.canvas.width;
            cachedCanvas.height = this.canvas.height;
            const ctx = cachedCanvas.getContext('2d');
            ctx.drawImage(this.canvas, 0, 0);
            renderCache.set(JSON.stringify(textsData || this.getTextsData()), {
                image: { ...this.model.image },
                canvas: cachedCanvas,
            });
        },
        scheduleExportImg(textsData) {
            const exportDelay = RENDER_DELAY * 2;
            setTimeout(
                function exportTimer() {
                    if (Date.now() - this.lastRenderTimeStamp >= exportDelay) {
                        this.model.image.url = this.canvas.toDataURL();
                        this.updateCache(textsData);
                    }
                }.bind(this),
                exportDelay,
            );
        },
        restoreCacheData(textsData, cache) {
            this.model.image = cache.image;
            this.lastRenderedTextsData = textsData;
            this.renderToCanvas(cache.canvas);
            this.changeImgColor();
        },
    },
    computed: {
        showPlainText() {
            // TODO:
            // 如果当前是等比例拖拽，但是上一次不是且还未返回结果
            // 这时候显示的是图片，而此时的图片与文本的排版不一样了
            return (
                !this.isLockRatioResize &&
                (this.isFontSizeTooSmall ||
                    this.resizing ||
                    this.changing ||
                    this.renderError ||
                    this.model.$editing ||
                    this.rendering ||
                    !this.hasSupportedEffect)
            );
        },
        isFontSizeTooSmall() {
            // 字体太小的情况下，渲染的效果很模糊，回退到正常文本
            return this.model.fontSize <= 14;
        },
        textStyle() {
            return {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize + 'px',
                letterSpacing: this.letterSpacingScale * this.model.letterSpacing + 'px',
                // textDecoration: this.model.textDecoration,
                verticalAlign: this.model.verticalAlign,
                color: this.color,
                transform: this.mainTransform,
                transformOrigin: this.transformOrigin,
                minWidth: this.mainMinWdith,
                minHeight: this.mainMinHeight,
                width: this.mainWidth,
                height: this.mainHeight,
                opacity: this.showPlainText ? 1 : 0,
            };
        },
        canvasStyle() {
            return {
                opacity: !this.showPlainText ? 1 : 0,
                marginTop: `${this.model.image.offset.y || 0}px`,
                marginLeft: `${this.model.image.offset.x || 0}px`,
            };
        },
        hasSupportedEffect() {
            // 风格化可用需要：
            // 1. 选择了一个特效，即 id 有效
            // 2. 选择了支持这个特效的字体，即 effectFontId 有效
            return !!this.model.effectStyle.id && !!this.model.effectStyle.effectFontId;
        },
        // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
        transformInvert() {
            let parentRotate = 0;
            if (isGroup(this.$parent.model)) {
                parentRotate = (this.$parent.model.rotate * Math.PI) / 180;
            }
            const { transform, scaleX, scaleY } = this.model;
            let { a, b, c, d, tx, ty } = transform.localTransform;
            if (scaleX < 0) {
                a = -a;
                b = -b;
            }
            if (scaleY < 0) {
                c = -c;
                d = -d;
            }
            const matrix = new Matrix(a, b, c, d, tx, ty);
            matrix.rotate(parentRotate);
            matrix.invert();

            const invertTransform = new Transform();
            invertTransform.setFromMatrix(matrix);
            return invertTransform.toString();
        },
    },
    watch: {
        'model.contents'() {
            const parentModel = this.$parent.model;
            const isAutoGroup = isGroup(parentModel) && parentModel.autoGrow;

            // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算
            if ((!this.$textResizeMeta || !isAutoGroup) && !this.resizing) {
                this.syncRect();
            }
        },

        'model.$editing'(val) {
            if (!val) this.scheduleRender();
        },

        'model.writingMode'() {
            if (!this.isDesignMode) {
                return;
            }

            const { model } = this;
            // 当前 resize 模式旋转 90 度后可能变为新 resize
            const newResize = {
                0b010: 0b100,
                0b100: 0b010,
                0b101: 0b011,
                0b011: 0b101,
            }[model.resize];
            if (newResize) {
                model.resize = newResize;
            }

            [model.width, model.height] = [model.height, model.width];

            this.syncRect();
            this.scheduleRender();
        },

        'model.letterSpacing'() {
            this.syncRect();
            this.scheduleRender();
        },

        'model.lineHeight'() {
            this.syncRect();
            this.scheduleRender();
        },

        'model.padding'() {
            this.syncRect();
            this.scheduleRender();
        },

        'model.textAlign'() {
            this.scheduleRender();
        },

        'model.color'() {
            this.changeImgColor();
        },
        'model.effectStyle': {
            handler(val, oldVal) {
                if (val.effectFontId !== oldVal.effectFontId) {
                    this.loadFonts().then(() => {
                        this.scheduleRender(null, true);
                    });
                } else {
                    this.scheduleRender(null, true);
                }
            },
            deep: true,
        },
        'model.fontSize'(val, oldVal) {
            // 行为同步自 text-element
            const { model, options, syncRect, $textResizeMeta, $events } = this;
            const parentModel = this.$parent.model;
            const isAutoGroup = isGroup(parentModel) && parentModel.autoGrow;

            if (options.mode === 'preview') {
                return;
            }

            if (!model.$editing && !$textResizeMeta) {
                model.contents = model.contents.map((item) => {
                    return {
                        ...item,
                        fontSize: val,
                    };
                });
            }

            // fontSize 如果是单行文字的，修改字体则不需要再次计算
            if ($textResizeMeta || model.$singleText) {
                // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算
                // return 不做任何处理， 否则会抖动
                model.$singleText = false;
                !isAutoGroup && syncRect();
                return;
            }

            // 文本框处于自增组中时，其 model 尺寸交由父级 group 计算
            if (isAutoGroup) {
                const ratio = val / oldVal || 1;
                $events.$emit('group.contentScale', parentModel, ratio);
                syncRect();
                return;
            }

            // 基于 textAlign 元素本身进行对齐
            if (model.autoScale) {
                const ratio = val / oldVal || 1;
                const { width: tempWidth, height: tempHeight } = model;
                const width = tempWidth * ratio;

                model.letterSpacing *= ratio;

                // 跟随textAlign做位置调整
                if (model.textAlign === 'center') {
                    model.left -= (width - tempWidth) / 2;
                } else if (model.textAlign === 'right') {
                    model.left -= width - tempWidth;
                }

                model.width = width;
                model.height = tempHeight * ratio;

                if (isGroup(parentModel)) {
                    // 手动赋值了 model 的 width、height，syncRect 时小概率无法触发 updateRect
                    // 需手动触发 element.rectUpdate 同步 group 更新
                    $events.$emit('element.rectUpdate', model, {
                        width: model.width - tempWidth,
                        height: model.height - tempHeight,
                    });

                    syncRect();
                }
            }

            this.scheduleRender();
        },
        'model.width'() {
            if (!this.isDesignMode || !this.isLockRatioResize) return;

            const resizeRatio = this.resizeStartRatio;

            const width = this.model.width / resizeRatio;
            const height = (this.canvas.height * width) / this.canvas.width;
            const marginRatio = width / this.model.image.width;
            const { x, y } = this.model.image.offset;
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            this.canvas.style.marginLeft = `${x * marginRatio}px`;
            this.canvas.style.marginTop = `${y * marginRatio}px`;
        },
        'model.image': {
            handler() {
                if (!this.isDesignMode && this.model.image.url) {
                    this.loadImage().then((img) => {
                        this.renderToCanvas(img);
                    });
                }
            },
            deep: true,
        },
    },
    events: {
        'element.transformStart'(model, { action, dir }) {
            if (action !== 'resize' || !this.isDesignMode) return;
            let modelMatched = model === this.model;
            if (!modelMatched && (isGroup(model) || model.type === '$selector')) {
                modelMatched = model.elements.some((elem) => elem === this.model);
            }
            if (!modelMatched) return;

            this.resizing = true;
            this.isLockRatioResize = ['se', 'nw', 'sw', 'ne'].indexOf(dir) > -1;
            this.resizeStartRatio = this.model.width / parseFloat(this.canvas.style.width);
        },
        'element.transformEnd'(model, drag, { action }) {
            if (action !== 'resize') return;

            let modelMatched = model === this.model;
            if (!modelMatched && (isGroup(model) || model.type === '$selector')) {
                modelMatched = model.elements.some((elem) => elem === this.model);
            }
            if (!modelMatched) return;

            this.resizing = false;

            this.scheduleRender(() => {
                this.isLockRatioResize = false;
            });
        },
    },
    mounted() {
        this.syncRect();
        this.canvas = this.$el.querySelector('canvas');
        this.ctx2D = this.canvas.getContext('2d');

        // 如果没有特效图，则进行第一次渲染出图
        if (!this.model.image || !this.model.image.url) {
            this.load().then(() => {
                this.scheduleRender();
            });
        } else {
            // 由于风格化渲染需要发起请求，获取渲染结果图
            // 在请求期间可能会产生多次的历史记录，导致撤销/重做时图片与 model 不一致
            // 目前无法纯粹在风格化内单独处理历史记录的更新（addElement, changeElement 等会全局处理历史记录）
            // 因此，我们缓存渲染的结果，在撤销/重做时读取缓存覆盖掉历史记录，以保证准确性
            const textsData = this.getTextsData();
            const cache = this.getCache(textsData);
            if (cache) {
                this.restoreCacheData(textsData, cache);
            } else {
                this.loadImage().then((img) => {
                    this.renderToCanvas(img);
                    this.changeImgColor();
                    this.lastRenderedTextsData = textsData;
                });
            }
        }
    },
});
