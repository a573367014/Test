import { render as renderShadow, getCacheBBoxData, Shadow } from '@gaoding/shadow';
import { BaseImageEffectEngine } from '../utils/base-image-effect-engine';
import { createCanvas } from '../../canvas';
import { loadImage } from '../../loader';
import { calculateEffectExpand, calculateImageShadowExpand, getExpandByExpands } from './expand';
import { isMaskElement } from '../../element';
import { murmurHash2 } from '../../hash';

export class ImageEffectEngine extends BaseImageEffectEngine {
    /** 用于计算投影扩展数据的缓存key */
    shadowExpandCacheKey?: string;

    constructor() {
        super({ env: 'browser', createCanvas, loadImage });
    }

    async setExpand() {
        const maskHash = isMaskElement(this.element) ? murmurHash2(this.element.mask) : '';
        this.shadowExpandCacheKey =
            this.element.url + this.element.width + this.element.height + this.id + maskHash;

        // 将特效与投影的 expand 拆开写是因为投影比较独立，绘制到这边需要加上特效的偏移
        this.effectExpand = calculateEffectExpand(this.element);
        this.shadowExpand = await calculateImageShadowExpand(
            this.element,
            this.shadowExpandCacheKey,
        );

        this.expand = getExpandByExpands([this.shadowExpand, this.effectExpand]);
    }

    /**
     * 渲染投影
     */
    async drawShadows() {
        if (!this.originalImg) {
            throw new Error('Can not find the this.originalImg');
        }
        this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        this.imgCtx.drawImage(this.originalImg, 0, 0);
        const shadowExpandCacheKey = this.shadowExpandCacheKey || String(Date.now());

        const { bbox, points, bottomArray } = getCacheBBoxData(
            this.imgCanvas,
            shadowExpandCacheKey,
        );
        const hasValidShadow = this.shadows.some((sh) => sh.enable);
        if (!hasValidShadow) {
            return Promise.resolve();
        }

        const shadows = this.shadows as Shadow[];
        const shadowCanvas = renderShadow({
            image: this.imgCanvas,
            shadows,
            bbox,
            points,
            bottomArray,
            imgUrl: shadowExpandCacheKey,
        });

        // 投影画面绘制到需要带上偏移
        const offsetX = Math.max(0, this.effectExpand.left - this.shadowExpand.left);
        const offsetY = Math.max(0, this.effectExpand.top - this.shadowExpand.top);
        this.drawerCtx.drawImage(shadowCanvas, offsetX, offsetY);

        this.drawToView();
    }
}
