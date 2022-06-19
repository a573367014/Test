import { ref, Ref } from '@vue/composition-api';
import { cloneDeep } from 'lodash';
import { ImageEffectEngine } from '@gaoding/editor-utils/effect/browser/image-effect-engine';
import { loadImage } from '@gaoding/editor-utils/loader';
import type { IImageElement } from '@gaoding/editor-utils/types/image';
// @ts-ignore 图片资源
import effectPreviewImg from './effect-preview-img.svg';

/** 预览图最大宽度 */
const baseWidth = 22;

function getPreviewSize(img: HTMLImageElement) {
    let w: number, h: number;

    if (img.width > img.height) {
        w = baseWidth;
        h = (w * img.height) / img.width;
    } else {
        h = baseWidth;
        w = (h * img.width) / img.height;
    }
    return { w, h };
}

export function useDrawEffect(
    element: Ref<IImageElement>,
    previewImgRef: Ref<HTMLCanvasElement | null>,
) {
    const imageEffectEngine = new ImageEffectEngine();
    const originImg = ref<HTMLImageElement | null>(null);

    return async () => {
        const previewCanvas = previewImgRef.value;
        if (!previewCanvas) {
            return;
        }
        if (!originImg.value) {
            originImg.value = (await loadImage(effectPreviewImg)) as HTMLImageElement;
        }
        // 各个尺寸
        const imgSize = { w: originImg.value.width, h: originImg.value.height };
        const previewSize = getPreviewSize(originImg.value);
        let result: HTMLCanvasElement | HTMLImageElement;

        if (element.value.hasEffects) {
            const cloneElement = cloneDeep(element.value);
            cloneElement.width = imgSize.w;
            cloneElement.height = imgSize.h;

            // 绘制特效，拿到绘制的结果和包围盒变化数据
            const {
                canvas,
                effectModel: { effectedResult },
            } = await imageEffectEngine.applyEffects(originImg.value, cloneElement, false);

            const sizeRatio = previewSize.w / imgSize.w;
            const width = effectedResult!.width * sizeRatio;
            const height = effectedResult!.height * sizeRatio;
            const left = effectedResult!.left * sizeRatio;
            const top = effectedResult!.top * sizeRatio;

            // 设置预览画布宽高和位置
            previewCanvas.width = width;
            previewCanvas.height = height;
            previewCanvas.style.transform = `translate(${left}px, ${top}px)`;
            result = canvas;
        } else {
            // 设置预览画布宽高和位置
            previewCanvas.width = previewSize.w;
            previewCanvas.height = previewSize.h;
            previewCanvas.style.transform = 'none';
            result = originImg.value;
        }

        const ctx = previewCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.drawImage(result, 0, 0, previewCanvas.width, previewCanvas.height);
    };
}
