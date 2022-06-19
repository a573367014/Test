<style lang="less">
    .eui-v2-tooltip {
        z-index: 10;
        pointer-events: none;

        .fade-enter-active, .fade-leave-active {
            transition: opacity .15s ease-out;
        }

        .fade-enter, .fade-leave-to {
            opacity: 0;
        }

        .eui-v2-tooltip-content {
            left: -100px;
            top: -100px;

            padding: 6px 8px;
            background-color: @dark-color;
            border-radius: 2px;
            white-space: nowrap;

            font-size: 13px;
            line-height: 18px;
            color: white;

            &.eui-v2-tooltip-content-top {

                &::before {
                    border-width: 5px 5px 0 5px;
                    border-color: @dark-color transparent transparent transparent;
                    bottom: -5px;
                }
            }

            &.eui-v2-tooltip-content-left {

                &::before {
                    border-width: 5px 0 5px 5px;
                    border-color: transparent transparent transparent @dark-color;
                    right: -5px;
                }
            }

            &.eui-v2-tooltip-content-right {

                &::before {
                    border-width: 5px 5px 5px 0;
                    border-color: transparent @dark-color transparent transparent;
                    left: -5px;
                }
            }

            &.eui-v2-tooltip-content-bottom {
                &::before {
                    border-width: 0 5px 5px 5px;
                    border-color: transparent transparent @dark-color transparent;
                    top: -5px;
                }
            }

            &.eui-v2-tooltip-content-left, &.eui-v2-tooltip-content-right {
                &.eui-v2-tooltip-content-start::before {
                    top: 12px;
                }

                &.eui-v2-tooltip-content-center::before {
                    top: 50%;
                    transform: translateY(-50%);
                }

                &.eui-v2-tooltip-content-end::before {
                    bottom: 12px;
                }
            }

            &.eui-v2-tooltip-content-top, &.eui-v2-tooltip-content-bottom {
                &.eui-v2-tooltip-content-start::before {
                    left: 12px;
                }

                &.eui-v2-tooltip-content-center::before {
                    left: 50%;
                    transform: translateX(-50%);
                }


                &.eui-v2-tooltip-content-end::before {
                    right: 12px;
                }
            }

            &::before {
                content: '';
                width: 0;
                height: 0;
                border-style: solid;
                position: absolute;
            }
        }
    }
</style>

<template>
    <PopupBase
        v-bind="$attrs"
        :classes="popupClass"
        :placement="placement"
        @update:placement="onPlacementChange">
        <slot />
        <template slot="popup">
            <transition name="fade">
                <div
                    class="eui-v2-tooltip-content"
                    ref="content"
                    :class="contentClass"
                    :style="style"
                    v-show="show && content">
                    <slot name="content">
                        {{ content }}
                    </slot>
                </div>
            </transition>
        </template>
    </PopupBase>
</template>

<script>
import PopupBase from '../popup-base';

export default {
    components: {
        PopupBase
    },
    props: {
        placement: {
            type: String,
            default: 'top-center'
        },
        disabled: {
            type: Boolean,
            default: false
        },
        content: {
            type: String,
            default: ''
        },
        visible: {
            type: Boolean,
            default: false
        },
        classes: {
            type: [String, Object, Array],
            default: ''
        },
        trigger: {
            type: String,
            default: 'hover'
        }
    },
    data: () => {
        return {
            left: 0,
            top: 0,
            active: false,
            styleCache: {},
            realPlacement: ''
        };
    },
    computed: {
        contentClass() {
            const placements = this.computedPlacement.split('-');
            return `eui-v2-tooltip-content-${placements[0] || 'top'} eui-v2-tooltip-content-${placements[1] || 'center'}`;
        },
        style() {
            const { left, top } = this;
            return {
                left: `${left}px`,
                top: `${top}px`
            };
        },
        show() {
            const vNode = this.getFirstComponentChild(this.$slots.default);
            const { active, visible, disabled } = this;
            return vNode && (visible || (active && !disabled));
        },
        popupClass() {
            const { classes } = this;
            return ['eui-v2-tooltip', classes];
        },
        computedPlacement() {
            const { placement, realPlacement } = this;
            return realPlacement || placement;
        }
    },
    watch: {
        disabled(value) {
            if(value) {
                this.active = false;
            }
        }
    },

    mounted() {
        this.$nextTick(() => {
            this.initEvent();
        });
    },

    activated() {
        this.initEvent();
    },

    deactivated() {
        this.removeEvent();
    },

    beforeDestroy() {
        this.removeEvent();
    },

    methods: {
        initEvent() {
            if(this.trigger === 'click') {
                this.$el.addEventListener('click', this.onClick);
            }
            if(this.trigger === 'hover') {
                this.$el.addEventListener('mouseenter', this.onMouseEnter);
                this.$el.addEventListener('mouseleave', this.onMouseLeave);
            }
        },
        removeEvent() {
            this.$el.removeEventListener('click', this.onClick);
            this.$el.removeEventListener('mouseenter', this.onMouseEnter);
            this.$el.removeEventListener('mourseleave', this.onMouseLeave);
        },
        onMouseEnter() {
            this.active = true;
        },
        onMouseLeave() {
            this.active = false;
        },
        onClick() {
            if(!this.content) {
                return;
            }
            this.active = true;
            setTimeout(() => {
                // 只有在激活状态下需要绑定事件用于控制隐藏
                if(this.active) {
                    const handleClick = () => {
                        this.active = false;
                        document.body.removeEventListener('click', handleClick);
                    };
                    document.body.addEventListener('click', handleClick);
                }
            });
        },
        getFirstComponentChild(children) {
            if(children) {
                for(let i = 0; i < children.length; i++) {
                    if(children[i] && children[i].tag) {
                        return children[i];
                    }
                }
            }
        },
        onPlacementChange(placement) {
            this.realPlacement = placement;
        }
    }
};

</script>
