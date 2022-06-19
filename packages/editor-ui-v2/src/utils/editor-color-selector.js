import { throttle, isArray, isFunction } from 'lodash';
import tinycolor from 'tinycolor2';
import '../i18n';
import { useI18n } from '@gaoding/vue-i18next';

const { $tsl } = useI18n('editor-ui-v2');
const svg = `<svg width="210" height="210" viewBox="0 0 210 210" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d)">
<path id="colorKey" fill-rule="evenodd" clip-rule="evenodd" d="M50 105C50 135.376 74.6243 160 105 160C135.376 160 160 135.376 160 105C160 74.6243 135.376 50 105 50C74.6243 50 50 74.6243 50 105ZM105 25C60.8172 25 25 60.8172 25 105C25 149.183 60.8172 185 105 185C149.183 185 185 149.183 185 105C185 60.8172 149.183 25 105 25Z"/>
<path d="M49 105C49 135.928 74.0721 161 105 161C135.928 161 161 135.928 161 105C161 74.0721 135.928 49 105 49C74.0721 49 49 74.0721 49 105ZM26 105C26 61.3695 61.3695 26 105 26C148.63 26 184 61.3695 184 105C184 148.63 148.63 184 105 184C61.3695 184 26 148.63 26 105Z" stroke="white" stroke-opacity="0.7" stroke-width="2"/>
</g>
<defs>
<filter id="filter0_d" x="0" y="0" width="210" height="210" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
<feOffset/>
<feGaussianBlur stdDeviation="12.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
</filter>
</defs>
</svg>`;

const defaultOptions = () => ({
    throttleTime: 100,
    backgroundColor: 'EEF2F8',
    loadingText: '',
    textColor: '#939ba6',
    radius: 1,
    rectNum: 2,
    containerSize: 95,
    colorPathKey: 'colorKey',
    url: svg,
    container: document.body,
    editArea: document.querySelector('.design-editor'),
    callback() {},
    exportImage({
        editor,
        layout,
        strategy = {},
        timeout = 10000,
        isRenderWatermark,
        isUseSvgExport,
    }) {
        return editor.exportImage(layout, strategy, timeout, isRenderWatermark, isUseSvgExport);
    },
});
const { floor } = Math;

/**
 * 前端取色
 */
export default class ColorSelector {
    constructor(editor, options) {
        this.editor = editor;
        this.options = Object.assign({}, defaultOptions(), options);
        this.$dom = isFunction(options.container) ? options.container() : options.container;
        this.$area = isFunction(options.editArea) ? options.editArea() : options.editArea;

        this.areaPosition = {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
        };

        this.isFlowMode = editor.mode === 'flow';

        // 取色器坐标
        this.magnifyingGlass = {
            x: 0,
            y: 0,
        };

        this.canvas = document.createElement('canvas');
        this.tempCanvas = document.createElement('canvas');
        this.backgroundCanvas = document.createElement('canvas');

        // 当前正在取色的画布
        this.layoutCanvas = [];
        this.indexGetColor = -1;
        this.layoutBaseHeight = 0;
        this.layoutTotalHeight = 0;
        this.layoutTotalWidth = 0;

        // 取色画布
        const pickerWidth = this.options.radius * 2;
        this.tempCanvas.width = pickerWidth;
        this.tempCanvas.height = pickerWidth;
        this.backgroundCanvas.width = pickerWidth;
        this.backgroundCanvas.height = pickerWidth;

        const pickerBgCtx = this.backgroundCanvas.getContext('2d');
        pickerBgCtx.fillStyle = '#' + this.options.backgroundColor;
        pickerBgCtx.fillRect(0, 0, pickerWidth, pickerWidth);

        this.magnifyRectangle = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            backgroundImageData: pickerBgCtx.getImageData(0, 0, pickerWidth, pickerWidth),
            imageData: this.tempCanvas
                .getContext('2d')
                .getImageData(0, 0, pickerWidth, pickerWidth),
        };

        this.context = this.canvas.getContext('2d', { alpha: true });

        // 导出的 canvas
        this.exportCanvas = null;

        this.render = () => {
            const { evt } = this;
            const point = this.getCanvasPoint(evt);
            const { context, magnifyRectangle } = this;
            const { imageData, x, y } = magnifyRectangle;

            context.putImageData(imageData, x, y);
            this.drawMagnifyingGlass(point);
        };

        // 鼠标点击
        this.clickProxy = (evt) => {
            const { target } = evt;
            // 阻止事件冒泡
            evt.stopPropagation();
            if (target === this.canvas && this.exportCanvas && !this.isNotSupportColor) {
                const color = this.getPixelDataColor();

                this.options.callback({
                    status: 'end',
                    color,
                });
                return;
            }
            this.options.callback({
                status: 'cancel',
            });
            return false;
        };

