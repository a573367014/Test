import model from './model';
import methods from './methods';
import VideoElement from './video-element';
import MaskEditor from '@gaoding/editor-framework/src/static/mask-editor';

export default {
    model,
    methods,
    layoutComponent: VideoElement,
    editComponent: MaskEditor,
};
