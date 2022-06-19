<template>
    <div ref="wrap">
        <i
            :class="[bem('grip'), bem('grip-s')]"
            :data-cursor="'cursor: ewResize, rotate:' + (-model.rotate + 90)"
            @mousedown.stop="handleGripMousedown($event, 's')"
            @mouseenter.stop="$emit('mouseenter', $event, 's')"
            @mouseleave.stop="$emit('mouseleave', $event, 's')"
        >
            <b />
        </i>
        <i
            :class="[bem('grip'), bem('grip-e')]"
            :data-cursor="'cursor: ewResize, rotate:' + (0 - model.rotate)"
            @mousedown.stop="handleGripMousedown($event, 'e')"
            @mouseenter.stop="$emit('mouseenter', $event, 'e')"
            @mouseleave.stop="$emit('mouseleave', $event, 'e')"
        >
            <b />
        </i>
        <i
            :class="[bem('grip'), bem('grip-se')]"
            :data-cursor="'cursor: ewResize, rotate:' + (-model.rotate - 45)"
            @mousedown.stop="handleGripMousedown"
        >
            <b />
        </i>
        <!-- 旋转按钮 -->
        <i
            :class="bem('rotator')"
            :data-cursor="'cursor: rotator, rotate:' + (0 - model.rotate)"
            @mousedown.stop="initRotaor"
        >
            <b :style="{ transform: transformInvert() }">
                <span v-show="rotating">{{ model.rotate | angle }}</span>
            </b>
        </i>
        <!-- 位移按钮 -->
        <i :class="bem('translator')" data-cursor="move" @mousedown.stop="handleMoveMousedown">
            <b />
        </i>
    </div>
</template>
<script>
import utils from '@gaoding/editor-framework/src/utils/utils';
import $ from '@gaoding/editor-utils/zepto';
import Matrix from '@gaoding/editor-utils/matrix';
import Transform from '@gaoding/editor-utils/transform';
import { assign } from 'lodash';
import { getResizeCursor, angle } from '../utils';
import bemMixin from '../bem.mixin';

export default {
    name: 'table-controller-transform',
    filters: {
        angle,
    },
    mixins: [bemMixin],
    props: {
        model: {
            type: Object,
            default: () => {},
        },
        editor: {
            type: Object,
            default: () => {},
        },
        onGripChange: {
            type: Function,
            default: () => {},
        },
    },
    data() {
        return {
            rotating: false,
        };
    },
    methods: {
        cursor(degree = 0) {
            const rotate = this.model.rotate || 0;
            return getResizeCursor(rotate + degree);
        },
        // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
        transformInvert() {
            const { transform, scaleX, scaleY } = this.model;
            let { a, b, c, d, tx, ty } = transform.localTransform;
            if (scaleX < 0) {
                a = -a;
                b = -b;
            }
            if (scaleY < 0) {
                c = -c;
                d = -d;
            }
            const matrix = new Matrix(a, b, c, d, tx, ty);
            matrix.invert();

            const invertTransform = new Transform();
            invertTransform.setFromMatrix(matrix);
            return invertTransform.toString();
        },
        initRotaor(e) {
            const self = this;
            const { model, editor } = this;
            const doc = $(document);

            if (e.button !== 0 || model.$draging) {
                return;
            }

            this.rotating = true;

            const drag = (this.drag = {
                dotX: 0,
                dotY: 0,
                pageX: 0,
                pageY: 0,
                rotate: 0,
                move(e) {
                    e.preventDefault();
                    if (!self.rotating) return;

                    let rotate = utils.getAngle(e.pageX, e.pageY, drag.dotX, drag.dotY, 90);

                    // 按shift键时，旋转结果值以10度的倍数取整
                    if (e.shiftKey) {
                        rotate = Math.round(rotate / 10) * 10;
                    }

                    if (!e.ctrlKey) {
                        [
                            { angle: 30, edge: 1 },
                            { angle: 45, edge: 1 },
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

                    drag.rotate = rotate;

                    // event
                    if (!drag.draging) {
                        editor.$events.$emit('element.transformStart', model, {
                            action: 'rotate',
                        });
                    }
                    editor.$events.$emit('element.transformRotate', drag, model);
                },
                cancel() {
                    doc.off('mousemove', drag.move);

                    // reset
                    self.drag = null;
                    model.$draging = false;

                    // event
                    if (drag.draging) {
                        self.$events.$emit('element.transformEnd', model, drag, {
                            action: 'rotate',
                        });

                        drag.draging = false;
                    }

                    self.rotating = false;
                },
            });

            const zoom = this.editor.zoom;
            const element = $(e.currentTarget || e.target);
            const shell = element.closest('.editor-shell');
            const shellOffset = shell.offset();

            const height = zoom * model.height;
            const width = zoom * model.width;
            const left = zoom * model.left;
            const top = zoom * (model.top + editor.currentLayout.top);

            // props
            assign(drag, {
                dotX: shellOffset.left + left + width / 2,
                dotY: shellOffset.top + top + height / 2,
                pageX: e.pageX,
                pageY: e.pageY,
            });

            // lock drag
            model.$draging = true;
            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
        },
        handleGripMousedown(e, grip = 'se') {
            this.onGripChange(grip, e);
        },
        handleMoveMousedown(e) {
            const sx = e.screenX;
            const sy = e.screenY;
            const left = this.model.left;
            const top = this.model.top;
            let moving = true;
            const onMove = (e) => {
                if (!moving) return;
                e.preventDefault();
                e.stopPropagation();
                const offsetX = (e.screenX - sx) / this.editor.zoom;
                const offsetY = (e.screenY - sy) / this.editor.zoom;
                this.editor.changeElement({ left: left + offsetX, top: top + offsetY }, this.model);
            };
            const onUp = (e) => {
                e.stopPropagation();
                moving = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
    },
};
</script>
<style lang="less">
.table-controller-transform {
    &__grip {
        position: absolute;
        z-index: 9;
        padding: 8px;

        > b {
            display: block;
            box-sizing: border-box;
            background: #fff;
            border: 1px solid #c0c5cf;
            border-radius: 6px;
            box-shadow: 0 0 2px 0 rgba(86, 90, 98, 0.2);
        }

        &-e {
            right: -11px;
            top: 50%;
            transform: translateY(-50%);
            b {
                width: 7px;
                height: 14px;
            }
        }
        &-s {
            bottom: -11px;
            left: 50%;
            transform: translateX(-50%);
            b {
                height: 7px;
                width: 14px;
            }
        }
        &-se {
            bottom: -13px;
            right: -13px;
            b {
                width: 12px;
                height: 12px;
            }
        }
    }

    &__rotator {
        position: absolute;
        top: calc(100% + 20px);
        left: calc(50% - 11px);
        > b {
            display: inline-block;
            background-image: svg-load('../assets/rotator.svg', fill=#757575);
            position: relative;
            width: 22px;
            height: 22px;
            box-sizing: border-box;
            display: block;
            background-size: 100% 100%;
            span {
                position: absolute;
                top: 40px;
                left: 50%;
                height: 28px;
                padding: 0 8px;
                font-size: 12px;
                font-style: normal;
                font-weight: normal;
                line-height: 28px;
                color: white;
                background: #0e1217;
                border-radius: 4px;
                transform: translateX(-50%);
            }
        }
    }

    &__translator {
        position: absolute;
        top: calc(50% - 11px);
        right: -40px;
        > b {
            display: inline-block;
            width: 22px;
            height: 22px;
            box-sizing: border-box;
            display: block;
            background-size: 100% 100%;
            background-image: url('../assets/move.svg');
            cursor: inherit;
        }
    }
}
</style>
