/* eslint-env browser */
import { clipImage } from './clip';
import tinyColor from 'tinycolor2';
import { getImageEffectFillImage } from './fill';
import { calculateEffectExpand, calculateShadowExpand, getExpandByExpands } from './expand';
import type Bluebird from 'bluebird';
import type { IImageEffect } from '../../types/effect';
import type { IImageElement } from '../../types/image';
import type { IShadow } from '../../types/shadow';
import type { IMaskElement } from '../../types/mask';
import type { IBaseShadow } from '../../types/shadow/base-shadow';

interface IExpand {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
export interface IEnvContext {
    /** 所处环境 */
    env?: 'browser' | 'node';
    // eslint-disable-next-line no-unused-vars
    createCanvas: (width: number, height: number, offscreenCanvas?: boolean) => HTMLCanvasElement;
    // eslint-disable-next-line no-unused-vars
    loadImage: (url: string) => Promise<HTMLImageElement>;
    [otherKey: string]: any;
}

let engineId = 0;

/**
 * 图片特效渲染引擎
 *
 * @description
 * 渲染逻辑：
 * - imgCanvas 总是绘制原图或者 mask，部分特效层有独立的 mask，这时才绘制 mask，否则都是原图；
 * - 先渲染投影再渲染特效，都是倒序渲染（数据排在越前面越后面渲染）
 * - 绘制特效都是在 drawerCanvas 上操作，每次绘制都是相同的过程：
 *     1. 清空 drawerCanvas
 *     2. 将 imgCanvas 绘制到 drawerCanvas
 *     3. 在 drawerCanvas 上绘制当前特效
 *     4. 将 drawerCanvas 绘制到 viewCanvas
 * - viewCanvas 就是最终绘制结果，最终会将 viewCanvas 绘制到真实画面上
 *
 * 详情见文档 https://doc.huanleguang.com/pages/viewpage.action?pageId=221680746
 */
export class BaseImageEffectEngine {
    id: number;
    envContext: IEnvContext;

    /** 视图展示用的 */
    viewCanvas: HTMLCanvasElement;
    viewCtx: CanvasRenderingContext2D;

    /** 存储原图或者经过 mask 处理的图 */
    imgCanvas: HTMLCanvasElement;
    imgCtx: CanvasRenderingContext2D;

    /** 特效绘制使用的 */
    drawerCanvas: HTMLCanvasElement;
    drawerCtx: CanvasRenderingContext2D;

    /** 原始图形 */
    originalImg: HTMLCanvasElement | HTMLImageElement | null = null;
    /** 特效数据 */
    effects: IImageEffect[] = [];
    /** 投影数据 */
    shadows: IShadow[] = [];
    /** 元素数据 */
    element: IMaskElement | IImageElement | null = null;

    /** 扩展数据，图片经过特效后所占用的空间可能大于原来的大小，这字段描述四条边分别需要补充的空间大小 */
    expand: IExpand = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    /** 特效扩充数据 */
    effectExpand: IExpand = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    /** 投影扩充数据 */
    shadowExpand: IExpand = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    /** 画布宽度 */
    width = 0;
    /** 画布高度 */
    height = 0;

    /** 描述绘制状态 */
    drawPromise: Promise<void> | null = null;

    constructor(envContext: IEnvContext) {
        this.id = engineId++;
        this.envContext = envContext;

        this.viewCanvas = this.envContext.createCanvas(0, 0, true);
        this.viewCtx = this.viewCanvas.getContext('2d')!;
        this.viewCtx.imageSmoothingEnabled = false;

        this.imgCanvas = this.envContext.createCanvas(0, 0, true);
        this.imgCtx = this.imgCanvas.getContext('2d')!;
        this.imgCtx.imageSmoothingEnabled = false;

        this.drawerCanvas = this.envContext.createCanvas(0, 0, true);
        this.drawerCtx = this.drawerCanvas.getContext('2d')!;
        this.drawerCtx.imageSmoothingEnabled = false;
    }

