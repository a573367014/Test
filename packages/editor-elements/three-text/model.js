import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { serialize } from '@gaoding/editor-framework/src/utils/utils';
import { defaultsDeep } from 'lodash';
import tinycolor from 'tinycolor2';

import defaultModel from './default-model';

class ThreeTextModel extends BaseModel {
    constructor(data) {
        super(data);
        if (!this.contents || !this.contents.length) {
            this.contents = serialize.fromJSON(this.content || '', this);
        }
        defaultsDeep(this, defaultModel);
        const { frontMaterials, sideMaterials, bevelMaterials } = this.layers[0];
        const isWhite = (color) => color.toHex8String().toLowerCase() === '#ffffffff';
        let color = tinycolor('#000');
        const materials = [frontMaterials, sideMaterials, bevelMaterials];
        for (let i = 0; i < materials.length; i++) {
            const baseColor = tinycolor(materials[i].albedo.color);
            if (!isWhite(baseColor)) {
                color = baseColor;
                break;
            }
        }
        const layer = this.layers[0];
        layer.expand = layer.expand || layer.scale || 0;
        delete layer.scale;
        this.contents = this.contents
            .map((content) => {
                return Object.assign(content, {
                    color: color.toHex8String(),
                    fontFamily: this.fontFamily,
                    fontStyle: this.fontStyle || 'normal',
                    fontSize: this.fontSize,
                    fontWeight: this.fontWeight || 400,
                    textDecoration: this.textDecoration || 'none',
                });
            })
            .filter((item) => item.content);

        if (layer.extrudeScaleX || layer.extrudeScaleY) {
            this.deformation.extrudeScaleX = layer.extrudeScaleX;
            this.deformation.extrudeScaleY = layer.extrudeScaleY;
            delete layer.extrudeScaleX;
            delete layer.extrudeScaleY;
        }
    }
}

export default ThreeTextModel;
