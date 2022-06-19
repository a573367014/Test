import { isFunction, isEqual, get } from 'lodash';

export class BaseRender {
    constructor({ renderProvide, renderDiffKeys } = {}) {
        this.renderProvide = renderProvide;
        this.renderDiffKeys = renderDiffKeys;
        this.preData = null;
    }

    // 设置缓存
    setPreData() {
        if (!this.renderProvide) return;
        const cache = {};
        this.renderDiffKeys.forEach((key) => {
            const val = get(this.renderProvide, key);
            cache[key] = isFunction(val) ? val(this.renderProvide) : val;
        });

        this._preData = cache;
    }

    // 是否需重新绘制
    isNeedRender() {
        if (
            !this.renderProvide ||
            !this.renderDiffKeys ||
            !this.renderDiffKeys.length ||
            !this._preData
        )
            return true;
        return this.renderDiffKeys.some((key) => {
            const val = get(this.renderProvide, key);
            return !isEqual(this._preData[key], isFunction(val) ? val() : val);
        });
    }

    // load() {}
    // render() {
    //     if(!this.isNeedRender) return this.canvas;
    //     this.setPreData();
    // }

    renderByCanvas(canvas, inputCanvas, zoom = 1) {
        if (inputCanvas.width === 0 || inputCanvas.height === 0) return;
        canvas = canvas || this.canvas;
        canvas.width = inputCanvas.width * zoom;
        canvas.height = inputCanvas.height * zoom;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(inputCanvas, 0, 0, canvas.width, canvas.height);
    }
}