    /**
     * 应用特效和投影
     */
    async applyEffects(
        img: HTMLCanvasElement | HTMLImageElement,
        element: IImageElement | IMaskElement,
        exportImage = true,
    ) {
        const { imageEffects = [], shadows = [] } = element;
        if (!imageEffects.length && !shadows.length) {
            return Promise.resolve({
                canvas: img,
                effectModel: {
                    imageUrl: null,
                    effectedResult: {
                        width: 0,
                        height: 0,
                        left: 0,
                        top: 0,
                    },
                },
            });
        }

        await this.initData(img, element);
        this.updateCanvasSize();

        await this.draw();

        const effectModel: Partial<IImageElement | IMaskElement> = {
            effectedResult: {
                width: this.width,
                height: this.height,
                left: -this.expand.left,
                top: -this.expand.top,
            },
        };

        if (exportImage) {
            effectModel.imageUrl = this.viewCanvas.toDataURL('image/png');
        }
        return {
            canvas: this.viewCanvas,
            effectModel,
        };
    }

    async initData(
        img: HTMLCanvasElement | HTMLImageElement,
        element: IImageElement | IMaskElement,
    ) {
        this.originalImg = img;
        this.element = element;
        this.effects = (element.imageEffects ?? []).filter((ef) => ef.enable);
        this.shadows = (element.shadows ?? []).filter((ef) => ef.enable);

        await this.setExpand();

        this.width = img.width + this.expand.left + this.expand.right;
        this.height = img.height + this.expand.top + this.expand.bottom;
    }

    async setExpand() {
        // 将特效与投影的 expand 拆开写是因为投影比较独立，绘制到这边需要加上特效的偏移
        this.effectExpand = calculateEffectExpand(this.element);
        this.shadowExpand = calculateShadowExpand(this.element);

        this.expand = getExpandByExpands([this.shadowExpand, this.effectExpand]);
    }

    updateCanvasSize() {
        if (!this.originalImg) {
            throw new Error('Can not find the this.originalImg');
        }
        this.viewCanvas.width = this.width;
        this.viewCanvas.height = this.height;
        this.viewCtx.clearRect(0, 0, this.width, this.height);

        this.drawerCanvas.width = this.width;
        this.drawerCanvas.height = this.height;
        this.drawerCtx.clearRect(0, 0, this.width, this.height);

        this.imgCanvas.width = this.originalImg.width;
        this.imgCanvas.height = this.originalImg.height;
        this.imgCtx.clearRect(0, 0, this.originalImg.width, this.originalImg.height);
    }

    async draw() {
        // 避免短时间连续调用造成绘制效果不对
        if (this.drawPromise) {
            await this.drawPromise;
        }
        const drawQueue: (() => Promise<void> | void)[] = [];

        // 渲染投影
        drawQueue.push(() => this.drawShadows());

        // 没有特效层时，填充一层原图
        if (this.effects.some((ef) => ef.enable)) {
            // 渲染特效，倒序渲染
            for (let i = this.effects.length - 1; i >= 0; i--) {
                drawQueue.push(() => this.drawEffect(this.effects[i]));
            }
        } else {
            drawQueue.push(() => this.drawFillOriginImage());
        }

        // 开始绘制前先记录初始状态
        this.drawerCtx.save();

        // 绘制
        this.drawPromise = drawQueue.reduce((p, fn) => p.then(fn), Promise.resolve());
        await this.drawPromise;
    }

    /**
     * 渲染投影
     */
    async drawShadows() {
        if (!this.originalImg) {
            throw new Error('Can not find the this.originalImg');
        }
        const shadows = this.shadows.filter((shadow) => shadow.type === 'base') as IBaseShadow[];

        if (shadows.length === 0) {
            return;
        }
        this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        this.imgCtx.drawImage(this.originalImg, 0, 0);
        for (let i = shadows.length - 1; i >= 0; i--) {
            const shadow = shadows[i];
            if (shadow.enable) {
                this.drawerCtx.save();
                this.drawerCtx.shadowColor = shadow.color;
                this.drawerCtx.shadowBlur = shadow.blur;
                this.drawerCtx.shadowOffsetX = 100000 + shadow.offsetX + this.expand.left;
                this.drawerCtx.shadowOffsetY = shadow.offsetY + this.expand.top;
                // 偏移后只相当于保留阴影图层
                this.drawerCtx.drawImage(this.imgCanvas, -100000, 0);
                this.drawerCtx.restore();
            }
        }

        this.drawToView();
    }

