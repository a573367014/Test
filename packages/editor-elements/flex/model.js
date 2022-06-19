import merge from 'lodash/merge';
import EditorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import GroupModel from '../group/model';

class FlexModel extends GroupModel {
    constructor(data) {
        super(data);

        data.elements.forEach((element) => {
            element.flex = merge({}, EditorDefaults.flex, element.flex);
        });
    }
}

export default FlexModel;
