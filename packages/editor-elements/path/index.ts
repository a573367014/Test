import PathModel from './model';
import PathElement from './path-element';
import { PathEditor } from './path-editor/path-editor';
import { PathService } from './service';

export default {
    model: PathModel,
    layoutComponent: PathElement,
    editComponent: PathEditor,
    service: PathService,
};
