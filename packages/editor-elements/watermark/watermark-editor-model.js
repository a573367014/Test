import { set, get, cloneDeep } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';

export class WatermarkEditorModel extends BaseModel {
    constructor(data) {
        super(data);

        const transform = get(
            data,
            'template.transform',
            cloneDeep(editorDefaults.element.transform),
        );
        set(this, 'template.transform', this.parseTransform(transform));
    }

    get scale() {
        const transform = this.template.transform;
        return Math.min(transform.scale.x, transform.scale.y);
    }

    set scale(value) {
        const transform = this.template.transform;
        transform.scale.x = value.x;
        transform.scale.y = value.y;
    }
}
