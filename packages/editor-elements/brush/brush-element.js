import Promise from 'bluebird';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './brush-element.html';

export default inherit(BaseElement, {
    name: 'brush-element',
    template,
    data() {
        return {};
    },
    computed: {
        shapeStyle() {
            const { model } = this;
            const strokeLineStyle = {};
            const strokeWidth = Math.max(1, model.strokeWidth);

            if (model.strokeLineStyle === 'dashed') {
                strokeLineStyle.strokeDasharray = `${strokeWidth * 2} ${strokeWidth}`;
                if (model.strokeDasharray.length) {
                    strokeLineStyle.strokeDasharray = model.strokeDasharray
                        .map((val) => val * strokeWidth)
                        .join(' ');
                }
            } else if (model.strokeLineStyle === 'dotted') {
                strokeLineStyle.strokeLinecap = 'round';
                strokeLineStyle.strokeDasharray = `0 ${strokeWidth * 2}`;

                if (model.strokeDasharray.length) {
                    strokeLineStyle.strokeDasharray = model.strokeDasharray
                        .map((val, i) => {
                            if (i % 2 === 0) {
                                return val * strokeWidth - strokeWidth;
                            }
                            return val * strokeWidth * 2;
                        })
                        .join(' ');
                }
            } else {
                strokeLineStyle.strokeLinecap = 'round';
            }

            return {
                ...strokeLineStyle,
                stroke: model.stroke,
                strokeWidth: strokeWidth,
            };
        },
        path() {
            return this.model.path;
        },
    },
    methods: {
        load() {
            return Promise.resolve();
        },
    },
});
