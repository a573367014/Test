<style lang="less">

    .eui-v2-confirm-dialog {
        position: fixed;
        z-index: 15;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;

        .eui-v2-confirm-dialog-mask {
            position: fixed;
            left: 0;
            top: 0;
            height: 100%;
            width: 100%;
            background-color: rgba(0, 0, 0, 0.3);
        }

        .eui-v2-confim-dialog-body {
            width: 400px;
            position: fixed;
            z-index: 1;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);

            background-color: @white-color;
            border-radius: 2px;
            padding: 24px;

            .eui-v2-confirm-dialog-title {
                font-size: 18px;
                line-height: 25px;
                color: #000;
                margin-bottom: 8px;
            }

            .eui-v2-confirm-dialog-content {
                font-size: 14px;
                line-height: 20px;
                color: @normal-color;
            }

            .eui-v2-confirm-dialog-footer {
                margin-top: 30px;
                text-align: right;

                .eui-v2-button {
                    padding: 8px 30px;
                }
            }
        }
    }
</style>

<template>
    <div class="eui-v2-confirm-dialog" v-if="visible">
        <div class="eui-v2-confirm-dialog-mask" />
        <div class="eui-v2-confim-dialog-body">
            <div class="eui-v2-confirm-dialog-title" v-if="title">
                {{ title }}
            </div>
            <div class="eui-v2-confirm-dialog-content">
                {{ content }}
            </div>
            <div class="eui-v2-confirm-dialog-footer">
                <eui-v2-button fill="clear" v-if="cancelText" @click="cancel">{{ cancelText }}</eui-v2-button>
                <eui-v2-button color="primary" v-if="confirmText" @click="confirm">{{ confirmText }}</eui-v2-button>
            </div>
        </div>
    </div>
</template>

<script>
import Button from '../button';
import { i18n } from '../../i18n';

export default {
    components: {
        'eui-v2-button': Button
    },
    props: {
        title: {
            type: String,
            default: () => ''
        },
        content: {
            type: String,
            default: () => ''
        },
        confirmText: {
            type: String,
            default: () => i18n.$tsl('确定')
        },
        cancelText: {
            type: String,
            default: () => i18n.$tsl('取消')
        },
        visible: {
            type: Boolean,
            default: () => false
        }
    },
    methods: {
        cancel() {
            this.$emit('cancel');
        },
        confirm() {
            this.$emit('confirm');
        }
    }
};
</script>
