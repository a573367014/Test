<style lang="less">
.eui-v2-collapse {
    @collapse: eui-v2-collapse;
    box-sizing: border-box;
    background: white;
    width: 100%;
    white-space: nowrap;

    &--normal {
        &.@{collapse} {
            box-shadow: 0px 2px 4px 0px rgba(0, 92, 249, .05);
            padding: 9px 0;
        }

        .@{collapse} {
            &:last-child {
                box-shadow: none;
            }

            &__content {
                padding: 9px 24px 15px;
                box-sizing: border-box;
                width: 100%;

                &.no-title {
                    padding-top: 18px;
                }

                .eui-v2-buttons-bar-block {
                    .eui-v2-button {
                        padding: 24px 23px 24px;
                        font-size: 13px;
                        line-height: 18px;
                        background-color: #FCFCFD;

                        .eui-v2-icon {
                            width: 18px;
                            height: 18px;
                        }

                        &__icon-inline {
                        padding: 13px 28px;
                        padding-left: 25px;
                        }
                    }
                }
            }

            &__title {
                font-size: 14px;
                line-height:20px;
                font-weight: 400;
                user-select: none;
                cursor: pointer;

                &--content {
                    padding: 9px 24px;
                }

                .eui-v2-background-image-button {
                    display: block;
                }
            }

            &.activated {
                .@{collapse}__title {
                    font-weight: 500;
                }
            }
        }
    }

    &--panel {
        &.@{collapse} {
            padding: 0;
            // border: 1px solid @border-color;
            // border-radius: @button-border-radius;
        }

        &.activated {
            .@{collapse}__title {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }

            .@{collapse}__title--content::before {
                display: none;
            }
        }

        .@{collapse} {
            &__title {
                border: 1px solid @border-color;
                border-radius: @button-border-radius;
                background-color: #F8FAFC;
                font-size: 14px;
                line-height: 20px;
                cursor: pointer;
                position: relative;

                &:hover {
                    border-color: @hover-border-color;
                    z-index: 1;
                }

                &--content {
                    padding: 10px 16px;
                }

                &__prefix {
                    .eui-v2-button--middle {
                        padding-right: 8px
                    }
                }
            }



            &__content {
                .eui-v2-sub-panel:first-child {
                    margin-top: -1px;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                }
            }
        }

    }

    &__conatiner-active {
        overflow: hidden;
        transition: height .25s ease-out;
    }

    &__conatiner-leave {
        overflow: hidden;
        transition: height .15s ease-out;
    }

    &__title {

        &--content {
            padding-right: 42px;
            position: relative;
            user-select: none;

            &::before {
                position: absolute;
                content: '';
                border-style: solid;
                border-width: 4px 4px 0 4px;
                border-color: @normal-color transparent transparent transparent;
                width: 0;
                height: 0;
                right: 16px;
                top: 17px;
                transition: transform .2s ease-out;
            }
        }

        &--has-prefix {
            display: flex;
            justify-content: left;
            align-items: center;

            .@{collapse}__title {
                &--content {
                    padding-left: 0;
                    flex-grow: 1;
                }
            }
        }
    }

    &.activated {
        .@{collapse}__title--content::before {
            transform: rotate(180deg);
        }
    }

    &.disabled {
        .@{collapse}__title {
            cursor: not-allowed;

            &--content::before {
                display: none;
            }
        }
    }
}


</style>

<template>
    <div
        class="eui-v2-collapse"
        :class="innerClass">
        <div
            class="eui-v2-collapse__title"
            :class="{ 'eui-v2-collapse__title--has-prefix': hasTitlePrefix }"
            @click="toggleActive">

            <slot name="title">
                <div v-if="hasTitlePrefix" class="eui-v2-colla[se__title__prefix">
                    <slot name="titlePrefix" />
                </div>
                <div v-if="title" class="eui-v2-collapse__title--content">
                    {{ title }}
                </div>
            </slot>
        </div>
        <slot name="head"></slot>
        <transition
            enter-active-class="eui-v2-collapse__conatiner-active"
            leave-active-class="eui-v2-collapse__conatiner-leave"
            @before-enter="beforeEnter"
            @enter="enter"
            @after-enter="afterEnter"
            @before-leave="beforeLeave"
            @leave="leave"
            @after-leave="afterLeave">
            <div
                v-show="activated"
                ref="content">
                <div class="eui-v2-collapse__content" :class="{'no-title': !title}">
                    <slot></slot>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    components: {
    },

    props: {
        title: {
            type: String,
            default: () => ''
        },
        collapsed: {
            type: Boolean,
            default: () => true
        },
        disabled: {
            type: Boolean,
            default: () => false
        },
        type: {
            type: String,
            default: 'normal',
            validator: function(value) {
                return ['normal', 'panel'].includes(value);
            }
        }
    },
    computed: {
        activated() {
            return !this.collapsed;
        },
        hasTitleSlot() {
            return this.$scopedSlots.title || this.$slots.title;
        },
        innerClass() {
            const { type, activated, disabled } = this;
            return [`eui-v2-collapse--${type}`, {
                'activated': activated,
                'disabled': disabled
            }];
        },
        hasTitlePrefix() {
            const slots = this.$scopedSlots.titlePrefix ? this.$scopedSlots.titlePrefix() : this.$slots.titlePrefix;
            return slots && slots.length;
        },
    },
    methods: {
        toggleActive() {
            if(!this.disabled) {
                this.$emit('click-collapsed', this.collapsed);
            }
        },

        beforeEnter(el) {
            el.style.height = 0;
        },
        enter(el) {
            el.style.height = `${el.children[0].clientHeight}px`;
        },
        afterEnter(el) {
            el.style.height = 'auto';
            this.$emit('expand');
        },
        beforeLeave(el) {
            el.style.height = `${el.children[0].clientHeight}px`;
        },
        leave(el) {
            // beforeLeave 中对元素高度的修改在这时还没有影响到 dom 元素
            // 这样会导致如果元素一开始没有设置高度的话无法触发过渡动画
            // 这边使用 setTimeout 保证 beforeLeave 中的修改被 dom 执行
            setTimeout(() => {
                el.style.height = 0;
            });
        },
        afterLeave(el) {
            el.style.height = 'auto';
            this.$emit('collapse');
        }
    }
};
</script>