        // 鼠标事件
        this.mouseEvent = throttle((evt) => {
            this.evt = evt;

            if (this.isFlowMode) {
                const point = this.editor.pointFromEvent(this.evt);
                const layout = this.editor.getLayoutByPoint(point);
                if (layout) {
                    const index = this.editor.layouts.indexOf(layout);
                    this.indexGetColor = index;
                    this.changeLayout(this.indexGetColor);
                }
            }

            this.render();
        }, 10);

        this.cancelEvent = (evt) => {
            if (evt.keyCode === 27) {
                this.options.callback({
                    status: 'cancel',
                });
            }
            evt.stopPropagation();
            return false;
        };

        this.clearLayoutCanvas = () => {
            if (isArray(this.layoutCanvas) && this.layoutCanvas.length) {
                this.layoutCanvas = [];
            }
        };

        // 取消取色状态
        this.closePicker = throttle(() => {
            this.end();
            this.onPickerEnd();
        }, 500);

        // 取色关闭回调
        this.onPickerEnd = () => {};
        this.drawColorPicker();
    }

    /**
     * 当前画布
     */
    get currentLayout() {
        return this.editor.currentLayout;
    }

    /**
     * 获取所有画布
     */
    get layouts() {
        return this.editor.layouts;
    }

    get isNotSupportColor() {
        return this._isNotSupportColor;
    }

    set isNotSupportColor(val) {
        if (val && this.$img) {
            this.$img.style.display = 'none';
            this.$innerText.style.display = 'block';
            this.$innerText.style.top = '65%';
            this.$dom.style.cursor = 'not-allowed';
        } else if (this.$img) {
            this.$img.style.display = 'block';
            this.$innerText.style.top = '90%';
            this.$dom.style.cursor = 'auto';
        }
        this._isNotSupportColor = val;
    }

    setColorPreview(color) {
        if (!this.$img) return;

        const id = this.options.colorPathKey;
        const colorPath = this.$img.getElementById(id);
        colorPath.style.fill = `#${color}`;
    }

    isInEditArea() {
        const evt = this.evt;
        const { left, right, top } = this.areaPosition;

        if (evt.x < left || evt.x > right || evt.y < top) {
            return false;
        } else {
            return true;
        }
    }

    // flow模式切换当前取色的画布
    changeLayout(index) {
        const { layouts, layoutCanvas } = this;

        if (layoutCanvas[index]) {
            this.exportCanvas = layoutCanvas[index];
        } else {
            this.exportImageExec(layouts[index], (canvas) => {
                this.layoutCanvas[index] = canvas;
                this.exportCanvas = canvas;
            });
        }
    }

    /**
     * 清空数据
     */
    clearData() {
        // 取色器坐标
        this.magnifyingGlass = {
            x: 0,
            y: 0,
        };

        this.magnifyRectangle.x = 0;
        this.magnifyRectangle.y = 0;
        this.magnifyRectangle.width = 0;
        this.magnifyRectangle.height = 0;

        this.exportCanvas = null;
        this.isError = false;
        this.isNotSupportColor = false;
        this.$imgContainer.style.display = 'none';
    }

    /**
     * 绘制取色器样式
     */
    drawColorPicker() {
        this.$imgContainer = document.createElement('div');
        this.$innerText = document.createElement('span');
        this.$img = this.loadSvg(this.options.url);
        this.$img.style.width = '100%';
        this.$img.style.position = 'absolute';
        this.$img.style.top = 0;
        this.$img.style.left = 0;

        this.$innerText.style.padding = '0 8px';
        this.$innerText.style.lineHeight = '24px';
        this.$innerText.style.borderRadius = '4px';
        this.$innerText.style.backgroundColor = '#33383e';
        this.$innerText.style.color = '#FFFFFF';
        this.$innerText.style.position = 'absolute';
        this.$innerText.style.transform = 'translate(-50%, 50%)';
        this.$innerText.style.top = '65%';
        this.$innerText.style.left = '52%';
        this.$innerText.style.whiteSpace = 'nowrap';

        this.$imgContainer.style.position = 'absolute';
        this.$imgContainer.style.zIndex = 100;
        this.$imgContainer.style.width = this.options.containerSize * 2 + 'px';
        this.$imgContainer.style.height = this.options.containerSize * 2 + 'px';
        this.$imgContainer.style.pointerEvents = 'none';
        this.$imgContainer.style.display = 'none';

        this.$imgContainer.appendChild(this.$img);
        this.$imgContainer.appendChild(this.$innerText);
    }

    loadSvg(str) {
        const container = document.createElement('div');
        container.innerHTML = str;
        return container.childNodes[0];
    }

    /**
     * 事件绑定
     */
    bindEvent() {
        this.canvas.addEventListener('mousemove', this.mouseEvent, false);
        document.body.addEventListener('click', this.clickProxy, false);
        window.addEventListener('resize', this.closePicker, false);
        window.addEventListener('keydown', this.cancelEvent, false);
    }

    /**
     * 事件移除
     */
    unbindEvent() {
        this.canvas.removeEventListener('mousemove', this.mouseEvent, false);
        document.body.removeEventListener('click', this.clickProxy, false);
        window.removeEventListener('resize', this.closePicker, false);
        window.removeEventListener('keydown', this.cancelEvent, false);
    }

    /**
     * 获取编辑器坐标点
     * @param {*} mouseEvent 鼠标事件
     */
    getCanvasPoint(mouseEvent) {
        return {
            x: mouseEvent.offsetX,
            y: mouseEvent.offsetY,
        };
    }

    // 获取相对取色画布的Y坐标
    getYInExportCanvas(y) {
        if (!this.isFlowMode) {
            return y;
        } else {
            const layout = this.layouts[this.indexGetColor];
            return y - layout?.top || 0;
        }
    }

    /**
     * 获取像素
     */
    getAreaPixels() {
        const { options } = this;

        if (this.exportCanvas) {
            const context = this.exportCanvas.getContext('2d');
            const { rectNum } = options;
            const radius = floor(rectNum / 2);
            const point = this.editor.pointFromEvent(this.evt);

            this.isNotSupportColor = false;

            if (!this.isInEditArea()) {
                this.isNotSupportColor = true;
                return this.magnifyRectangle.imageData.data;
            }

            // 超出画布的内容直接使用默认的图片数据
            if (
                point.x <= 0 ||
                point.y <= 0 ||
                point.x + radius >= this.layoutTotalWidth ||
                point.y + radius >= this.layoutTotalHeight
            ) {
                this.isNotSupportColor = true;
                return this.magnifyRectangle.imageData.data;
            }

            const x = Math.max(point.x - radius, 0);
            const y = Math.max(point.y - radius, 0);

            return context.getImageData(x, this.getYInExportCanvas(y), rectNum, rectNum).data;
        }

        return this.magnifyRectangle.imageData.data;
    }

    /**
     * 获取放大后的 canvas
     */
    drawAreaCanvas() {
        const ctx = this.tempCanvas.getContext('2d');
        const data = this.getAreaPixels();
        this.drawRectInMagnifyGlass(ctx, data);
    }

    /**
     * 绘制放大后的 canvas
     * @param {} point
     */
    drawMagnifyingGlass(point) {
        const { tempCanvas } = this;
        const context = this.context;

        this.magnifyingGlass.x = point.x;
        this.magnifyingGlass.y = point.y;

        // 计算当前需要获取的区域像素
        this.calculateMagnifyRectangle(point);
        const { width, height, x, y } = this.magnifyRectangle;

        context.save();

        // 设置放大的区域
        this.setClipArea();

        // 获取区域内的像素 canvas
        this.drawAreaCanvas();

        context.drawImage(tempCanvas, x, y, width, height);

        context.restore();
        this.drawClipAreaColor();
        this.$imgContainer.style.transform = `translate(${
            point.x - this.options.containerSize
        }px, ${point.y - this.options.containerSize}px)`;
        this.$imgContainer.style.display = 'block';
    }

    /**
     * 绘制矩形在取色器中
     */
    drawRectInMagnifyGlass(context, data) {
        const { options } = this;
        const { rectNum, radius } = options;
        const rectWidth = (radius * 2) / rectNum;

        context.save();
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        for (let i = 0; i < rectNum; i++) {
            for (let j = 0; j < rectNum; j++) {
                const off = (i + j * rectNum) * 4;
                context.globalAlpha = data[off + 3];

                context.fillStyle = `rgb(${data[off]}, ${data[off + 1]}, ${data[off + 2]})`;
                context.fillRect(floor(i * rectWidth), floor(j * rectWidth), rectWidth, rectWidth);
            }
        }
        context.restore();
    }

    /**
     * 计算获取的区域大小
     * @param {*} point
     */
    calculateMagnifyRectangle(point) {
        const { options } = this;
        const { radius } = options;

        this.magnifyRectangle.x = Math.round(Math.max(point.x - radius, 0));
        this.magnifyRectangle.y = Math.round(Math.max(point.y - radius, 0));
        this.magnifyRectangle.width = 2 * radius;
        this.magnifyRectangle.height = 2 * radius;
    }

    /**
     * 获取像素点
     */
    getPixelDataColor() {
        if (this.exportCanvas) {
            const context = this.exportCanvas.getContext('2d');
            const point = this.editor.pointFromEvent(this.evt);
            const radius = Math.round(this.options.rectNum / 2);
            let data = null;

            this.isNotSupportColor = false;

            if (!this.isInEditArea()) {
                this.isNotSupportColor = true;
                return;
            }

            // 超出画布的内容直接使用默认的图片数据
            if (
                point.x <= 0 ||
                point.y <= 0 ||
                point.x + radius >= this.layoutTotalWidth ||
                point.y + radius >= this.layoutTotalHeight
            ) {
                this.isNotSupportColor = true;
                data = this.magnifyRectangle.imageData.data;
            } else {
                data = context.getImageData(point.x, this.getYInExportCanvas(point.y), 1, 1).data;
            }

            const color = tinycolor(`rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3]})`)
                .toHex()
                .toLocaleUpperCase();
            return color;
        }

        return 'FFFFFF';
    }

    /**
     * 绘制背景色
     */
    drawBackground() {
        const { context, canvas, options } = this;
        const { backgroundColor } = options;

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * 更新 canvas 大小
     */
    updateCanvas(shouldClearData = true) {
        const { canvas } = this;
        const { clientWidth, clientHeight } = this.$dom;

        canvas.width = clientWidth;
        canvas.height = clientHeight;
        canvas.style.width = `${clientWidth}px`;
        canvas.style.height = `${clientHeight}px`;

        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.zIndex = 100;

        if (shouldClearData) {
            this.clearData();
        }
    }

    /**
     * 导出 canvas
     */
    async exportImage(layout, withSvg = true) {
        return new Promise((resolve, reject) => {
            const picaResizeEnable = this.editor.options.picaResizeEnable;
            this.editor.options.picaResizeEnable = false;
            this.isError = false;

            return this.options
                .exportImage({
                    editor: this.editor,
                    layout,
                    strategy: {},
                    timeout: 10000,
                    isRenderWatermark: undefined,
                    isUseSvgExport: withSvg,
                })
                .then((canvas) => {
                    if (!canvas) {
                        this.isError = true;
                    }
                    this.editor.options.picaResizeEnable = picaResizeEnable;
                    resolve(canvas);
                })
                .catch((e) => {
                    reject(e);
                    this.isError = true;
                });
        });
    }

    // 导出canvas执行体
    exportImageExec(layout, cb) {
        this.exportImage(layout, false)
            .then((canvas) => {
                cb(canvas);
            })
            .catch(() => {
                this.exportImage(layout, true).then((canvas) => {
                    cb(canvas);
                });
            });
    }

    async init() {
        this.layoutCanvas = [];
        this.indexGetColor = -1;
        this.layoutBaseHeight = 0;
        this.layoutTotalHeight = 0;
        this.layoutTotalWidth = 0;

        this.areaPosition = this.$area.getBoundingClientRect();

        if (!this.isFlowMode) {
            this.exportImageExec(this.currentLayout, (canvas) => {
                this.exportCanvas = canvas;
                this.layoutTotalHeight = this.currentLayout.height;
                this.layoutTotalWidth = this.currentLayout.width;
                this.layoutBaseHeight = this.currentLayout.height;
            });
        } else {
            this.calcLayoutSize();
        }
    }

    // 计算总画布的长宽
    calcLayoutSize() {
        const { layouts } = this;
        this.layoutTotalHeight = 0;
        this.layoutTotalWidth = 0;
        this.layoutBaseHeight = layouts[0].height;
        layouts.forEach((el) => {
            this.layoutTotalHeight += el.height;
            this.layoutTotalWidth = Math.max(this.layoutTotalWidth, el.width);
        });
    }

    /**
     * 插入容器中遮挡
     */
    appendToContainer() {
        this.updateCanvas();
        this.$dom.appendChild(this.canvas);
        this.$dom.appendChild(this.$imgContainer);
    }

    /**
     * 删除容器内的画布
     */
    removeCanvas() {
        try {
            this.$dom.removeChild(this.canvas);
            this.$dom.removeChild(this.$imgContainer);
        } catch (err) {}
    }

    /**
     * 获取裁剪区域的的颜色
     */
    drawClipAreaColor() {
        const color = this.getPixelDataColor();

        this.setColorPreview(color);
        this.options.callback({
            status: 'getColor',
            color,
        });
        const text = this.isError
            ? $tsl('取色失败')
            : this.isNotSupportColor
            ? $tsl('移至画布取色')
            : this.exportCanvas
            ? '#' + color
            : $tsl('正在取色');

        this.$innerText.innerHTML = text;
    }

    /**
     * 对超出picker圆角的区域进行剪裁
     */
    setClipArea() {
        const context = this.context;
        const { radius } = this.options;
        const { x, y } = this.magnifyingGlass;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2, false);
        context.clip();
    }

    /**
     * 开始取色
     */
    start() {
        this.init();
        this.bindEvent();
        this.appendToContainer();
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 结束取色
     */
    end() {
        this.unbindEvent();
        this.removeCanvas();
        this.clearData();
    }

    // 设置取色器关闭的回调
    setPickEndEvent(cb) {
        this.onPickerEnd = cb;
    }
}
