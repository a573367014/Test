import model from './model';
import methods from './methods';
import ImageElement from './image-element';
import MaskEditor from '@gaoding/editor-framework/src/static/mask-editor';

export default {
    model,
    methods,
    layoutComponent: ImageElement,
    editComponent: MaskEditor,
};