    /**
     * 渲染特效
     */
    async drawEffect(effect: IImageEffect) {
        if (!this.originalImg) {
            throw new Error('Can not find the this.originalImg');
        }
        this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        this.imgCtx.drawImage(this.originalImg, 0, 0);

        if (effect.mask && effect.mask.enable) {
            await this.drawMask(effect);
        }

        if (effect.filling && effect.filling.enable) {
            await this.drawFill(effect);
        } else {
            this.drawFillOriginImage(effect);
        }

        if (effect.insetShadow && effect.insetShadow.enable) {
            this.drawInsetShadow(effect);
        }

        if (effect.stroke && effect.stroke.enable) {
            this.drawStroke(effect);
        }
    }

    /** 渲染特效蒙版 */
    async drawMask(effect: IImageEffect) {
        let drawMaskPromise: Promise<void> | Bluebird<void> = Promise.resolve();

        if (!effect.mask) {
            return;
        }
        if (effect.mask.type === 'image') {
            if (effect.mask.image) {
                drawMaskPromise = this.envContext
                    .loadImage(effect.mask.image)
                    .then((img: HTMLImageElement) => {
                        this.drawerCtx.drawImage(this.imgCanvas, 0, 0);
                        this.drawerCtx.globalCompositeOperation = 'destination-in';
                        if (this.imgCanvas.height * img.width > this.imgCanvas.width * img.height) {
                            const w = this.imgCanvas.width;
                            const h = (img.height * this.imgCanvas.width) / img.width;
                            this.drawerCtx.drawImage(img, 0, (this.imgCanvas.height - h) / 2, w, h);
                        } else {
                            const w = (img.width * this.imgCanvas.height) / img.height;
                            const h = this.imgCanvas.height;
                            this.drawerCtx.drawImage(img, (this.imgCanvas.width - w) / 2, 0, w, h);
                        }
                    });
            }
        } else {
            clipImage(this.drawerCtx, this.imgCanvas, effect.mask);
        }
        await drawMaskPromise;

        this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        this.imgCtx.drawImage(this.drawerCanvas!, 0, 0);

        this.drawerCtx.clearRect(0, 0, this.width, this.height);
        this.drawerCtx.restore();
        this.drawerCtx.save();
    }

    /**
     * 渲染填充特效
     */
    async drawFill(effect: IImageEffect) {
        if (!effect.filling) {
            return;
        }
        let drawFillPromise: Promise<void> = Promise.resolve();
        this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
        this.drawerCtx.globalCompositeOperation = 'source-in';

        // 纯色
        if (['color', 0].includes(effect.filling.type)) {
            this.drawerCtx.fillStyle = tinyColor(effect.filling.color).toString('rgb');
            this.drawerCtx.fillRect(0, 0, this.width, this.height);
            drawFillPromise = Promise.resolve();
        }

        // 渐变色
        if (['gradient', 2].includes(effect.filling.type) && effect.filling.gradient) {
            const w = this.imgCanvas.width / 2;
            const h = this.imgCanvas.height / 2;
            // 浏览器 的 y 轴往下，正旋转方向为顺时针，ps 的 y 轴 往上，正旋转方向为逆时针
            // 稿定设计为方便设计师沿用 ps 的设计习惯，故需要将角度反向
            const angle = -(effect.filling.gradient.angle / 180) * Math.PI;
            const r = Math.abs(Math.cos(angle)) * w + Math.abs(Math.sin(angle)) * h;
            const lineGrad = this.drawerCtx.createLinearGradient(
                w - r * Math.cos(angle) + this.expand.left,
                h - r * Math.sin(angle) + this.expand.top,
                w + r * Math.cos(angle) + this.expand.left,
                h + r * Math.sin(angle) + this.expand.top,
            );
            for (const colorSet of effect.filling.gradient.stops) {
                colorSet.color = tinyColor(colorSet.color).toString('rgb');
                lineGrad.addColorStop(colorSet.offset, colorSet.color);
            }
            this.drawerCtx.fillStyle = lineGrad;
            this.drawerCtx.fillRect(
                this.expand.left,
                this.expand.top,
                this.imgCanvas.width,
                this.imgCanvas.height,
            );
            drawFillPromise = Promise.resolve();
        }

        // 图案填充
        if (['image', 1].includes(effect.filling.type) && effect.filling.imageContent) {
            const { imageContent } = effect.filling;
            if (imageContent.image) {
                drawFillPromise = getImageEffectFillImage(
                    imageContent,
                    {
                        width: this.imgCanvas.width,
                        height: this.imgCanvas.height,
                    },
                    this.envContext,
                ).then((img: HTMLCanvasElement) => {
                    this.drawerCtx.fillStyle = 'rgba(255,255,255,1)';
                    this.drawerCtx.fillRect(0, 0, this.width, this.height);
                    this.drawerCtx.drawImage(img, this.expand.left, this.expand.top);
                });
            } else {
                console.error('图片特效填充类型为图片，但没有imageUrl');
            }
        }

        await drawFillPromise;
        this.drawToView(effect);
    }

