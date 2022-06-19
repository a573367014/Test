import model from './model';
import methods from './methods';
import TextElement from './text-element';
import TextEditor from './text-editor';

export default {
    model,
    methods,
    layoutComponent: TextElement,
    editComponent: TextEditor,
};
