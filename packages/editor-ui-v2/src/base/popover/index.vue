<style lang="less">
    .eui-v2-popover {
        position: relative;
        background-color: @white-color;
        padding: 16px;
        border-radius: 2px;
        border: @button-border;

        .eui-v2-popover-header {
            color: black;
            font-size: 16px;
            line-height: 22px;
            margin-bottom: 8px;
        }

        .eui-v2-popover-content {
            font-size: 14px;
            line-height: 20px;
            color: @normal-color;
        }

        .eui-v2-popover-footer {
            text-align: right;
            margin-top: 24px;

            .eui-v2-button {
                padding-top: 6px;
                padding-bottom: 6px;
                font-size: 13px;
                line-height: 18px;
            }
        }
    }
</style>

<template>
    <eui-v2-popup
        :placement="placement"
        :visible="visible"
        :boundariesPadding="boundariesPadding"
        @update:visible="this.onVisibleUpdate"
        @update:placement="onChangePlacement"
        :classes="popoverClass" >
        <slot />
        <template slot="content">
            <div :class="classes" :style="style">
                <div class="eui-v2-popover-header" v-if="title">{{ title }}</div>
                <div class="eui-v2-popover-content" v-if="$slots.content"><slot name="content" /></div>
                <div class="eui-v2-popover-footer" v-if="$slots.footer"><slot name="footer" /></div>
            </div>
        </template>
    </eui-v2-popup>
</template>

<script>
import Popup from '../popup';

export default {
    components: {
        'eui-v2-popup': Popup
    },
    props: {
        placement: {
            type: String,
            default: () => 'top-start'
        },
        visible: {
            type: Boolean,
            default: () => false
        },
        boundariesPadding: {
            type: Number,
            default: () => 6
        },
        title: {
            type: String,
            default: () => ''
        },
        width: {
            type: Number,
            default: () => 300
        },
        popoverClass: {
            type: [Object, String, Array],
            default: () => ''
        },
        wrapClass: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            realPlacement: ''
        };
    },
    computed: {
        hasFooter() {
            return this.$scopedSlots.footer || this.$slots.footer;
        },
        classes() {
            const { computedPlacement } = this;
            return ['eui-v2-popover', `eui-v2-popover-${computedPlacement}`, this.wrapClass];
        },
        style() {
            const { width } = this;
            return {
                width: `${width}px`
            };
        },
        computedPlacement() {
            const { placement, realPlacement } = this;
            return realPlacement || placement;
        }
    },
    methods: {
        onVisibleUpdate(value) {
            this.$emit('update:visible', value);
        },
        onChangePlacement(placement) {
            this.realPlacement = placement;
        }
    }
};
</script>
