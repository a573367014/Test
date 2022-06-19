import Promise from 'bluebird';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import template from './arrow-element.html';
import utils from '@gaoding/editor-framework/src/utils/utils';

export default inherit(BaseElement, {
    name: 'arrow-element',
    template,
    data() {
        return {
            scale: 1,
            headSvgContent: '',
            tailSvgContent: '',
        };
    },
    computed: {
        mainInnerStyle() {
            const model = this.model;
            const $originalScale = model.$originalScale || 1;
            return {
                transform: `scale(${this.global.zoom * model.$minScale * $originalScale})`,
                transformOrigin: '0 0',
            };
        },
        headStyle() {
            const model = this.model;
            return {
                fill: model.color,
                left: model.$headLeft + 'px',
                top: model.head.top + 'px',
            };
        },
        tailStyle() {
            const model = this.model;
            return {
                fill: model.color,
                left: model.tail.left + 'px',
                top: model.tail.top + 'px',
            };
        },
        trunkStyle() {
            const model = this.model;
            return {
                left: model.trunk.left + 'px',
                top: model.trunk.top + 'px',
            };
        },
        trunkPath() {
            const model = this.model;
            const higherLeft = model.trunk.leftHeight > model.trunk.rightHeight;
            const startY = higherLeft
                ? 0
                : model.tail.top -
                  model.trunk.top -
                  (model.trunk.leftHeight - model.tail.height) / 2;
            const endY = higherLeft
                ? model.head.top -
                  model.trunk.top -
                  (model.trunk.rightHeight - model.head.height) / 2
                : 0;

            return `M0 ${startY} L${model.$trunkWidth} ${endY} V${
                endY + model.trunk.rightHeight
            } L0 ${startY + model.trunk.leftHeight}`;
        },
    },
    methods: {
        // load() {
        //     return Promise.resolve();
        // },
        load() {
            const { model } = this;
            const { head, tail } = model;
            const promiseArr = [];

            if (!head.svg.includes('<svg')) {
                promiseArr.push(
                    utils.loadXMLStr(head.svg).then((xml) => {
                        head.$svg = xml;
                    }),
                );
            } else {
                head.$svg = '';
            }
            if (!tail.svg.includes('<svg')) {
                promiseArr.push(
                    utils.loadXMLStr(tail.svg).then((xml) => {
                        tail.$svg = xml;
                    }),
                );
            } else {
                tail.$svg = '';
            }

            return Promise.all(promiseArr).then(() => {
                this.parse();
            });
        },
        parse() {
            const model = this.model;
            const svgReg = /(^\s*<svg[^<]*>)|(<\/svg[^<]*>\s*$)/g;
            this.headSvgContent = (model.head.$svg || model.head.svg).replace(svgReg, '');
            this.tailSvgContent = (model.tail.$svg || model.tail.svg).replace(svgReg, '');
        },
    },
    watch: {
        'model.head.svg'() {
            this.checkLoad();
        },
        'model.tail.svg'() {
            this.checkLoad();
        },
    },
    mounted() {},
});
