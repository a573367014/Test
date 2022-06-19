<style lang="less">
.eui-v2-header-container {
    position: absolute;
    right: 0;
    display: flex;
    justify-content: left;
    flex-direction: row;
    align-items: center;
    background-color: white;
    border-bottom: 1px solid @main-background-color;
    box-sizing: content-box;

    .eui-v2-buttons-bar {
        &:not(.eui-v2-buttons-bar--dropdown) {
            .eui-v2-divide-line {
                margin: 0 12px;
            }

            .eui-v2-button {
                font-size: 12px;
                line-height: 17px;

                &__icon--only {
                    padding: 12px 10px;
                    font-size: 20px;
                }
            }
        }
    }

    &__title {
        justify-self: left;
        margin-left: 20px;
        font-size: 22px;
        display: flex;
        align-items: center;
        flex-shrink: 1;

        .eui-v2-button {
            height: 40px;

            &__icon--only {
                font-size: 20px;
                padding: 6px 10px;
            }
        }
    }

    &__left {
        justify-self: left;
        text-align: left;

        > .eui-v2-buttons-bar:first-child {
            margin-left: 29px;
        }
    }

    &__center {
        flex-grow: 1;
        text-align: center;
        justify-self: center;
    }

    &__right {
        display: flex;
        justify-content: right;
        justify-items: center;
        flex-shrink: 0;

        .eui-v2-button {
            margin-right: 6px;

            &--middle {
                padding: 9px 20px;
            }

            &:last-child {
                margin-right: 8px;
            }
        }

        .eui-v2-buttons-bar {
            &:not(.eui-v2-buttons-bar--dropdown) {
                border-left: @button-border;

                .eui-v2-button {
                    border-radius: 0;
                    height: @header-bar-height;
                    font-size: 14px;
                    padding: 17px 18px 18px;
                    box-sizing: border-box;
                    text-align: center;
                    border: none;
                    margin-left: 0;

                    &:last-child {
                        border-radius: 0;
                    }

                    &:first-child {
                        border-radius: 0;
                    }
                }
            }
        }

        .eui-v2-buttons-bar--dropdown {
            margin-right: 6px;

            &:last-child {
                margin-right: 8px;
            }

            .eui-v2-dropdown-button {
                padding-left: 4px;
                padding-right: 4px;
            }

            .eui-v2-dropdown-button__suffix {
                padding-left: 7px;
                padding-right: 7px;
            }
            .eui-v2-dropdown-button__suffix__icon {
                border-color: #fff transparent transparent;
            }

            .eui-v2-button {
                margin-right: 0;
            }
        }
    }
}
</style>

<template>
    <div class="eui-v2-header-container" :style="style">
        <slot>
            <div class="eui-v2-header-container__title">
                <slot name="title" />
            </div>
            <div class="eui-v2-header-container__left">
                <slot name="left" />
            </div>
            <div class="eui-v2-header-container__center">
                <slot name="center" />
            </div>
            <div class="eui-v2-header-container__right">
                <slot name="right" />
            </div>
        </slot>
    </div>
</template>

<script>
export default {
    props: {
        __top: {
            type: Number,
            default: 0,
        },
        __left: {
            type: Number,
            default: 0,
        },
        height: {
            type: Number,
            default: 54,
        },
    },
    computed: {
        style: function () {
            const { height, __top, __left } = this;
            return {
                top: `${__top}px`,
                left: `${__left}px`,
                height: `${height}px`,
            };
        },
    },
};
</script>
