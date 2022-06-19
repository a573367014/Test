import { getFillTransform } from './transform';
import resizeImage from '../../resize-image';
import type { IFillingImageContent } from '../../types/effect/filling-image-content';

const mapCacheImage: Record<string, HTMLCanvasElement> = {};

const getCacheKey = (
    imageContent: IFillingImageContent,
    targetSize: { width: number; height: number },
) => {
    return (
        '' +
        imageContent.width +
        imageContent.height +
        imageContent.image +
        imageContent.repeat +
        imageContent.scaleX +
        imageContent.scaleY +
        imageContent.type +
        targetSize.width +
        targetSize.height
    );
};

/**
 *  获取特效填充内容
 * @param {object} imageContent
 * @param {object} targetSize
 */
export async function getImageEffectFillImage(
    imageContent: IFillingImageContent,
    targetSize: { width: number; height: number },
    envContext?: Record<string, any>,
) {
    // 图案填充渲染速度很慢，加入缓存避免每次都重新渲染
    const cacheKey = getCacheKey(imageContent, targetSize);
    if (mapCacheImage[cacheKey]) {
        return mapCacheImage[cacheKey];
    }

    let loadedImage: HTMLCanvasElement | HTMLImageElement;
    if (typeof imageContent.image === 'object') {
        loadedImage = imageContent.image;
    } else {
        loadedImage = await envContext.loadImage(imageContent.image);
    }
    const tsf = getFillTransform(
        imageContent.type,
        { width: loadedImage.width, height: loadedImage.height },
        targetSize,
        { scaleX: imageContent.scaleX, scaleY: imageContent.scaleY },
    );
    const clipCanvas = envContext.createCanvas(
        loadedImage.width * tsf[0] ?? 100,
        loadedImage.height * tsf[3] ?? 100,
    );
    const clipImage = await resizeImage(loadedImage, clipCanvas, { alpha: true });
    const canvas = envContext.createCanvas(targetSize.width, targetSize.height);
    const ctx = canvas.getContext('2d')!;
    if (imageContent.type === 'tiled' || !imageContent.type) {
        ctx.fillStyle = ctx.createPattern(clipImage, 'repeat')!;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(clipImage, tsf[4], tsf[5]);
    }

    mapCacheImage[cacheKey] = canvas;
    return canvas;
}
