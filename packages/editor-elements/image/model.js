import { isAnimationImage } from '@gaoding/editor-utils/element';
import ImageBaseModel from '../image-base-model';

class ImageModel extends ImageBaseModel {
    constructor(data, options) {
        const { clip } = data;

        if (clip && !data.imageTransform) {
            data.imageWidth = clip.left + clip.right + data.width;
            data.imageHeight = clip.top + clip.bottom + data.height;

            const imageTransform = data.imageTransform;
            if (!imageTransform) {
                data.imageTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
            }
            data.imageTransform.tx = -clip.left;
            data.imageTransform.ty = -clip.top;
        }

        super(data, options);

        if (!this.hasEffects && !this.hasFilters) {
            this.imageUrl = '';
        }

        delete this.mask;
        if (isAnimationImage(data)) {
            this.imageUrl = data.imageUrl || '';
            this.enableDragToMask = false;
        }
    }
}

export default ImageModel;
