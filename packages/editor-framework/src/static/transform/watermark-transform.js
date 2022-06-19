import cloneDeep from 'lodash/cloneDeep';
import assign from 'lodash/assign';
import template from './watermark-transform.html';
import utils from '../../utils/utils';

export default {
    name: 'watermark-transform',
    props: ['editor', 'model', 'options'],
    template,
    filters: {
        angle(angle) {
            angle = Math.round(angle) % 360;
            angle = angle >= 180 ? angle - 360 : angle;
            return angle + '°';
        },
    },
    data() {
        return {
            activeRotatorHeight: 0,
            action: {
                rotate: false,
            },
        };
    },
    computed: {
        rotatorHeight() {
            const rotatorRadius = 11;
            const size = Math.min(this.model.width, this.model.height) * this.zoom;
            let lineH = size / 2 - rotatorRadius;
            lineH -= 0.1 * (lineH - this.elRadius);

            return Math.min(60, lineH);
        },
        transform() {
            return this.model.template.transform;
        },
        rotate() {
            return utils.radToDeg(this.transform.rotation) % 360;
        },
        zoom() {
            return this.editor.global.zoom;
        },
    },
    methods: {
        initRotator(e) {
            const self = this;
            const { model, zoom } = this;
            if (e.button !== 0 || model.$draging) {
                return;
            }

            const drag = (this.drag = {
                dotX: 0,
                dotY: 0,
                clientX: 0,
                clientY: 0,
                model: cloneDeep(model),
                width: model.width,
                height: model.height,
                left: this.transform.position.x,
                top: this.transform.position.y,
                rotate: utils.radToDeg(this.transform.rotation),

                move(e) {
                    e.preventDefault();
                    let rotate = utils.getAngle(e.clientX, e.clientY, drag.dotX, drag.dotY, -90);

                    // 按shift键时，旋转结果值以10度的倍数取整
                    if (e.shiftKey) {
                        rotate = Math.round(rotate / 10) * 10;
                    }

                    if (!e.ctrlKey) {
                        [
                            { angle: 30, edge: 2 },
                            { angle: 45, edge: 3 },
                        ].some((item) => {
                            const angle = item.angle;
                            const edge = item.edge;
                            const closest = Math.round(rotate / angle) * angle;

                            if (Math.abs(closest - rotate) < edge) {
                                rotate = closest;
                                return true;
                            }

                            return false;
                        });
                    }

                    setRotatorHeight(e);

                    // event
                    if (!drag.draging) {
                        drag.draging = true;
                        self.action.rotate = true;
                    }

                    self.editor.$events.$emit('watermarkEditor.rotate', rotate);
                },
                cancel() {
                    const callback = () => {
                        self.drag = null;
                        model.$draging = false;

                        // event
                        if (drag.draging) {
                            drag.draging = false;
                            self.action.rotate = false;
                        }
                    };

                    window.removeEventListener('mousemove', drag.move);
                    window.removeEventListener('mouseup', drag.cancel);
                    callback();
                },
            });

            const setRotatorHeight = (e) => {
                const rect = this.$el.getBoundingClientRect();
                const point = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };

                const dep = Math.sqrt(
                    Math.pow(point.x - e.clientX, 2) + Math.pow(point.y - e.clientY, 2),
                );

                this.activeRotatorHeight = dep;
            };

            const shellRect = this.editor.container[0]
                .querySelector('.editor-shell')
                .getBoundingClientRect();

            const modelRect = this.model;
            const height = zoom * modelRect.height;
            const width = zoom * modelRect.width;
            const left = zoom * modelRect.left;
            const top = zoom * (modelRect.top + self.editor.currentLayout.top);
            // props
            assign(drag, {
                dotX: shellRect.left + left + width / 2,
                dotY: shellRect.top + top + height / 2,
                clientX: e.clientX,
                clientY: e.clientY,
            });

            // lock drag
            model.$draging = true;

            setRotatorHeight(e);

            window.addEventListener('mousemove', drag.move);
            window.addEventListener('mouseup', drag.cancel);
        },
    },
};
