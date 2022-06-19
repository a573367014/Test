import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { hexaToRgba, useEffects } from '@gaoding/editor-framework/src/utils/model-adaptation';

import { defaultsDeep } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

class EffectTextModel extends BaseModel {
    constructor(data) {
        super(data);

        defaultsDeep(this, editorDefaults.effectTextElement);
        // 同步用来排版的基础宽高,兼容老数据
        if (
            !this.typoWidthRatio ||
            !this.typoHeightRatio ||
            (this.typoWidthRatio === 1 && this.typoHeightRatio === 1)
        ) {
            this.typoWidthRatio = this.baseWidthRatio || this.baseWidth / this.width || 1;
            this.typoHeightRatio = this.baseHeightRatio || this.baseHeight / this.height || 1;
        }
        ['baseWidth', 'baseHeight', 'baseWidthRatio', 'baseHeightRatio'].forEach((attr) => {
            if (this[attr] !== undefined) {
                delete this[attr];
            }
        });
        this.$typoWidth = this.width * this.typoWidthRatio;
        this.$typoHeight = this.height * this.typoHeightRatio;
        this.resize = 1;
        // Compatible 修正颜色 支持8为16进制： #000000FF
        if (this.backgroundColor) {
            this.backgroundColor = hexaToRgba(this.backgroundColor);
        }

        if (this.color) {
            this.color = hexaToRgba(this.color);
        }

        if (this.textShadow) {
            const shadow = this.textShadow;

            shadow.color = hexaToRgba(shadow.color);
        }

        if (this.textEffects && this.textEffects.length) {
            this.textEffects.forEach((effect) => {
                if (effect.stroke) {
                    effect.stroke.color = hexaToRgba(effect.stroke.color);
                }

                if (effect.shadow) {
                    effect.shadow.color = hexaToRgba(effect.shadow.color);
                }

                if (effect.insetShadow) {
                    effect.insetShadow.color = hexaToRgba(effect.insetShadow.color);
                }

                if (effect.filling) {
                    effect.filling.color = hexaToRgba(effect.filling.color);

                    if (effect.filling.gradient) {
                        effect.filling.gradient.stops.forEach((stopPoint) => {
                            stopPoint.color = hexaToRgba(stopPoint.color);
                        });
                    }
                }
            });
        }

        if (this.shadows) {
            this.shadows.forEach((shadow) => {
                if (shadow.color) {
                    shadow.color = hexaToRgba(shadow.color);
                }
            });
        }

        useEffects(this, true);
    }
}

export default EffectTextModel;
