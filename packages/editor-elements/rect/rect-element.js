import Promise from 'bluebird';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './rect-element.html';

export default inherit(BaseElement, {
    name: 'rect-element',
    template,
    data() {
        return {};
    },
    computed: {
        shapeAttr() {
            const { model } = this;
            let radius = model.radius;
            const w = Math.round(model.width - model.strokeWidth);
            const h = Math.round(model.height - model.strokeWidth);

            if (w < 2 * radius) {
                radius = w / 2;
            }
            if (h < 2 * radius) {
                radius = h / 2;
            }

            // chrome 整数时有概率出现消失异常
            radius = radius ? radius + 0.01 : 0;
            const result = {
                x: model.strokeWidth / 2,
                y: model.strokeWidth / 2,
                rx: radius,
                ry: radius,
                width: Math.max(model.strokeWidth + 1, model.width - model.strokeWidth),
                height: Math.max(model.strokeWidth + 1, model.height - model.strokeWidth),
            };

            return result;
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
