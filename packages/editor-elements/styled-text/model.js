import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { serialize } from '@gaoding/editor-framework/src/utils/utils';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

export default class StyledTextModel extends BaseModel {
    constructor(data) {
        super(data);

        this.image = Object.assign(
            {
                url: '',
                offset: {
                    x: 0,
                    y: 0,
                },
                width: 0,
                height: 0,
            },
            data.image,
        );
        this.effectStyle = data.effectStyle || { name: '', id: 0, effectFontId: 0 };

        this.autoScale = true;
        this.writingMode = data.writingMode || editorDefaults.textElement.writingMode;
        this.lineHeight = data.lineHeight || editorDefaults.textElement.lineHeight;
        this.textAlign = data.textAlign || editorDefaults.textElement.textAlign;
        this.letterSpacing = data.letterSpacing || editorDefaults.textElement.letterSpacing;
        this.color = data.color || '#000';

        if (!this.contents || !this.contents.length) {
            this.contents = serialize.fromJSON(this.content || '', this);
        }
    }
}
