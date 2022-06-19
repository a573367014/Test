import model from './model';
import WatermarkElement from './watermark';
import methods from './methods';
import WatermarkEditor from './watermark-editor';

export default {
    model,
    methods,
    layoutComponent: WatermarkElement,
    editComponent: WatermarkEditor,
};
