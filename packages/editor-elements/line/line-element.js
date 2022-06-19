import Promise from 'bluebird';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './line-element.html';

export default inherit(BaseElement, {
    name: 'line-element',
    template,
    data() {
        return {};
    },
    computed: {
        cssStyle() {
            const { model, global } = this;

            return {
                height: Math.max(1, model.strokeWidth * global.zoom) + 'px',
            };
        },
        shapeAttr() {
            const { model, shapeStyle } = this;
            let x1 = 0;
            let x2 = model.width;
            if (shapeStyle.strokeLinecap === 'round') {
                x1 = model.strokeWidth / 2;
                x2 = model.width - model.strokeWidth / 2;
            }

            return {
                x1,
                x2,
                y1: model.strokeWidth / 2,
                y2: model.strokeWidth / 2,
            };
        },
        shapeStyle() {
            const { model } = this;
            const strokeLineStyle = {};

            if (model.strokeLineStyle === 'dashed') {
                strokeLineStyle.strokeDasharray = `${model.strokeWidth * 2} ${model.strokeWidth}`;
                if (model.strokeDasharray.length) {
                    strokeLineStyle.strokeDasharray = model.strokeDasharray
                        .map((val) => val * model.strokeWidth)
                        .join(' ');
                }
            } else if (model.strokeLineStyle === 'dotted') {
                strokeLineStyle.strokeLinecap = 'round';
                strokeLineStyle.strokeDasharray = `0 ${model.strokeWidth * 2}`;

                if (model.strokeDasharray.length) {
                    strokeLineStyle.strokeDasharray = model.strokeDasharray
                        .map((val, i) => {
                            if (i % 2 === 0) {
                                return val * model.strokeWidth - model.strokeWidth;
                            }
                            return val * model.strokeWidth * 2;
                        })
                        .join(' ');
                }
            } else {
                strokeLineStyle.strokeLinecap = 'round';
            }

            return {
                ...strokeLineStyle,
                stroke: model.stroke,
                strokeWidth: model.strokeWidth,
                fill: 'none',
            };
        },
    },
    methods: {
        load() {
            return Promise.resolve();
        },
    },
    mounted() {
        this.model.$getResizeLimit = () => ({
            maxWidth: Infinity,
            minWidth: this.model.strokeWidth * this.editor.zoom,
            maxHeight: Infinity,
            minHeight: this.model.strokeWidth * this.editor.zoom,
        });
    },
});
