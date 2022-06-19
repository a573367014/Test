<style lang="less">
.eui-v2-collapse-container {
    position: absolute;
    bottom: 0;
    width: @collapse-bar-width;
    background-color: white;
    z-index: 1;
    box-sizing: content-box;
    border-left: 1px solid @main-background-color;

    .eui-v2-collapse-panel {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        // overflow-y: auto;
        // overflow-x: hidden;
        z-index: 1;
    }

    &__close {
        position: absolute;
        right: 20px;
        top: 50%;
        margin-top: -32px;
        transform: translate3d(40px, 0, 0);
        transition: transform 0.1s ease;

        &__content {
            width: 20px;
            height: 64px;
            cursor: pointer;
            background-image: url('./icon-collapse-close.png');
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center;
        }
    }
}

.eui-v2-collapse-container-enter-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
    .eui-v2-collapse-container__close {
        transform: translate3d(0, 0, 0);
    }
}

.eui-v2-collapse-container-leave-active {
    transition: width 0.15s ease 0.5s, left 0.15s ease 0.5s, opacity 0.15s ease,
        transform 0.15s ease;
    .eui-v2-tooltip {
        display: none;
    }
}

.eui-v2-collapse-container-enter,
.eui-v2-collapse-container-leave-to {
    width: 0 !important;
    opacity: 0;
    transform: translate3d(-300px, 0, 0);
}
</style>

<script>
import Tooltip from '../tooltip';

export default {
    props: {
        collapsed: {
            type: Boolean,
            default: false,
        },
        float: {
            type: Boolean,
            default: false,
        },
        cache: {
            type: Boolean,
            default: false,
        },
        width: {
            type: Number,
            default: 270,
        },
        showClose: {
            type: Boolean,
            default: false,
        },
        groupId: {
            type: String,
            default: '',
        },
        __width: {
            type: Number,
            default: 0,
        },
        __left: {
            type: Number,
            default: -1,
        },
        __right: {
            type: Number,
            default: -1,
        },
        __top: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        style() {
            const { __left, __top, __right } = this;
            return {
                top: `${__top}px`,
                left: __left >= 0 ? `${__left}px` : '',
                right: __right >= 0 ? `${__right}px` : '',
            };
        },
        containerWidth() {
            const { __width } = this;
            return {
                width: `${__width}px`,
            };
        },
        panelWidth() {
            const { width } = this;
            return {
                width: `${width}px`,
            };
        },
    },
    methods: {
        close() {
            this.$emit('close');
        },
    },
    render: function (h) {
        let body = null;
        const { collapsed, cache, containerWidth, showClose, panelWidth, style } = this;
        if (!collapsed || cache) {
            const children = [];
            const vNodes = this.$scopedSlots.default
                ? this.$scopedSlots.default()
                : this.$slots.default;

            if (vNodes) {
                vNodes.forEach((vNode) => {
                    const tag = vNode.tag;
                    if (tag) {
                        children.push(vNode);
                    }
                });
            }
            body = h(
                'div',
                {
                    class: 'eui-v2-collapse-container',
                    style: [style, containerWidth],
                    directives: cache
                        ? [
                              {
                                  name: 'show',
                                  value: !collapsed,
                              },
                          ]
                        : [],
                },
                [
                    <div class="eui-v2-collapse-panel">
                        <div style={panelWidth}>{children}</div>
                    </div>,
                    showClose ? (
                        <div class="eui-v2-collapse-container__close" onClick={this.close}>
                            <Tooltip
                                appendBody={false}
                                placement="right-center"
                                content="关闭侧边栏"
                            >
                                <div class="eui-v2-collapse-container__close__content" />
                            </Tooltip>
                        </div>
                    ) : null,
                ],
            );
        }
        return (
            <transition name="eui-v2-collapse-container" mode="out-in">
                {body}
            </transition>
        );
    },
};
</script>