    /** 渲染填充原图 */
    drawFillOriginImage(effect?: IImageEffect) {
        this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
        this.drawToView(effect);
    }

    /**
     * 渲染描边
     */
    drawStroke(effect: IImageEffect) {
        if (!effect.stroke) {
            return;
        }
        let offsetX = 0;
        let offsetY = 0;

        // 为了避免边框绘制的时候被裁切掉一部分，绘制的时候需要带上偏移值
        if (effect.offset && effect.offset.enable) {
            offsetX = effect.offset.x;
            offsetY = effect.offset.y;
        }
        offsetX += this.expand.left;
        offsetY += this.expand.top;
        const { color, width: strokeWidth } = effect.stroke;

        if (strokeWidth <= 0) {
            return;
        }
        for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            const x = strokeWidth * Math.cos(angle) + offsetX;
            const y = strokeWidth * Math.sin(angle) + offsetY;

            this.drawerCtx.drawImage(this.imgCanvas, x, y);
        }
        this.drawerCtx.globalCompositeOperation = 'source-in';
        this.drawerCtx.fillStyle = color;
        this.drawerCtx.fillRect(0, 0, this.width, this.height);
        this.drawerCtx.globalCompositeOperation = 'destination-out';
        this.drawerCtx.drawImage(this.imgCanvas, offsetX, offsetY);
        this.drawToView();
    }

    /**
     * 填充内阴影
     */
    drawInsetShadow(effect: IImageEffect) {
        if (!effect.insetShadow) {
            return;
        }
        const { blur: blurWidth, color, offsetX, offsetY } = effect.insetShadow;
        const tempCanvas = this.envContext.createCanvas(
            this.width + blurWidth * 2,
            this.height + blurWidth * 2,
            true,
        );

        // 掏一个洞并预留一定的阈值，这样阴影会更清晰
        const tempCtx = tempCanvas.getContext('2d');
        const drawOffsetX = blurWidth + offsetX;
        const drawOffsetY = blurWidth + offsetY;
        tempCtx.drawImage(this.imgCanvas, drawOffsetX, drawOffsetY, this.width, this.height);
        tempCtx.globalCompositeOperation = 'xor';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 对已经掏完洞的画布做阴影
        this.drawerCtx.save();
        this.drawerCtx.shadowBlur = blurWidth;
        this.drawerCtx.shadowColor = color;
        this.drawerCtx.shadowOffsetX = offsetX + this.expand.left;
        this.drawerCtx.shadowOffsetY = offsetY + this.expand.top;
        this.drawerCtx.drawImage(tempCanvas, -drawOffsetX, -drawOffsetY);
        this.drawerCtx.restore();

        // 裁剪图形，保留内阴影
        this.drawerCtx.globalCompositeOperation = 'destination-in';
        this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
        this.drawerCtx.globalCompositeOperation = 'source-over';

        this.drawToView(effect);
    }

    /**
     * 将 drawerCanvas 内容绘制到 viewCanvas
     */
    drawToView(effect?: IImageEffect) {
        let offsetX = 0;
        let offsetY = 0;

        // 有传 effect 时将应用特效的偏移数据
        if (effect && effect.offset && effect.offset.enable) {
            offsetX = effect.offset.x;
            offsetY = effect.offset.y;
        }
        this.viewCtx.drawImage(this.drawerCanvas, offsetX, offsetY);
        this.drawerCtx.clearRect(0, 0, this.width, this.height);

        // 还原初始状态，并重新记录当前状态
        this.drawerCtx.restore();
        this.drawerCtx.save();
    }
}
