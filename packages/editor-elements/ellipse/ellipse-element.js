import Promise from 'bluebird';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './ellipse-element.html';

export default inherit(BaseElement, {
    name: 'ellipse-element',
    template,
    data() {
        return {};
    },
    computed: {
        shapeAttr() {
            const { model } = this;
            const centerX = model.width / 2;
            const centerY = model.height / 2;

            return {
                cx: centerX,
                cy: centerY,
                rx: model.width / 2 - model.strokeWidth / 2,
                ry: model.height / 2 - model.strokeWidth / 2,
            };
        },
        shapeStyle() {
            const { model } = this;
            const strokeLineStyle = {};

            if (model.strokeLineStyle === 'dashed') {
                strokeLineStyle.strokeDasharray = `${model.strokeWidth * 2} ${model.strokeWidth}`;
            } else if (model.strokeLineStyle === 'dotted') {
                strokeLineStyle.strokeLinecap = 'round';
                strokeLineStyle.strokeDasharray = `0 ${model.strokeWidth * 2}`;
            }

            return {
                ...strokeLineStyle,
                stroke: model.stroke,
                strokeWidth: model.strokeWidth,
                fill: model.fill || 'transparent',
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
            minWidth: (this.model.strokeWidth * 2 + 1) * this.editor.zoom,
            maxHeight: Infinity,
            minHeight: (this.model.strokeWidth * 2 + 1) * this.editor.zoom,
        });
    },
});
