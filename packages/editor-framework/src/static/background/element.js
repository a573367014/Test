import get from 'lodash/get';
import template from './element.html';
import tinycolor from 'tinycolor2';
import { parseTransform } from '@gaoding/editor-utils/transform';

export default {
    props: ['layout', 'element', 'global', 'options', 'selected', 'mode'],
    name: 'editor-element-background',
    template,
    data() {
        return {};
    },

    computed: {
        editor() {
            return this.$parent.editor || this.$parent.$parent;
        },
        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },

        model() {
            return this.element;
        },
        opacity() {
            return get(this, 'model.backgroundEffect.opacity', 1);
        },
        effectImage() {
            return (
                get(this, 'element.backgroundEffect.type') === 'image' &&
                get(this, 'element.backgroundEffect.image')
            );
        },
        effectGradient() {
            return (
                get(this, 'element.backgroundEffect.type') === 'gradient' &&
                get(this, 'element.backgroundEffect.gradient')
            );
        },

        $imageWidth() {
            return Math.abs(this.effectImage.naturalWidth * this.backgroundTransform.scale.x);
        },
        $imageHeight() {
            return Math.abs(this.effectImage.naturalHeight * this.backgroundTransform.scale.y);
        },
        $imageLeft() {
            const {
                backgroundTransform: { position },
                $imageWidth,
                model: { width },
            } = this;

            return width / 2 - $imageWidth / 2 + position.x;
        },
        $imageTop() {
            const {
                backgroundTransform: { position },
                $imageHeight,
                model: { height },
            } = this;

            return height / 2 - $imageHeight / 2 + position.y;
        },

        backgroundImage() {
            return this.effectImage && this.effectImage.url;
        },
        backgroundTransform() {
            const transform = this.effectImage.transform;
            return transform.toJSON ? transform : parseTransform(transform);
        },
        backgroundImageInfo() {
            return this.layout.backgroundImageInfo || {};
        },
        backgroundColor() {
            const { backgroundColor: color } = this.model;
            return color ? tinycolor(color).toString('rgb') : '';
        },

        mainStyle() {
            const { effectGradient, opacity } = this;
            const style = {
                opacity,
            };

            if (effectGradient) {
                const result = [];

                // Gradient is not performance same as PS.
                result.push(90 - effectGradient.angle + 'deg');

                effectGradient.stops.forEach((item) => {
                    result.push(`${item.color} ${item.offset * 100}%`);
                });

                const gradientString = result.join(',');

                style.backgroundImage = `linear-gradient(${gradientString})`;
            }
            return style;
        },
        imageStyle() {
            const {
                global,
                backgroundTransform: { scale, rotation },
                opacity,
            } = this;

            return {
                position: 'absolute',
                left: this.$imageLeft * global.zoom + 'px',
                top: this.$imageTop * global.zoom + 'px',
                width: this.$imageWidth * global.zoom + 'px',
                height: this.$imageHeight * global.zoom + 'px',
                transform: `rotate(${rotation}rad) scale(${scale.x > 0 ? 1 : -1}, ${
                    scale.y > 0 ? 1 : -1
                })`,
                opacity: opacity,
            };
        },
    },
};
