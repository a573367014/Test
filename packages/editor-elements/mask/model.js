import ImageBaseModel from '../image-base-model';
import { version } from '@gaoding/editor-framework/src/utils/utils';

class MaskModel extends ImageBaseModel {
    constructor(data, options) {
        const modelVersion = version.parse(data.version || '0.0.0');
        // Compatible old datas;
        if (modelVersion.major < 2) {
            data.imageUrl = data.imageUrl || data.image;

            delete data.image;

            const { clip } = data;
            if (clip) {
                data.imageWidth += clip.left + clip.right;
                data.imageHeight += clip.top + clip.bottom;

                const imageTransform = data.imageTransform;
                if (!imageTransform) {
                    data.imageTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
                }
                data.imageTransform.tx = -clip.left;
                data.imageTransform.ty = -clip.top;
                delete data.clip;
            }
        }

        super(data, options);
    }
}

export default MaskModel;
