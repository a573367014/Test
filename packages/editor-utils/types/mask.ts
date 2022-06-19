import { IImageElement } from './image';

export interface IMaskElement extends IImageElement {
    type: 'mask';
    /**
     * 蒙版图像url地址
     */
    mask: string;

    /**
     * 蒙版元素应用后图像地址，最终 **显示图像** 的地址
     */
    imageUrl: string;
}
