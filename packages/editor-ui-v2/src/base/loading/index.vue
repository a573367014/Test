<style lang="less">
@keyframes rotation {
    100% {
        transform: rotate(360deg);
    }
}

.eui-v2-loading-lock {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 11;
}
.eui-v2-loading {
    position: fixed;
    z-index: 11;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 6px;
    padding: 28px 12px;
    user-select: none;
    min-width: 138px;

    .eui-v2-loading-loader {
        text-align: center;

        .eui-v2-icon {
            margin: 0 auto;
            font-size: 36px;
            color: white;
        }
    }

    .eui-v2-loading-content {
        margin-top: 14px;
        color: @white-color;
        font-size: 14px;
        line-height: 20px;
        text-align: center;
    }

    .eui-v2-loading-button {
        font-size: 12px;
        line-height: 17px;
        border: none;
        background: transparent;
        color: @white-color;
        outline: none;
        padding: 4px 7px;
        margin-top: 4px;
        margin-bottom: -7px;
        cursor: pointer;

        &:hover {
            opacity: 0.7;
        }

        &:active {
            opacity: 0.6;
        }
    }
}
</style>

<template>
    <div v-if="show">
        <div class="eui-v2-loading-lock" v-if="lock"></div>
        <div class="eui-v2-loading" :style="position" ref="loading">
            <div class="eui-v2-loading-loader" v-if="loader">
                <eui-v2-icon name="loader" />
            </div>
            <div class="eui-v2-loading-content" v-if="content">
                <span>{{ content }}</span>
                <div v-if="cancelable">
                    <button class="eui-v2-loading-button" @click="cancel">{{ cancelText }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { i18n } from '../../i18n';
import Icon from '../icon';

export default {
    components: {
        'eui-v2-icon': Icon,
    },
    props: {
        show: {
            type: Boolean,
            default: () => false,
        },
        lock: {
            type: Boolean,
            default: () => false,
        },
        content: {
            type: String,
            default: () => i18n.$tsl('加载中'),
        },
        cancelable: {
            type: Boolean,
            default: () => false,
        },
        cancelText: {
            type: String,
            default: () => i18n.$tsl('取消'),
        },
        loader: {
            type: Boolean,
            default: () => true,
        },
    },
    data: function () {
        return {
            left: 0,
            top: 0,
        };
    },
    computed: {
        position() {
            const { left, top } = this;
            return {
                left: `${left}px`,
                top: `${top}px`,
            };
        },
    },
    watch: {
        show: function () {
            this.$nextTick(() => {
                if (this.show) {
                    this.updatePosition();
                }
            });
        },
    },
    mounted() {
        this.$nextTick(() => {
            if (this.show) {
                this.updatePosition();
            }
        });
    },
    methods: {
        cancel() {
            this.$emit('cancel');
        },
        updatePosition() {
            const $el = this.$el;
            if ($el) {
                const {
                    left: parentLeft,
                    top: parentTop,
                    width: parentWidth,
                    height: parentHeight,
                } = $el.parentElement.getBoundingClientRect();
                const { width, height } = this.$refs.loading.getBoundingClientRect();

                this.left = parentLeft + (parentWidth - width) / 2;
                this.top = parentTop + (parentHeight - height) / 2;
            }
        },
    },
};
</script>
