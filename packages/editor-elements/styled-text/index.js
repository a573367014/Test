import model from './model';
import methods from './methods';
import StyledTextElement from './styled-text-element';
import StyledTextEditor from '../text/text-editor';

export default {
    model,
    methods,
    layoutComponent: StyledTextElement,
    editComponent: StyledTextEditor,
};
