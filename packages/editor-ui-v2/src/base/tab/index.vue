<style lang="less">
    .eui-v2-tab {
        font-size: 16px;
        line-height: 22px;
        color: @normal-color;
        padding: 17px 16px 17px;
        position: relative;
        cursor: pointer;
        font-weight: 400;

        border: none;
        outline: none;
        user-select: none;
        background-color: white;

        &:hover {
            color: black;
        }

        &.activated, &:active {
            color: #33383E;
            font-weight: 500;
        }

        &[disabled], &:disabled, &.disabled {
            color: @disabled-color;
            cursor: not-allowed;
        }

        .eui-v2-tab-content {
            position: relative;
            white-space: nowrap;
            .eui-v2-tab-tip {
                font-size: 8px;
                line-height: 11px;
                font-weight: 400;
                position: absolute;
                top: -4px;
                left: 100%;
                white-space: nowrap;
            }

            .eui-v2-tab-template-tip {
                position: absolute;
            }
        }
    }
</style>

<template>
    <button class="eui-v2-tab" :class="{'activated': activated}" :disabled="disabled">
        <div class="eui-v2-tab-content">
            <slot>
                {{ content }}
                <span class="eui-v2-tab-tip" v-if="tip">
                    {{ tip }}
                </span>
            </slot>
            <slot name="tip" />
        </div>
    </button>
</template>


<script>
export default {
    props: {
        name: {
            type: String,
            required: true
        },
        content: {
            type: String,
            default: ''
        },
        tip: {
            type: String,
            default: null
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            activated: false
        };
    },
    watch: {
        disabled() {
            const parent = this.$parent;
            parent.$emit('tab.disabledChange', {
                name: this.name,
                content: this.content,
                disabled: this.disabled
            });
        }
    }
};

</script>
