import Promise from 'bluebird';
import { cloneDeep, throttle } from 'lodash';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from './text-base';
import template from './effect-text-element.html';
import { drawPath, drawCanvas, getEffectExpand } from './utils';
import FontPath from './utils/font-path';
import { transformPath } from './utils/transform';
import FontEffect from './utils/font-effect';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import { getLines, getWords } from '@gaoding/editor-utils/get-lines';
import { fitText } from '@gaoding/editor-framework/src/utils/fit-elements';
import utils from '@gaoding/editor-framework/src/utils/utils';
import { getUpdateFontsSubset } from '@gaoding/editor-framework/src/utils/subset';
import { scaleEffect } from '@gaoding/editor-utils/effect/utils';
import { getEffectShadowList } from '@gaoding/editor-utils/effect/browser/adaptor';

export default inherit(BaseElement, {
    name: 'effect-text-element',
    template,
    data() {
        return {
            isRendering: false,
            isRenderInit: false,
        };
    },
    computed: {
        canvasStyle() {
            const { zoom = 1 } = this.global;
            const { ratio = 1 } = this;
            return {
                transform: `scale(${(zoom * ratio) / window.devicePixelRatio})`,
            };
        },
        isMirrorMode() {
            // 有 imageUrl 才算有效的 mirror 模式，不然依然走渲染
            return this.options.mode === 'mirror' && this.model.imageUrl;
        },
        linkSelected() {
            const element = this.editor.currentSubElement || this.editor.currentElement || {};
            return this.isLinkWith(element);
        },
        showWithImg() {
            // 如果一个元素有多个 vue 实例，编辑器修改了其中一个实例，渲染后删除 imageUrl, 会导致其他使用预览图的实例渲染异常
            if (!this.isRenderInit && !this.model.imageUrl) {
                this.lazyRender();
            }
            return !this.isRenderInit;
        },
        showLoading() {
            return this.isRendering && this.isDesignMode;
        },
    },
    events: {
        'element.loaded'(model) {
            if (model === this.model) {
                this.syncRect();
            }
        },

        'element.transformStart'(model, { action }) {
            if (this.isModelRelative(model) && action === 'resize') {
                const { width, height } = this.rect;
                this.$textResizeMeta = {
                    width,
                    height,
                    letterSpacing: this.model.letterSpacing,
                    fontSize: this.model.fontSize,
                    contents: cloneDeep(this.model.contents),
                };
            }
        },
        'element.transformEnd'(model, drag, { action }) {
            if (this.isModelRelative(model) && action === 'resize') {
                model === this.model && this.syncRectPos(drag.dir.length > 1);
                this.$nextTick(() => this.lazyRender());
            }
        },
        'element.transformResize'(drag, model) {
            if (this.isModelRelative(model)) {
                const isHorizontal = this.model.writingMode === 'horizontal-tb';
                const { dir } = drag;
                if (
                    (isHorizontal && (dir === 'n' || dir === 's')) ||
                    (!isHorizontal && (dir === 'w' || dir === 'e'))
                ) {
                    return;
                }

                if (dir.length > 1) {
                    const currRect = this.rect;
                    const baseText = this.$textResizeMeta;
                    // 原文本框缩放至 0 宽高后，展开时按 1:1 处理
                    this.ratio = isHorizontal
                        ? currRect.width / (baseText.width || 1)
                        : currRect.height / (baseText.height || 1);
                } else {
                    this.syncRect();
                }
            }
        },
        'element.change'(model, propName) {
            if (propName === 'contents' && this.isLinkWith(model)) {
                const content = model.contents
                    .reduce((list, content) => {
                        list.push(content.content);
                        return list;
                    }, [])
                    .join('');

                this.editor.changeElement(
                    {
                        contents: [{ content: content }],
                        content,
                    },
                    this.model,
                    false,
                );
                this.syncRect();
            }
        },
        'model.fontSize'(val, oldVal) {
            if (!this.isDesignMode || this.model.$resizeApi) return;

            scaleEffect(this.model, val / oldVal || 1);
            this.lazyRender();
        },
    },
    methods: {
        async load() {
            // 初始状态加载字体子集，使文字不会换行，导致双击后中心位置改变
            if (this.isDesignMode) {
                this.loadFont();
            }
            if (this.model.imageUrl) {
                await utils.loadImage(this.model.imageUrl, this.options.fitCrossOrigin);
            } else {
                await this.render(true);
            }
        },
        async loadFontPath() {
            const vm = this;
            const names = await this.loadFont();

            return Promise.map(names, (name) => {
                const fontData = vm.getFontData(name);
                return new FontPath(fontData, this.model).load();
            }).then((fonts) => {
                const result = {};
                fonts.forEach((item) => {
                    result[item.name] = item;
                });
                return result;
            });
        },
        getWords() {
            const lines = getLines(this.$refs.textNode, this.$refs.textInner);
            // 有的变化不计算 letterSpacing 更好看
            const types = [
                'ellipse-byWord',
                'triangle-byWord',
                'rectangular-byWord',
                'pentagon-byWord',
            ];
            if (!types.some((type) => type === this.model.deformation.type)) {
                lines.forEach((line) => {
                    line.forEach((word) => {
                        word.width -= this.model.letterSpacing;
                    });
                });
            }

            const words = getWords(lines, this.model);
            return words;
        },
        getFontData(fontFamily) {
            const { options } = this;
            return (
                options.fontsMap[fontFamily] ||
                options.fontsMap[this.model.fontFamily] ||
                options.defaultFont
            );
        },
        getPaths(fontPaths) {
            const initPaths = [];
            this.words = this.getWords();
            const charPosDatas = [];
            let maxFontSize = 0;
            this.words.forEach((word) => {
                if (word.fontSize < 12) {
                    word.fontSize = 12 * this.fontSizeScale;
                }

                // 增加字体回退
                const fontData = this.getFontData(word.fontFamily);
                const fontPath = fontPaths[fontData.name];
                const path = fontPath.getPathByData(word);
                initPaths.push(path);
                const x = word.left + 0.5 * word.width;
                const y = word.top + 0.5 * word.height;

                const fontBox = fontPath.$getInfo(word);

                charPosDatas.push({
                    rowNum: word.lineIndex,
                    columnNum: word.wordIndex,
                    fontSize: word.fontSize,
                    centerPos: { x, y },
                    centerDiviation: 0.5 * word.height - fontBox.baseLine,
                });

                maxFontSize = Math.max(maxFontSize, word.fontSize);
            });
            this.pathOptions = {
                charPosDatas,
                writingMode: this.model.writingMode,
                maxFontSize,
            };
            return initPaths;
        },
        draw() {
            if (
                this.model.$editing ||
                this.editor.global.$draging ||
                !this.initBBox ||
                !this.initPaths[0]
            )
                return;

            if (this.getTextEffectsEnable()) {
                this.boundingBox = getEffectExpand(this.model, this.initBBox);
            }
            if (!this.checkBoundingBox) return;
            this.resizeCanvas(this.boundingBox);
            const { width, height, min = { x: 0, y: 0 } } = this.boundingBox;

            // 重置宽高会导致内容丢失
            this.clickAreaCanvas.width = width;
            this.clickAreaCanvas.height = height;
            this.cacheCtx.save();
            this.clickAreaCtx.save();
            this.cacheCtx.translate(-min.x, -min.y);
            this.clickAreaCtx.translate(-min.x, -min.y);
            this.clickAreaCtx.fillStyle = '#00ff00';

            this.words.forEach((word, i) => {
                const fontData = this.getFontData(word.fontFamily);
                this.cacheCtx.fillStyle = word.color;
                this.cacheCtx.strokeStyle = word.color;
                drawCanvas({
                    ctx: this.cacheCtx,
                    word,
                    path: this.paths[i],
                    fontWeight: fontData.weight,
                });

                drawPath(this.clickAreaCtx, this.paths[i].clickAreaCommands);
            });
            this.cacheCtx.restore();
            this.clickAreaCtx.restore();
            this.doTextEffects();
        },
        async doTransform() {
            if (this.model.$editing || this.editor.global.$draging) return;
            if (this.initPaths && this.initPaths[0]) {
                this.paths = cloneDeep(this.initPaths);
                this.boundingBox = await transformPath(this.paths, this.model, this.pathOptions);
                this.initBBox = this.boundingBox;
                this.draw();
            }
        },
        async doTextEffects() {
            if (this.model.$editing || this.editor.global.$draging) return;

            if (this.getTextEffectsEnable()) {
                const { min = { x: 0, y: 0 } } = this.boundingBox;

                const fe = new FontEffect({
                    inputCtx: this.cacheCtx,
                    outputCtx: this.ctx,
                    model: this.model,
                    mode: this.options.mode,
                    paths: this.paths,
                    pathOffset: {
                        x: -min.x * window.devicePixelRatio,
                        y: -min.y * window.devicePixelRatio,
                    },
                });
                await fe.render();
            } else {
                this.canvas.width = this.cacheCanvas.width;
                this.canvas.height = this.cacheCanvas.height;

                this.ctx.drawImage(this.cacheCanvas, 0, 0);
            }
            this.ratio = 1;
            this.model.imageUrl = null;

            // 手动触发点击区域更新
            this.editor.lazyUpdatePicker();
        },
        async initRenderer() {
            this.isRenderInit = true;
            this.cacheCanvas = createCanvas();
            this.cacheCtx = this.cacheCanvas.getContext('2d');
            await this.$nextTick();
            this.canvas = this.$refs.canvas;
            this.clickAreaCanvas = this.$refs.clickAreaCanvas;
            this.ctx = this.canvas.getContext('2d');
            this.clickAreaCtx = this.clickAreaCanvas.getContext('2d');
        },
        async render(isForce) {
            if (
                !this.$refs.textInner ||
                ((this.model.$editing || this.editor.global.$draging) && isForce !== true)
            )
                return;

            this.isRendering = true;
            this.syncRect();
            await this.$nextTick();
            const fontPaths = await this.loadFontPath();
            if (this.$refs.textInner) {
                this.initPaths = this.getPaths(fontPaths);
                if (this.initPaths && this.initPaths[0]) {
                    if (!this.isRenderInit || !this.clickAreaCanvas) {
                        await this.initRenderer();
                    }
                    await this.doTransform();
                }
            }

            this.isRendering = false;
        },
        lazyRender(arg) {
            if (!this._lazyRender) {
                this._lazyRender = throttle(async (arg) => {
                    this.scaleRatio = 1;
                    await this.render(arg);
                }, 100);
            }
            this._lazyRender(arg);
        },
        effectRender() {
            if (this.isRenderInit) {
                this.draw();
            } else {
                this.lazyRender();
            }
        },
        resizeCanvas({ width, height }) {
            this.cacheCanvas.width = Math.ceil(width * window.devicePixelRatio);
            this.cacheCanvas.height = Math.ceil(height * window.devicePixelRatio);
            this.cacheCtx.restore();
            this.cacheCtx.save();
            this.cacheCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

            const { model } = this;

            const dw = width - model.width;
            const dh = height - model.height;

            if (this.isDesignMode) {
                model.left += (model.width - width) / 2;
                model.top += (model.height - height) / 2;
            }

            this.model.typoWidthRatio = model.$typoWidth / width;
            this.model.typoHeightRatio = model.$typoHeight / height;

            model.width = width;
            model.height = height;

            if (Math.abs(dw) + Math.abs(dh) > 0.1) {
                const groups = this.editor.getParentGroups(this.model);
                // groups 由浅入深，应反向更新
                for (let i = groups.length - 1; i >= 0; i--) {
                    this.$events.$emit('group.boundingReset', groups[i]);
                }
            }
        },
        checkBoundingBox() {
            const { width = 0, height = 0 } = this.boundingBox;
            return width > 1 && height > 1;
        },
        getTextEffectsEnable() {
            return getEffectShadowList(this.model).length > 0;
        },

        syncRectPos(isScale = false) {
            const baseText = this.$textResizeMeta;
            const { ratio = 1, rect, global } = this;

            const { zoom = 1 } = global;
            this.model.width = rect.width / zoom;
            this.model.height = rect.height / zoom;

            this.model.top = rect.top / zoom;
            this.model.left = rect.left / zoom;

            if (isScale) {
                fitText(this.model, baseText, ratio);
            }

            delete this.$textResizeMeta;
            if (!this.isDesignMode) {
                this.ratio = 1;
            }
        },
        checkLoadFullFont() {
            const { model, options } = this;
            const fontData = getUpdateFontsSubset([{ elements: [model] }], options);

            if (fontData) {
                Object.keys(fontData).forEach((name) => {
                    const fontSubset = options.fontSubsetsMap[name];
                    if (fontSubset) {
                        fontSubset.loadType = 'all';
                    }
                });
                this.checkLoad();
            }
        },
    },
    mounted() {
        this.checkLoadFullFont();
        this.syncRect();
    },
    watch: {
        'model.width'(val) {
            this.model.$typoWidth = val * (this.model.$editing ? 1 : this.model.typoWidthRatio);
        },
        'model.height'(val) {
            this.model.$typoHeight = val * (this.model.$editing ? 1 : this.model.typoHeightRatio);
        },
        'model.$editing'(val) {
            if (this.isDesignMode) {
                const { model } = this;
                if (val) {
                    model.resize = this.isVertical ? 3 : 5;
                    model.left += (model.width * (1 - model.typoWidthRatio)) / 2;
                    model.top += (model.height * (1 - model.typoHeightRatio)) / 2;

                    model.width = model.$typoWidth;
                    model.height = model.$typoHeight;
                } else {
                    model.resize = 1;

                    model.width = model.$typoWidth / model.typoWidthRatio;
                    model.height = model.$typoHeight / model.typoHeightRatio;

                    model.top += (model.$typoHeight - model.height) / 2;
                    model.left += (model.$typoWidth - model.width) / 2;
                }
            }

            if (!val) {
                this.lazyRender();
                return;
            }
            // 进入编辑加载全量字体
            let needCheckLoad;
            this.model.contents.forEach((item) => {
                const font =
                    this.options.fontsMap[item.fontFamily || this.model.fontFamily] ||
                    this.options.defaultFont;
                const fontSubset = this.options.fontSubsetsMap[font.name];

                if (fontSubset && fontSubset.loadType !== 'all') {
                    fontSubset.loadType = 'all';
                    needCheckLoad = true;
                }
            });

            if (needCheckLoad) {
                this.checkLoad();
            }
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
            }[model.editingResize];
            if (newResize) {
                model.editingResize = newResize;
            }

            [model.width, model.height] = [model.height, model.width];
            [model.typoWidthRatio, model.typoHeightRatio] = [
                model.typoHeightRatio,
                model.typoWidthRatio,
            ];
            this.lazyRender();
        },

        'model.contents': {
            deep: true,
            handler() {
                if (!this.model.$editing && !this.model.$draging) {
                    this.checkLoadFullFont();
                }
                this.syncRect();
                this.lazyRender();
            },
        },

        'model.textAlign': 'lazyRender',

        'model.letterSpacing': 'lazyRender',

        'model.lineHeight': 'lazyRender',

        'model.padding': 'lazyRender',

        'model.deformation': {
            deep: true,
            handler() {
                if (this.model.$needSpeedUp && this.initPaths) {
                    this.doTransform();
                    this.model.$needSpeedUp = false;
                } else {
                    this.lazyRender();
                }
            },
        },
        'model.textEffects': {
            deep: true,
            handler: 'effectRender',
        },
        'model.shadows': {
            deep: true,
            handler: 'effectRender',
        },
        // 'global.zoom': 'render'
    },
});
