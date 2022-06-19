import model from './model';
import methods from './methods';
import MaskElement from './mask-element';
import MaskEditor from '@gaoding/editor-framework/src/static/mask-editor';

export default {
    model,
    methods,
    layoutComponent: MaskElement,
    editComponent: MaskEditor,
};
